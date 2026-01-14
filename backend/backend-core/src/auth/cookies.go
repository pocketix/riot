package auth

import (
	"errors"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	OAuth2OIDCFlowStateCookieIdentifier = "OAuth2-OIDCFlowState"
	SessionJWTCookieIdentifier          = "sessionJWT"
	RefreshTokenCookieIdentifier        = "refreshToken"

	callbackPathSuffix = "/auth/callback"
)

var secureCookies = sharedUtils.GetFlagEnvironmentVariableValue("SECURE_COOKIES").GetPayloadOrDefault(false) // TODO: Ensure this variable evaluates to 'true' in production (requires HTTPS)
var sameSiteString = sharedUtils.GetEnvironmentVariableValue("COOKIES_SAME_SITE").GetPayloadOrDefault("")
var sameSite = parseSameSite(sameSiteString)

func getCallbackPathOf(redirectURL string) string {
	u, _ := url.Parse(redirectURL)
	return u.Path
}

func getCallbackPath() string {
	return getCallbackPathOf(GoogleOAuth2Config.RedirectURL)
}

func getRootPathOf(callbackPath string) string {
	root := strings.TrimSuffix(callbackPath, callbackPathSuffix)
	if root == "" {
		return "/"
	}
	return root
}

func getRootPath() string {
	return getRootPathOf(getCallbackPath())
}

func setupHttpOnlyCookie(w http.ResponseWriter, identifier string, value string, path string, expiresIn time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     identifier,
		Value:    value,
		Path:     path,
		HttpOnly: true,
		Secure:   secureCookies,
		SameSite: sameSite,
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

// ----- OAuth2 | OIDC flow state -----

func setupOauth2OIDCFlowStateCookie(w http.ResponseWriter, base64EncodedOAuth2OIDCFlowState string) {
	setupHttpOnlyCookie(w, OAuth2OIDCFlowStateCookieIdentifier, base64EncodedOAuth2OIDCFlowState, getCallbackPath(), 5*time.Minute)
}

func getOauth2OIDCFlowStateCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, OAuth2OIDCFlowStateCookieIdentifier)
}

func clearOauth2OIDCFlowStateCookie(w http.ResponseWriter) {
	clearHttpOnlyCookie(w, OAuth2OIDCFlowStateCookieIdentifier, getCallbackPath())
}

// ----- session JWT -----

func setupSessionJWTCookie(w http.ResponseWriter, sessionJWTString string) error {
	sessionJWT, err := parseJWT(sessionJWTString)
	if err != nil {
		return err
	}
	timeUntilSessionJWTExpiryResult := getTimeUntilJWTExpiry(sessionJWT)
	if timeUntilSessionJWTExpiryResult.IsFailure() {
		return timeUntilSessionJWTExpiryResult.GetError()
	}
	sessionJWTExpiresIn := timeUntilSessionJWTExpiryResult.GetPayload()
	if sessionJWTExpiresIn <= 0 {
		return errors.New("session JWT is already expired")
	}
	setupHttpOnlyCookie(w, SessionJWTCookieIdentifier, sessionJWTString, getRootPath(), sessionJWTExpiresIn)
	return nil
}

func getSessionJWTCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, SessionJWTCookieIdentifier)
}

func clearSessionJWTCookie(w http.ResponseWriter) {
	clearHttpOnlyCookie(w, SessionJWTCookieIdentifier, getRootPath())
}

// ----- refresh token -----

func setupRefreshTokenCookie(w http.ResponseWriter, refreshToken string, expiresIn time.Duration) {
	setupHttpOnlyCookie(w, RefreshTokenCookieIdentifier, refreshToken, getRootPath(), expiresIn)
}

func getRefreshTokenCookieValue(r *http.Request) sharedUtils.Optional[string] {
	return getCookieValue(r, RefreshTokenCookieIdentifier)
}

func clearRefreshTokenCookie(w http.ResponseWriter) {
	clearHttpOnlyCookie(w, RefreshTokenCookieIdentifier, getRootPath())
}

// ----- aux -----

func isCookieSet(r *http.Request, identifier string) bool {
	return getCookieValue(r, identifier).IsPresent()
}

func parseSameSite(sameSiteString string) http.SameSite {
	sameSiteString = strings.TrimSpace(strings.ToLower(sameSiteString))

	switch sameSiteString {
	case "":
		return http.SameSiteDefaultMode
	case "lax":
		return http.SameSiteLaxMode
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		log.Printf("Warning: invalid SameSite value '%s', using SameSiteDefaultMode", sameSiteString)
		return http.SameSiteDefaultMode
	}
}
