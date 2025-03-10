package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/dchest/uniuri"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"google.golang.org/api/idtoken"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	OAuth2StateTokenCookieIdentifier = "OAuth2StateToken"
	SessionJWTCookieIdentifier       = "sessionJWT"
	CallbackPath                     = "/auth/callback"
)

var (
	jwtSecret      = []byte(sharedUtils.GetEnvironmentVariableValue("JWT_SECRET").GetPayloadOrDefault("laaiqVgdmnurM4hC"))
	allowedOrigins = sharedUtils.NewSetFromSlice(strings.Split(sharedUtils.GetEnvironmentVariableValue("ALLOWED_ORIGINS").GetPayloadOrDefault("http://localhost:8080,http://localhost:1234"), ","))
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	rawRedirectUrl := query.Get("redirect")
	if rawRedirectUrl == "" {
		http.Error(w, "missing redirect url (?redirect=...)", http.StatusBadRequest)
		return
	}
	redirectUrl, err := url.Parse(rawRedirectUrl)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid redirect url (?redirect=...): %s", err.Error()), http.StatusBadRequest)
		return
	}
	if redirectUrl.Scheme != "http" && redirectUrl.Scheme != "https" {
		http.Error(w, "invalid redirect url (?redirect=...): url scheme must be 'http' or 'https'", http.StatusBadRequest)
	}
	if redirectUrl.Host == "" {
		http.Error(w, "invalid redirect url (?redirect=...): missing host", http.StatusBadRequest)
		return
	}
	if !allowedOrigins.Contains(redirectUrl.Host) {
		http.Error(w, "redirect url (?redirect=...) is not among allowed origins", http.StatusBadRequest)
		return
	}
	stateTokenValue := fmt.Sprintf("%s-%s", uniuri.New(), redirectUrl)
	setupStateTokenCookie(w, stateTokenValue)
	http.Redirect(w, r, GoogleOAuth2Config.AuthCodeURL(stateTokenValue, oauth2.AccessTypeOffline), http.StatusTemporaryRedirect)
}

func CallbackHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	authorizationCode := query.Get("code")
	if authorizationCode == "" {
		http.Error(w, "missing authorization code", http.StatusBadRequest)
		return
	}
	stateTokenValue := query.Get("stateTokenValue")
	if stateTokenValue == "" {
		http.Error(w, "missing state-token", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie(OAuth2StateTokenCookieIdentifier)
	if err != nil {
		http.Error(w, "state-token cookie not found", http.StatusBadRequest)
		return
	}
	if cookie.Value != stateTokenValue {
		http.Error(w, "state-token mismatch", http.StatusBadRequest)
		return
	}
	clearStateTokenCookie(w)

	token, err := GoogleOAuth2Config.Exchange(context.Background(), authorizationCode)
	if err != nil {
		http.Error(w, "failed to exchange authorization code for token", http.StatusInternalServerError)
		return
	}
	idToken, ok := token.Extra("id_token").(string)
	if !ok || idToken == "" {
		http.Error(w, "no id token found in authorization server's response", http.StatusInternalServerError)
		return
	}
	idTokenPayload, err := idtoken.Validate(context.Background(), idToken, GoogleOAuth2Config.ClientID)
	if err != nil {
		http.Error(w, "invalid id token", http.StatusUnauthorized)
		return
	}

	idTokenDataExtractionResult := extractIDTokenData(idTokenPayload)
	if idTokenDataExtractionResult.IsFailure() {
		http.Error(w, fmt.Sprintf("the id token does not seem to contain the necessary data: %s", idTokenDataExtractionResult.GetError().Error()), http.StatusInternalServerError)
		return
	}
	userData := idTokenDataExtractionResult.GetPayload()

	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	userLoadResult := dbClientInstance.LoadUserBasedOnOAuth2ProviderIssuedID(userData.oauth2ProviderIssuedID)
	if userLoadResult.IsFailure() {
		http.Error(w, fmt.Sprintf("database operation failure - failed to load user record: %s", userLoadResult.GetError().Error()), http.StatusInternalServerError)
	}
	user := userLoadResult.GetPayload().GetPayloadOrDefault(dllModel.User{
		ID:                     sharedUtils.NewEmptyOptional[uint](),
		Username:               fmt.Sprintf("google-user-%s", userData.oauth2ProviderIssuedID),
		OAuth2Provider:         sharedUtils.NewOptionalOf("google"),
		OAuth2ProviderIssuedID: sharedUtils.NewOptionalOf(userData.oauth2ProviderIssuedID),
	})
	user.Email = userData.email
	user.Name = userData.name
	user.ProfileImageURL = userData.profileImageURL
	user.LastLoginAt = sharedUtils.NewOptionalOf(time.Now())
	persistResult := dbClientInstance.PersistUser(user)
	if persistResult.IsFailure() {
		http.Error(w, fmt.Sprintf("database operation failure - failed to persist user record: %s", persistResult.GetError().Error()), http.StatusInternalServerError)
	}
	user.ID = sharedUtils.NewOptionalOf(persistResult.GetPayload())

	sessionJWT, err := createSessionJWT(user)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create session JWT: %s", err.Error()), http.StatusInternalServerError)
		return
	}
	setupSessionJWTCookie(w, sessionJWT)

	redirectUrl := strings.Split(stateTokenValue, "-")[1]
	http.Redirect(w, r, redirectUrl, http.StatusTemporaryRedirect)
	return
}

