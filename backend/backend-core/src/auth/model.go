package auth

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"time"
)

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

type sessionRefreshResult struct {
	newSessionJWT         string
	newRefreshToken       string
	refreshTokenExpiresAt time.Time
}

type APIAccessSummary struct {
	AuthorizedFieldSet   []string                                       `json:"authorizedFieldSet"`
	UnauthorizedFieldMap map[string]SourceOfExplicitAuthorizationDenial `json:"unauthorizedFieldMap"`
}

type AuthorizationDenialType string

const (
	Implicit AuthorizationDenialType = "implicit"
	Explicit AuthorizationDenialType = "explicit"
)

type SourceOfExplicitAuthorizationDenial struct {
	PermissionID uint32   `json:"permissionID"`
	RoleIDs      []uint32 `json:"roleIDs"`
}

type FieldAccessAuthorizationCheckResult struct {
	UserAuthorized                      bool
	AuthorizationDenialType             *AuthorizationDenialType
	SourceOfExplicitAuthorizationDenial *SourceOfExplicitAuthorizationDenial
}

type JWTPayload struct {
	UserID           uint
	APIAccessSummary APIAccessSummary
}
