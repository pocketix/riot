package auth

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/misc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"google.golang.org/api/idtoken"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var allowedOrigins = sharedUtils.NewSetFromSlice(strings.Split(sharedUtils.GetEnvironmentVariableValue("ALLOWED_ORIGINS").GetPayloadOrDefault("http://localhost:8080,http://localhost:1234"), ","))

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
	oauth2Provider := "google" // TODO: Revisit this once more providers are supported
	oauth2ProviderIssuedID := userData.oauth2ProviderIssuedID
	userLoadResult := dbClientInstance.LoadUserBasedOnOAuth2ProviderIssuedID(oauth2ProviderIssuedID)
	if userLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[dllModel.User](fmt.Errorf("user record upsert failure - failed to load user record: %s", userLoadResult.GetError().Error()))
	}
	user := userLoadResult.GetPayload().GetPayloadOrDefault(dllModel.User{
		ID:                     sharedUtils.NewEmptyOptional[uint](),
		Username:               fmt.Sprintf("%s-user-%s", oauth2Provider, oauth2ProviderIssuedID),
		OAuth2Provider:         sharedUtils.NewOptionalOf(oauth2Provider),
		OAuth2ProviderIssuedID: sharedUtils.NewOptionalOf(oauth2ProviderIssuedID),
	})
	user.Email = userData.email
	user.Name = userData.name
	user.ProfileImageURL = userData.profileImageURL
	user.LastLoginAt = sharedUtils.NewOptionalOf(time.Now())

	// Ensure all previous sessions are revoked...
	sharedUtils.ForEach(user.Sessions, func(session dllModel.UserSession) {
		session.Revoked = true
	})
	// ...and establish a new one
	user.Sessions = append(user.Sessions, dllModel.UserSession{
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

func determineAPIAccess(userID uint) sharedUtils.Result[APIAccessSummary] {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	loadUserResult := dbClientInstance.LoadUser(userID)
	if loadUserResult.IsFailure() {
		return sharedUtils.NewFailureResult[APIAccessSummary](loadUserResult.GetError())
	}
	graphQLOperationsLoadResult := dbClientInstance.LoadGraphQLOperations()
	if graphQLOperationsLoadResult.IsFailure() {
		return sharedUtils.NewFailureResult[APIAccessSummary](graphQLOperationsLoadResult.GetError())
	}
	user := loadUserResult.GetPayload()
	graphQLOperations := graphQLOperationsLoadResult.GetPayload()

	unauthorizedFieldMap := map[string]SourceOfExplicitAuthorizationDenial{}
	authorizedFields := sharedUtils.EmptySlice[string]()

	handleSingleOperationDenial := func(operationIdentifier string, permissionID uint32, roleID uint32) {
		authorizationDenialSource, exists := unauthorizedFieldMap[operationIdentifier]
		if !exists {
			authorizationDenialSource = SourceOfExplicitAuthorizationDenial{
				PermissionID: permissionID,
				RoleIDs:      sharedUtils.SliceOf(roleID),
			}
		} else {
			authorizationDenialSource.RoleIDs = append(authorizationDenialSource.RoleIDs, roleID)
		}
		unauthorizedFieldMap[operationIdentifier] = authorizationDenialSource
	}

	for _, role := range user.Roles {
		roleID := role.ID.GetPayload()
		for _, permission := range role.Permissions {
			permissionID := permission.ID.GetPayload()
			if permission.SingleOperationPermission.IsPresent() {
				singleOperationPermission := permission.SingleOperationPermission.GetPayload()
				operationIdentifier := singleOperationPermission.GraphQLOperationIdentifier
				effect := singleOperationPermission.Effect
				if effect == "allow" {
					authorizedFields = append(authorizedFields, operationIdentifier)
				} else if effect == "deny" {
					handleSingleOperationDenial(operationIdentifier, permissionID, roleID)
				} else {
					panic(fmt.Sprintf("single-operation permission entry (id: %d): effect outside enum scope ('allow' | 'deny'): %s", permissionID, effect))
				}
			} else if permission.OperationTypeAccessPermission.IsPresent() {
				operationType := permission.OperationTypeAccessPermission.GetPayload().OperationType
				graphQLOperationsOfTargetType := sharedUtils.Filter(graphQLOperations, func(graphQLOperation misc.GraphQLOperation) bool {
					return graphQLOperation.OpType == operationType
				})
				identifiersOfGraphQLOperationsOfTargetType := sharedUtils.Map(graphQLOperationsOfTargetType, func(graphQLOperation misc.GraphQLOperation) string {
					return graphQLOperation.Identifier
				})
				authorizedFields = append(authorizedFields, identifiersOfGraphQLOperationsOfTargetType...)
			} else {
				panic(fmt.Sprintf("permission entry (id: %d): no subtype present", permissionID))
			}
		}
	}

	authorizedFieldSet := sharedUtils.NewSetFromSlice(authorizedFields)
	for unauthorizedFieldIdentifier := range unauthorizedFieldMap {
		authorizedFieldSet.Delete(unauthorizedFieldIdentifier)
	}

	return sharedUtils.NewSuccessResult(APIAccessSummary{
		AuthorizedFieldSet:   authorizedFieldSet.ToSlice(),
		UnauthorizedFieldMap: unauthorizedFieldMap,
	})
}
