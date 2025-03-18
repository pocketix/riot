package auth

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"google.golang.org/api/idtoken"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var allowedOrigins = sharedUtils.NewSetFromSlice(strings.Split(sharedUtils.GetEnvironmentVariableValue("ALLOWED_ORIGINS").GetPayloadOrDefault("http://localhost:8080,http://localhost:1234"), ","))

// ----- types -----

type oauth2OIDCFlowState struct {
	RandomState string `json:"randomState"`
	RedirectUrl string `json:"redirectUrl"`
}

type idTokenData struct {
	oauth2ProviderIssuedID string
	email                  string
	name                   sharedUtils.Optional[string]
	profileImageURL        sharedUtils.Optional[string]
}

// ----- functions -----

func handleRedirectUrl(r *http.Request) (string, error) {
	query := r.URL.Query()
	rawRedirectUrl := query.Get("redirect")
	if rawRedirectUrl == "" {
		return "", errors.New("missing redirect url (?redirect=...)")
	}
	decodedRedirectUrl, err := url.QueryUnescape(rawRedirectUrl)
	if err != nil {
		return "", fmt.Errorf("failed to decode the redirect url (?redirect=...): %w", err)
	}
	redirectUrl, err := url.Parse(decodedRedirectUrl)
	if err != nil {
		return "", fmt.Errorf("invalid redirect url (?redirect=...): %w", err)
	}
	if redirectUrl.Scheme != "http" && redirectUrl.Scheme != "https" {
		return "", errors.New("invalid redirect url (?redirect=...): url scheme must be 'http' or 'https'")

	}
	if redirectUrl.Host == "" {
		return "", errors.New("invalid redirect url (?redirect=...): missing host")
	}
	if !allowedOrigins.Contains(fmt.Sprintf("%s://%s", redirectUrl.Scheme, redirectUrl.Host)) {
		return "", errors.New("redirect url (?redirect=...) is not among allowed origins")
	}
	return decodedRedirectUrl, nil
}

func handleUserRecordUpsert(userData idTokenData, newRefreshToken string) sharedUtils.Result[dllModel.User] {
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

	user.Sessions = append(user.Sessions, dllModel.UserSession{ // TODO: simply adding a new session... is that optimal?
		ID:               sharedUtils.NewEmptyOptional[uint](),
		UserID:           user.ID.GetPayloadOrDefault(0),
		RefreshTokenHash: sharedUtils.GenerateHexHash(newRefreshToken),
		ExpiresAt:        time.Now().Add(time.Hour * 24 * 30),
		Revoked:          false,
		IPAddress:        "", // TODO: plug these fields in... or get rid of them if proven unnecessary
		UserAgent:        "",
	})

	persistResult := dbClientInstance.PersistUser(user)
	if persistResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.User](fmt.Errorf("user record upsert failure - failed to persist user record: %s", persistResult.GetError().Error()))
	}
	user.ID = sharedUtils.NewOptionalOf(persistResult.GetPayload())
	return sharedUtils.NewSuccessResult(user)
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

func generateRefreshToken() string {
	return sharedUtils.GenerateRandomAlphanumericString(16)
}
