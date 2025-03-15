package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"golang.org/x/sync/singleflight"
	"net/http"
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

		refreshJWTCookieValue := getRefreshJWTCookieValue(r).GetPayloadOrDefault("")
		if refreshJWTCookieValue == "" {
			http.Error(w, "expired session JWT | missing refresh JWT", http.StatusUnauthorized)
			return
		}

		refreshJWTString := getRefreshJWTCookieValue(r).GetPayload()
		if refreshJWTString == "" {
			http.Error(w, "expired session JWT | cannot attempt to generate new session JWT using refresh JWT: empty refresh JWT", http.StatusUnauthorized)
			return
		}

		singleflightKey := generateSingleflightKey(refreshJWTString)
		newSessionJWT, err, _ := sameOriginExpiredSessionJWTRequestGroup.Do(singleflightKey, func() (any, error) {
			return handleSessionJWTRefresh(refreshJWTString)
		})
		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to generate new session JWT using refresh JWT: %s", err.Error()), http.StatusUnauthorized)
			return
		}

		err = setupSessionJWTCookie(w, newSessionJWT.(string))
		if err != nil {
			http.Error(w, fmt.Sprintf("expired session JWT | failed to set up session JWT cookie: %s", err.Error()), http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func generateSingleflightKey(refreshJWTString string) string {
	hash := sha256.Sum256([]byte(refreshJWTString))
	return hex.EncodeToString(hash[:])
}

func handleSessionJWTRefresh(refreshJWTString string) (string, error) {
	refreshJWT, err := parseJWT(refreshJWTString)
	if err != nil {
		return "", errors.New("failed to parse refresh JWT")
	}
	if !isJWTValid(refreshJWT) {
		return "", errors.New("expired or invalid refresh JWT")
	}
	userID, _ := refreshJWT.Claims.GetSubject()
	newSessionJWT, err := createSessionJWT(userID)
	if err != nil {
		return "", err
	}
	return newSessionJWT, nil
}
