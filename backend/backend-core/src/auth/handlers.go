package auth

import (
	"context"
	"encoding/base64"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"golang.org/x/oauth2"
	"google.golang.org/api/idtoken"
	"log"
	"net/http"
	"time"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if isCookieSet(r, SessionJWTCookieIdentifier) || isCookieSet(r, RefreshTokenCookieIdentifier) {
		http.Error(w, "cannot initiate OAuth2 | OIDC flow while authentication-related cookies set", http.StatusBadRequest)
		return
	}
	redirectUrl, err := handleRedirectUrl(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	randomState := sharedUtils.GenerateRandomAlphanumericString(16)
	jsonSerializationResult := sharedUtils.SerializeToJSON(oauth2OIDCFlowState{
		RandomState: randomState,
		RedirectUrl: redirectUrl,
	})
	if jsonSerializationResult.IsFailure() {
		http.Error(w, fmt.Sprintf("failed to serialize OAuth2 | OIDC flow state object to JSON: %s", jsonSerializationResult.GetError().Error()), http.StatusInternalServerError)
		return
	}
	base64EncodedOAuth2OIDCFlowState := base64.URLEncoding.EncodeToString(jsonSerializationResult.GetPayload())
	setupOauth2OIDCFlowStateCookie(w, base64EncodedOAuth2OIDCFlowState)
	http.Redirect(w, r, GoogleOAuth2Config.AuthCodeURL(randomState, oauth2.ApprovalForce), http.StatusTemporaryRedirect)
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) { // TODO: Clear all cookies and generally ensure this is robust-enough
	redirectUrl, err := handleRedirectUrl(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	clearOauth2OIDCFlowStateCookie(w)
	clearSessionJWTCookie(w)
	refreshToken := getRefreshTokenCookieValue(r).GetPayloadOrDefault("")
	clearRefreshTokenCookie(w)

	if refreshToken != "" {
		dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
		refreshTokenHash := sharedUtils.GenerateHexHash(refreshToken)
		userSessionLoadResult := dbClientInstance.LoadUserSessionBasedOnRefreshTokenHash(refreshTokenHash)
		if userSessionLoadResult.IsFailure() {
			http.Error(w, fmt.Sprintf("database operation failure - failed to load user session record: %s", userSessionLoadResult.GetError().Error()), http.StatusInternalServerError)
			return
		}
		userSessionOptional := userSessionLoadResult.GetPayload()
		if userSessionOptional.IsPresent() {
			userSession := userSessionOptional.GetPayload()
			userSession.Revoked = true // TODO: Consider deleting the session record or setting 'expiresAt' to 'now' instead
			if dbClientInstance.PersistUserSession(userSession).IsFailure() {
				http.Error(w, fmt.Sprintf("database operation failure - failed to persist user session record: %s", userSessionLoadResult.GetError().Error()), http.StatusInternalServerError)
				return
			}
		} else {
			log.Println("Warning: (logout): refresh token is present but no database record corresponds to it based on hash lookup...")
		}
	}

	http.Redirect(w, r, redirectUrl, http.StatusTemporaryRedirect)
}

func CallbackHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	authorizationCode := query.Get("code")
	if authorizationCode == "" {
		http.Error(w, "missing authorization code", http.StatusBadRequest)
		return
	}
	randomState := query.Get("state")
	if randomState == "" {
		http.Error(w, "missing random state", http.StatusBadRequest)
		return
	}

	base64EncodedOAuth2OIDCFlowStateOptional := getOauth2OIDCFlowStateCookieValue(r)
	if base64EncodedOAuth2OIDCFlowStateOptional.IsEmpty() {
		http.Error(w, "OAuth2 | OIDC flow state cookie not found", http.StatusBadRequest)
		return
	}
	clearOauth2OIDCFlowStateCookie(w)

	decodedOAuth2OIDCFlowState, err := base64.URLEncoding.DecodeString(base64EncodedOAuth2OIDCFlowStateOptional.GetPayload())
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to base64-decode OAuth2 | OIDC flow state cookie contents: %s", err.Error()), http.StatusBadRequest)
		return
	}
	jsonDeserializationResult := sharedUtils.DeserializeFromJSON[oauth2OIDCFlowState](decodedOAuth2OIDCFlowState)
	if jsonDeserializationResult.IsFailure() {
		http.Error(w, fmt.Sprintf("failed to deserialize OAuth2 | OIDC flow state object from JSON: %s", jsonDeserializationResult.GetError().Error()), http.StatusInternalServerError)
		return
	}
	oauth2OIDCFlowStateObject := jsonDeserializationResult.GetPayload()

	if randomState != oauth2OIDCFlowStateObject.RandomState {
		http.Error(w, "random state mismatch (request-cookie)", http.StatusBadRequest)
		return
	}

	token, err := GoogleOAuth2Config.Exchange(context.Background(), authorizationCode)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to exchange authorization code for token: %s", err.Error()), http.StatusInternalServerError)
		return
	}
	idToken, ok := token.Extra("id_token").(string)
	if !ok || idToken == "" {
		http.Error(w, "no id token found in authorization server's response", http.StatusBadRequest)
		return
	}
	idTokenPayload, err := idtoken.Validate(context.Background(), idToken, GoogleOAuth2Config.ClientID)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid id token: %s", err.Error()), http.StatusUnauthorized)
		return
	}

	idTokenDataExtractionResult := extractIDTokenData(idTokenPayload)
	if idTokenDataExtractionResult.IsFailure() {
		http.Error(w, fmt.Sprintf("the id token does not seem to contain the necessary data: %s", idTokenDataExtractionResult.GetError().Error()), http.StatusBadRequest)
		return
	}
	userData := idTokenDataExtractionResult.GetPayload()

	refreshToken := generateRefreshToken()

	userRecordUpsertResult := handleUserRecordUpsert(userData, refreshToken)
	if userRecordUpsertResult.IsFailure() {
		http.Error(w, userRecordUpsertResult.GetError().Error(), http.StatusInternalServerError)
	}
	user := userRecordUpsertResult.GetPayload()

	sessionJWT, err := createSessionJWT(fmt.Sprintf("%d", user.ID.GetPayload()))
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create session JWT: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	if err = setupSessionJWTCookie(w, sessionJWT); err != nil {
		http.Error(w, fmt.Sprintf("failed to set up session JWT cookie: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	setupRefreshTokenCookie(w, refreshToken, time.Until(user.Sessions[len(user.Sessions)-1].ExpiresAt))

	http.Redirect(w, r, oauth2OIDCFlowStateObject.RedirectUrl, http.StatusTemporaryRedirect)
}
