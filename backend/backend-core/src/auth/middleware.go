package auth

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"golang.org/x/sync/singleflight"
	"net/http"
	"time"
)

var (
	jwtAuthenticationMiddlewareEnabled      = sharedUtils.GetFlagEnvironmentVariableValue("JWT_AUTHENTICATION_MIDDLEWARE_ENABLED").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production
	sameOriginExpiredSessionJWTRequestGroup singleflight.Group
)

func JWTAuthenticationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !jwtAuthenticationMiddlewareEnabled {
			next.ServeHTTP(w, r)
			return
		}

		if isCookieSet(r, SessionJWTCookieIdentifier) {
			sessionJWT, err := parseJWT(getSessionJWTCookieValue(r).GetPayload())
			if err != nil {
				http.Error(w, "failed to parse session JWT", http.StatusUnauthorized)
				return
			}

			if isJWTValid(sessionJWT) {
				next.ServeHTTP(w, r)
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

		next.ServeHTTP(w, r)
	})
}

type sessionRefreshResult struct {
	newSessionJWT         string
	newRefreshToken       string
	refreshTokenExpiresAt time.Time
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
	newSessionJWT, err := createSessionJWT(fmt.Sprintf("%d", userSession.UserID))
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