func setupStateTokenCookie(w http.ResponseWriter, stateTokenValue string) {
	http.SetCookie(w, &http.Cookie{
		Name:     OAuth2StateTokenCookieIdentifier,
		Value:    stateTokenValue,
		HttpOnly: true,
		Secure:   false, // TODO: Ensure this field is set to 'true' in production (requires HTTPS)
		Path:     CallbackPath,
		MaxAge:   int((10 * time.Minute).Seconds()),
	})
}

func clearStateTokenCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   OAuth2StateTokenCookieIdentifier,
		Value:  "",
		MaxAge: -1,
		Path:   CallbackPath,
	})
}

type idTokenData struct {
	oauth2ProviderIssuedID string
	email                  string
	name                   sharedUtils.Optional[string]
	profileImageURL        sharedUtils.Optional[string]
}

func extractIDTokenData(idTokenPayload *idtoken.Payload) sharedUtils.Result[idTokenData] {
	oauth2ProviderIssuedID := idTokenPayload.Subject
	if oauth2ProviderIssuedID == "" {
		return sharedUtils.NewFailureResult[idTokenData](errors.New("oauth2 provider (Google) issued account id not found within the id token"))
	}
	email, ok := idTokenPayload.Claims["email"].(string)
	if !ok || email == "" {
		return sharedUtils.NewFailureResult[idTokenData](errors.New("user's email address not found within the id token"))
	}
	name, _ := idTokenPayload.Claims["name"].(string)
	profileImageURL, _ := idTokenPayload.Claims["picture"].(string)
	return sharedUtils.NewSuccessResult(idTokenData{
		oauth2ProviderIssuedID: oauth2ProviderIssuedID,
		email:                  email,
		name:                   sharedUtils.Ternary[sharedUtils.Optional[string]](name != "", sharedUtils.NewOptionalOf(name), sharedUtils.NewEmptyOptional[string]()),
		profileImageURL:        sharedUtils.Ternary[sharedUtils.Optional[string]](profileImageURL != "", sharedUtils.NewOptionalOf(profileImageURL), sharedUtils.NewEmptyOptional[string]()),
	})
}

func createSessionJWT(user dllModel.User) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID.GetPayload(),
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})
	return token.SignedString(jwtSecret)
}

func setupSessionJWTCookie(w http.ResponseWriter, sessionJWT string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionJWTCookieIdentifier,
		Value:    sessionJWT,
		HttpOnly: true,
		Secure:   false, // TODO: Ensure this field is set to 'true' in production (requires HTTPS)
		Path:     "/",
		MaxAge:   int((24 * time.Hour).Seconds()),
	})
}
