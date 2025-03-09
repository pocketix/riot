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
	"time"
)

var jwtSecret = []byte(sharedUtils.GetEnvironmentVariableValue("JWT_SECRET").GetPayloadOrDefault("provide-a-meaningful-default?")) // TODO: Revisit this

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	stateTokenValue := fmt.Sprintf("state-token-%s", uniuri.New())
	url := GoogleOAuth2Config.AuthCodeURL(stateTokenValue, oauth2.AccessTypeOffline)
	setupStateTokenCookie(w, stateTokenValue)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func CallbackHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	authorizationCode := query.Get("code")
	if authorizationCode == "" {
		http.Error(w, "missing authorization code", http.StatusBadRequest)
		return
	}
	state := query.Get("state")
	if state == "" {
		http.Error(w, "missing state-token", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("OAuth2StateToken")
	if err != nil {
		http.Error(w, "state-token cookie not found", http.StatusBadRequest)
		return
	}
	if cookie.Value != state {
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

	http.Redirect(w, r, "http://localhost:8080", http.StatusTemporaryRedirect) // TODO: Setup flexible redirect here
	return
}

func setupStateTokenCookie(w http.ResponseWriter, stateTokenValue string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "OAuth2StateToken",
		Value:    stateTokenValue,
		HttpOnly: true,
		Secure:   false, // TODO: Ensure this field is set to 'true' in production (requires HTTPS)
		Path:     "/auth/callback",
		MaxAge:   int((10 * time.Minute).Seconds()),
	})
}

func clearStateTokenCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   "OAuth2StateToken",
		Value:  "",
		MaxAge: -1,
		Path:   "/auth/callback",
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
	claims := jwt.MapClaims{
		"sub":      user.ID.GetPayload(),
		"iat":      time.Now().Unix(),
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
		"username": user.Username,
		"email":    user.Email,
	}
	if user.Name.IsPresent() {
		claims["name"] = user.Name.GetPayload()
	}
	if user.ProfileImageURL.IsPresent() {
		claims["profileImageURL"] = user.ProfileImageURL.GetPayload()
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func setupSessionJWTCookie(w http.ResponseWriter, sessionJWT string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "sessionJWT",
		Value:    sessionJWT,
		HttpOnly: true,
		Secure:   false, // TODO: Ensure this field is set to 'true' in production (requires HTTPS)
		Path:     "/",
		MaxAge:   int((24 * time.Hour).Seconds()),
	})
}
