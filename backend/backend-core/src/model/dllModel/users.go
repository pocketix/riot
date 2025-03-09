package dllModel

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"time"
)

type User struct {
	ID                     sharedUtils.Optional[uint]
	Username               string
	Email                  string
	Name                   sharedUtils.Optional[string]
	ProfileImageURL        sharedUtils.Optional[string]
	OAuth2Provider         sharedUtils.Optional[string]
	OAuth2ProviderIssuedID sharedUtils.Optional[string]
	LastLoginAt            sharedUtils.Optional[time.Time]
	// TODO: Implement 'Invocations' as needed
}
