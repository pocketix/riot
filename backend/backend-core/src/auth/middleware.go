package auth

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
)

var jwtAuthenticationMiddlewareEnabled = sharedUtils.GetFlagEnvironmentVariableValue("JWT_AUTHENTICATION_MIDDLEWARE_ENABLED").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production

func JWTAuthenticationMiddleware(next http.Handler) http.Handler { // TODO: Make this significantly more robust
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !jwtAuthenticationMiddlewareEnabled {
			next.ServeHTTP(w, r)
			return
		}

		sessionJWTCookie, err := r.Cookie(SessionJWTCookieIdentifier)
		if err != nil {
			http.Error(w, "session JWT cookie is missing", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(sessionJWTCookie.Value, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %s", token.Header["alg"].(string))
			}
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "provided JWT is invalid", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
