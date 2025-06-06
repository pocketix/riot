package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/sync/singleflight"
	"net/http"
	"strconv"
	"time"
)

const (
	UserIdContextIdentifier           = "userID"
	APIAccessSummaryContextIdentifier = "apiAccessSummary"
)

var (
	jwtAuthenticationMiddlewareEnabled      = sharedUtils.GetFlagEnvironmentVariableValue("JWT_AUTHENTICATION_MIDDLEWARE_ENABLED").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production
	sameOriginExpiredSessionJWTRequestGroup singleflight.Group
)

func JWTAuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		setupContextThenProceed := func(jwtPayload JWTPayload) {
			ctx := context.WithValue(r.Context(), UserIdContextIdentifier, jwtPayload.UserID)
			ctx = context.WithValue(ctx, APIAccessSummaryContextIdentifier, jwtPayload.APIAccessSummary)
			next.ServeHTTP(w, r.WithContext(ctx))
		}

		if !jwtAuthenticationMiddlewareEnabled { // TODO: Should we disable both authentication and authorization at once?!
			ctx := context.WithValue(r.Context(), UserIdContextIdentifier, uint(0))
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		if isCookieSet(r, SessionJWTCookieIdentifier) {
			sessionJWT, err := parseJWT(getSessionJWTCookieValue(r).GetPayload())
			if err != nil {
				http.Error(w, "failed to parse session JWT", http.StatusUnauthorized)
				return
			}

			if isJWTValid(sessionJWT) {
				jwtPayloadExtractionResult := extractJWTPayload(sessionJWT.Raw)
				if jwtPayloadExtractionResult.IsFailure() {
					http.Error(w, "failed to extract JWT payload", http.StatusUnauthorized)
					return
				}
				setupContextThenProceed(jwtPayloadExtractionResult.GetPayload())
				return
			}

			timeUntilSessionJWTExpiryResult := getTimeUntilJWTExpiry(sessionJWT)
			if timeUntilSessionJWTExpiryResult.IsFailure() {
				http.Error(w, "failed to check session JWT expiry", http.StatusInternalServerError)
				return
			}

			if timeUntilSessionJWTExpiryResult.GetPayload() > 0 {
				http.Error(w, "invalid session JWT", http.StatusUnauthorized)
				return
			}
		}

		refreshToken := getRefreshTokenCookieValue(r).GetPayloadOrDefault("")
		if refreshToken == "" {
			http.Error(w, "expired session JWT | missing refresh token", http.StatusUnauthorized)
			return
		}

		refreshTokenHash := sharedUtils.GenerateHexHash(refreshToken)
		rawSessionRefreshResultObject, err, _ := sameOriginExpiredSessionJWTRequestGroup.Do(refreshTokenHash, func() (any, error) {
			return performSessionRefresh(refreshTokenHash)
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to generate new session JWT using refresh token: %s", err.Error()), http.StatusUnauthorized)
			return
		}
		sessionRefreshResultObject := rawSessionRefreshResultObject.(*sessionRefreshResult)

		err = setupSessionJWTCookie(w, sessionRefreshResultObject.newSessionJWT)
		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to set up session JWT cookie: %s", err.Error()), http.StatusUnauthorized)
			return
		}

		setupRefreshTokenCookie(w, sessionRefreshResultObject.newRefreshToken, time.Until(sessionRefreshResultObject.refreshTokenExpiresAt))

		jwtPayloadExtractionResult := extractJWTPayload(sessionRefreshResultObject.newSessionJWT)
		if jwtPayloadExtractionResult.IsFailure() {
			http.Error(w, "failed to extract JWT payload", http.StatusUnauthorized)
			return
		}
		setupContextThenProceed(jwtPayloadExtractionResult.GetPayload())
	})
}

