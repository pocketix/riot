package auth

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/dchest/uniuri"
	"golang.org/x/oauth2"
	"google.golang.org/api/idtoken"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var allowedOrigins = sharedUtils.NewSetFromSlice(strings.Split(sharedUtils.GetEnvironmentVariableValue("ALLOWED_ORIGINS").GetPayloadOrDefault("http://localhost:8080,http://localhost:1234"), ","))

type oauth2OIDCFlowState struct {
	RandomState string `json:"randomState"`
	RedirectUrl string `json:"redirectUrl"`
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	rawRedirectUrl := query.Get("redirect")
	if rawRedirectUrl == "" {
		http.Error(w, "missing redirect url (?redirect=...)", http.StatusBadRequest)
		return
	}
	decodedRedirectUrl, err := url.QueryUnescape(rawRedirectUrl)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to decode the redirect url (?redirect=...): %s", err.Error()), http.StatusBadRequest)
		return
	}
	redirectUrl, err := url.Parse(decodedRedirectUrl)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid redirect url (?redirect=...): %s", err.Error()), http.StatusBadRequest)
		return
	}
	if redirectUrl.Scheme != "http" && redirectUrl.Scheme != "https" {
		http.Error(w, "invalid redirect url (?redirect=...): url scheme must be 'http' or 'https'", http.StatusBadRequest)
		return
	}
	if redirectUrl.Host == "" {
		http.Error(w, "invalid redirect url (?redirect=...): missing host", http.StatusBadRequest)
		return
	}
	if !allowedOrigins.Contains(fmt.Sprintf("%s://%s", redirectUrl.Scheme, redirectUrl.Host)) {
		http.Error(w, "redirect url (?redirect=...) is not among allowed origins", http.StatusBadRequest)
		return
	}
	randomState := uniuri.New()
	jsonSerializationResult := sharedUtils.SerializeToJSON(oauth2OIDCFlowState{
		RandomState: randomState,
		RedirectUrl: decodedRedirectUrl,
	})
	if jsonSerializationResult.IsFailure() {
		http.Error(w, fmt.Sprintf("failed to serialize OAuth2 | OIDC flow state object to JSON: %s", jsonSerializationResult.GetError().Error()), http.StatusInternalServerError)
		return
	}
	base64EncodedOAuth2OIDCFlowState := base64.URLEncoding.EncodeToString(jsonSerializationResult.GetPayload())
	setupOauth2OIDCFlowStateCookie(w, base64EncodedOAuth2OIDCFlowState)
	http.Redirect(w, r, GoogleOAuth2Config.AuthCodeURL(randomState, oauth2.ApprovalForce), http.StatusTemporaryRedirect)
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

	userRecordUpsertResult := handleUserRecordUpsert(w, userData)
	if userRecordUpsertResult.IsFailure() {
		http.Error(w, userRecordUpsertResult.GetError().Error(), http.StatusInternalServerError)
	}
	user := userRecordUpsertResult.GetPayload()

	sessionJWT, err := createSessionJWT(user)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create session JWT: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	if err = setupSessionJWTCookie(w, sessionJWT); err != nil {
		http.Error(w, fmt.Sprintf("failed to set up session JWT cookie: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, oauth2OIDCFlowStateObject.RedirectUrl, http.StatusTemporaryRedirect)
	return
}

func handleUserRecordUpsert(w http.ResponseWriter, userData idTokenData) sharedUtils.Result[dllModel.User] {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	userLoadResult := dbClientInstance.LoadUserBasedOnOAuth2ProviderIssuedID(userData.oauth2ProviderIssuedID)
	if userLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.User](fmt.Errorf("user record upsert failure - failed to load user record: %s", userLoadResult.GetError().Error()))
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
		return sharedUtils.NewFailureResult[dllModel.User](fmt.Errorf("user record upsert failure - failed to persist user record: %s", persistResult.GetError().Error()))
	}
	user.ID = sharedUtils.NewOptionalOf(persistResult.GetPayload())
	return sharedUtils.NewSuccessResult(user)
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
