package auth

import (
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"net/http"
	"time"
)

const (
	OAuth2OIDCFlowStateCookieIdentifier = "OAuth2OIDCFlowState"
	SessionJWTCookieIdentifier          = "sessionJWT"
	RefreshJWTCookieIdentifier          = "refreshJWT"

	RootPath     = "/"
	CallbackPath = "/auth/callback"
)

var secureCookies = sharedUtils.GetFlagEnvironmentVariableValue("SECURE_COOKIES").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production (requires HTTPS)

func setupHttpOnlyCookie(w http.ResponseWriter, identifier string, value string, path string, expiresIn time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     identifier,
		Value:    value,
		Path:     path,
		HttpOnly: true,
		Secure:   secureCookies,
		SameSite: http.SameSiteDefaultMode,
		Expires:  time.Now().Add(expiresIn),
		MaxAge:   int(expiresIn.Seconds()),
	})
}

func getCookieValue(r *http.Request, identifier string) sharedUtils.Optional[string] {
	cookie, err := r.Cookie(identifier)
	if err != nil {
		return sharedUtils.NewEmptyOptional[string]()
	}
	return sharedUtils.NewOptionalOf(cookie.Value)
}

func clearHttpOnlyCookie(w http.ResponseWriter, identifier string, path string) {
	http.SetCookie(w, &http.Cookie{
		Name:     identifier,
		Value:    "",
		Path:     path,
		HttpOnly: true,
		Secure:   secureCookies,
		SameSite: http.SameSiteDefaultMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

func setupJWTCookie(w http.ResponseWriter, identifier, jwtString string) error {
	claims, err := extractClaims(jwtString)
	if err != nil {
		return err
	}
	expirationTime, err := claims.GetExpirationTime()
	if err != nil {
		return err
	}
	if expirationTime == nil {
		return fmt.Errorf("the 'exp' claim is missing")
	}
	jwtExpiresIn := time.Until(expirationTime.Time)
	if jwtExpiresIn <= 0 {
		return fmt.Errorf("the JWT is already expired")
	}
	setupHttpOnlyCookie(w, identifier, jwtString, RootPath, jwtExpiresIn)
	return nil
}

// ----- OAuth2 | OIDC flow state -----

func setupOauth2OIDCFlowStateCookie(w http.ResponseWriter, base64EncodedOAuth2OIDCFlowState string) {
	setupHttpOnlyCookie(w, OAuth2OIDCFlowStateCookieIdentifier, base64EncodedOAuth2OIDCFlowState, CallbackPath, 5*time.Minute)
}

func getOauth2OIDCFlowStateCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, OAuth2OIDCFlowStateCookieIdentifier)
}

func clearOauth2OIDCFlowStateCookie(w http.ResponseWriter) {
	clearHttpOnlyCookie(w, OAuth2OIDCFlowStateCookieIdentifier, CallbackPath)
}

// ----- session JWT -----

func setupSessionJWTCookie(w http.ResponseWriter, sessionJWTString string) error {
	return setupJWTCookie(w, SessionJWTCookieIdentifier, sessionJWTString)
}

func getSessionJWTCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, SessionJWTCookieIdentifier)
}

// ----- refresh JWT -----

func setupRefreshJWTCookie(w http.ResponseWriter, refreshJWTString string) error {
	return setupJWTCookie(w, RefreshJWTCookieIdentifier, refreshJWTString)
}

func getRefreshJWTCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, RefreshJWTCookieIdentifier)
}
