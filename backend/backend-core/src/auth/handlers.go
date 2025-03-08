package auth

import (
	"context"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/dchest/uniuri"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"google.golang.org/api/idtoken"
	"gorm.io/gorm"
	"net/http"
	"time"
)

// jwtSecret should be stored securely, e.g., as an environment variable
const jwtSecret = "your-secret-key"

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
	token, err := GoogleOAuth2Config.Exchange(context.Background(), authorizationCode)
	if err != nil {
		http.Error(w, "failed to exchange authorization code for token", http.StatusInternalServerError)
		return
	}
	clearStateTokenCookie(w)
	idTokenRaw := token.Extra("id_token")
	idToken, ok := idTokenRaw.(string)
	if !ok || idToken == "" {
		http.Error(w, "no id token found in authorization server's response", http.StatusInternalServerError)
		return
	}
	idTokenPayload, err := idtoken.Validate(context.Background(), idToken, GoogleOAuth2Config.ClientID)
	if err != nil {
		http.Error(w, "invalid id token", http.StatusInternalServerError)
		return
	}
	// TODO: User DB record lookup (optionally creating a new record) based on idTokenPayload.Subject
	// TODO: The user record should be populated or updated using the idTokenPayload.Claims data
	user := dbModel.UserEntity{
		ID:           0,
		CreatedAt:    time.Time{},
		UpdatedAt:    time.Time{},
		DeletedAt:    gorm.DeletedAt{},
		Username:     "",
		Email:        "",
		Name:         "",
		ProfileImage: "",
		Provider:     "",
		ProviderID:   "",
		OAuthToken:   "",
		RefreshToken: "",
		TokenExpiry:  time.Time{},
		LastLoginAt:  time.Time{},
		IsActive:     false,
		Invocations:  nil,
	}
	sessionJWT, err := createSessionJWT(user)
	if err != nil {
		http.Error(w, "failed to create session JWT", http.StatusInternalServerError)
		return
	}
	setupSessionJWTCookie(w, sessionJWT)
	http.Redirect(w, r, "http://localhost:8080", http.StatusTemporaryRedirect)
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

func createSessionJWT(userEntity dbModel.UserEntity) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": userEntity.ID,                         // unique user identifier
		"iat": time.Now().Unix(),                     // issued at
		"exp": time.Now().Add(24 * time.Hour).Unix(), // expires after 24 hours
	})
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
