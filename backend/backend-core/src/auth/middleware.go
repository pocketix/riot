package auth

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/maypok86/otter"
	"golang.org/x/sync/singleflight"
	"net/http"
	"strconv"
	"time"
)

var (
	jwtAuthenticationMiddlewareEnabled      = sharedUtils.GetFlagEnvironmentVariableValue("JWT_AUTHENTICATION_MIDDLEWARE_ENABLED").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production
	sameOriginExpiredSessionJWTRequestGroup singleflight.Group
	ttlCache                                = setupTTLCache()
)

func setupTTLCache() otter.Cache[string, struct{}] {
	c, err := otter.MustBuilder[string, struct{}](1000).WithTTL(1 * time.Second).Build()
	if err != nil {
		panic("cache setup failure: " + err.Error())
	}
	return c
}

func JWTAuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if !jwtAuthenticationMiddlewareEnabled || websocket.IsWebSocketUpgrade(r) {
			next.ServeHTTP(w, r)
			return
		}

		if isCookieSet(r, SessionJWTCookieIdentifier) {
			sessionJWT, err := parseJWT(getSessionJWTCookieValue(r).GetPayload())
			if err != nil {
				http.Error(w, "failed to parse session JWT | session JWT is likely corrupted", http.StatusUnauthorized)
				return
			}

			if isJWTValid(sessionJWT) {
				jwtPayloadExtractionResult := extractJWTPayload(sessionJWT.Raw)
				if jwtPayloadExtractionResult.IsFailure() {
					http.Error(w, "failed to extract JWT payload | session JWT is likely corrupted", http.StatusUnauthorized)
					return
				}
				jwtPayload := jwtPayloadExtractionResult.GetPayload()
				next.ServeHTTP(w, r.WithContext(WithJWTPayload(r.Context(), jwtPayload)))
				return
			}

			timeUntilSessionJWTExpiryResult := getTimeUntilJWTExpiry(sessionJWT)
			if timeUntilSessionJWTExpiryResult.IsFailure() {
				http.Error(w, "failed to check session JWT expiry | session JWT is likely corrupted", http.StatusInternalServerError)
				return
			}
			timeUntilSessionJWTExpiry := timeUntilSessionJWTExpiryResult.GetPayload()
			if timeUntilSessionJWTExpiry > 0 {
				http.Error(w, "session JWT is likely corrupted", http.StatusUnauthorized)
				return
			}
		}

		refreshToken := getRefreshTokenCookieValue(r).GetPayloadOrDefault("")
		if refreshToken == "" {
			http.Error(w, "expired session JWT | missing refresh token", http.StatusUnauthorized)
			return
		}

		refreshTokenHash := sharedUtils.GenerateHexHash(refreshToken)
		if ttlCache.Has(refreshTokenHash) {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "User session refresh in progress. Please retry shortly.", http.StatusConflict)
			return
		}

		resultObject, err, _ := sameOriginExpiredSessionJWTRequestGroup.Do(refreshTokenHash, func() (any, error) {
			ttlCache.Set(refreshTokenHash, struct{}{})
			return performSessionRefresh(refreshTokenHash)
		})

		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to generate new session JWT using refresh token: %s", err.Error()), http.StatusUnauthorized)
			return
		}
		sessionRefreshResultObject := resultObject.(*sessionRefreshResult)

		err = setupSessionJWTCookie(w, sessionRefreshResultObject.newSessionJWT)
		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to set up session JWT cookie: %s", err.Error()), http.StatusUnauthorized)
			return
		}
		setupRefreshTokenCookie(w, sessionRefreshResultObject.newRefreshToken, sessionRefreshResultObject.refreshTokenExpiresIn)

		jwtPayloadExtractionResult := extractJWTPayload(sessionRefreshResultObject.newSessionJWT)
		if jwtPayloadExtractionResult.IsFailure() {
			http.Error(w, "failed to extract JWT payload", http.StatusUnauthorized)
			return
		}
		jwtPayload := jwtPayloadExtractionResult.GetPayload()
		next.ServeHTTP(w, r.WithContext(WithJWTPayload(r.Context(), jwtPayload)))
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
		refreshTokenExpiresIn: time.Until(userSession.ExpiresAt),
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