func extractJWTPayload(jwtString string) sharedUtils.Result[JWTPayload] {
	sessionJWT, err := parseJWT(jwtString)
	if err != nil {
		return sharedUtils.NewFailureResult[JWTPayload](err)
	}
	subject, err := sessionJWT.Claims.GetSubject()
	if err != nil {
		return sharedUtils.NewFailureResult[JWTPayload](err)
	}
	u64, err := strconv.ParseUint(subject, 10, 32)
	if err != nil {
		return sharedUtils.NewFailureResult[JWTPayload](err)
	}
	userID := uint(u64)
	mapClaims, ok := sessionJWT.Claims.(jwt.MapClaims)
	if !ok {
		return sharedUtils.NewFailureResult[JWTPayload](errors.New("couldn't cast Claims to MapClaims"))
	}
	rawAPIAccessSummary, exists := mapClaims["apiAccessSummary"] // any (interface{}) type
	if !exists {
		return sharedUtils.NewFailureResult[JWTPayload](errors.New("apiAccessSummary claim not found"))
	}
	// TODO: Two options here: either use custom claims struct or re-serialize - choosing the latter now...
	apiAccessSummaryReSerializationResult := sharedUtils.SerializeToJSON(rawAPIAccessSummary)
	if apiAccessSummaryReSerializationResult.IsFailure() {
		return sharedUtils.NewFailureResult[JWTPayload](apiAccessSummaryReSerializationResult.GetError())
	}
	reSerializedAPIAccessSummary := apiAccessSummaryReSerializationResult.GetPayload()
	apiAccessSummaryDeserializationResult := sharedUtils.DeserializeFromJSON[APIAccessSummary](reSerializedAPIAccessSummary)
	if apiAccessSummaryDeserializationResult.IsFailure() {
		return sharedUtils.NewFailureResult[JWTPayload](apiAccessSummaryDeserializationResult.GetError())
	}
	apiAccessSummary := apiAccessSummaryDeserializationResult.GetPayload()
	return sharedUtils.NewSuccessResult(JWTPayload{
		UserID:           userID,
		APIAccessSummary: apiAccessSummary,
	})
}

func performSessionRefresh(refreshTokenHash string) (*sessionRefreshResult, error) {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	userSessionLoadResult := dbClientInstance.LoadUserSessionBasedOnRefreshTokenHash(refreshTokenHash)
	if userSessionLoadResult.IsFailure() {
		return nil, fmt.Errorf("database operation error - failed to load user session record: %w", userSessionLoadResult.GetError())
	}
	userSessionOptional := userSessionLoadResult.GetPayload()
	if userSessionOptional.IsEmpty() {
		return nil, errors.New("no user session record found based on refresh token hash")
	}
	userSession := userSessionOptional.GetPayload()
	if userSession.Revoked {
		return nil, errors.New("the refresh token has been revoked")
	}
	if time.Until(userSession.ExpiresAt) <= 0 {
		return nil, errors.New("the session has expired")
	}
	userID := userSession.UserID
	apiAccessSummary, err := determineAPIAccess(userID).Unwrap()
	if err != nil {
		return nil, err
	}
	newSessionJWT, err := createSessionJWT(userID, apiAccessSummary)
	if err != nil {
		return nil, err
	}
	newRefreshToken := sharedUtils.GenerateRandomAlphanumericString(16)
	userSession.RefreshTokenHash = sharedUtils.GenerateHexHash(newRefreshToken)
	userSessionPersistResult := dbClientInstance.PersistUserSession(userSession)
	if userSessionPersistResult.IsFailure() {
		return nil, fmt.Errorf("database operation error - failed to persist user session record: %w", userSessionPersistResult.GetError())
	}
	return &sessionRefreshResult{
		newSessionJWT:         newSessionJWT,
		newRefreshToken:       newRefreshToken,
		refreshTokenExpiresAt: userSession.ExpiresAt,
	}, nil
}

func IsFieldAccessAuthorized(apiAccessSummary APIAccessSummary, fieldIdentifier string) sharedUtils.Result[FieldAccessAuthorizationCheckResult] {
	userAuthorized := sharedUtils.NewSetFromSlice(apiAccessSummary.AuthorizedFieldSet).Contains(fieldIdentifier)
	if userAuthorized {
		return sharedUtils.NewSuccessResult(FieldAccessAuthorizationCheckResult{
			UserAuthorized:                      true,
			AuthorizationDenialType:             nil,
			SourceOfExplicitAuthorizationDenial: nil,
		})
	}
	sourceOfExplicitAuthorizationDenial, keyExists := apiAccessSummary.UnauthorizedFieldMap[fieldIdentifier]
	if !keyExists {
		return sharedUtils.NewSuccessResult(FieldAccessAuthorizationCheckResult{
			UserAuthorized:                      false,
			AuthorizationDenialType:             sharedUtils.NewOptionalOf(Implicit).ToPointer(),
			SourceOfExplicitAuthorizationDenial: nil,
		})
	} else {
		return sharedUtils.NewSuccessResult(FieldAccessAuthorizationCheckResult{
			UserAuthorized:                      false,
			AuthorizationDenialType:             sharedUtils.NewOptionalOf(Explicit).ToPointer(),
			SourceOfExplicitAuthorizationDenial: &sourceOfExplicitAuthorizationDenial,
		})
	}
}
