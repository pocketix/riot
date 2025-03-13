package auth

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"net/http"
)

var jwtAuthenticationMiddlewareEnabled = sharedUtils.GetFlagEnvironmentVariableValue("JWT_AUTHENTICATION_MIDDLEWARE_ENABLED").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production

func JWTAuthenticationMiddleware(next http.Handler) http.Handler { // TODO: Make this significantly more robust
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !jwtAuthenticationMiddlewareEnabled {
			next.ServeHTTP(w, r)
			return
		}

		sessionJWTCookieValueOptional := getSessionJWTCookieValue(r)
		if sessionJWTCookieValueOptional.IsEmpty() {
			http.Error(w, "session JWT cookie not found", http.StatusBadRequest)
			return
		}

		if !isJWTValid(sessionJWTCookieValueOptional.GetPayload()) {
			http.Error(w, "provided session JWT is invalid", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
