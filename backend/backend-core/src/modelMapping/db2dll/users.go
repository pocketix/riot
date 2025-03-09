package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"time"
)

func ToDLLModelUser(userEntity dbModel.UserEntity) dllModel.User {
	return dllModel.User{
		ID:                     sharedUtils.NewOptionalOf[uint](userEntity.Model.ID),
		Username:               userEntity.Username,
		Email:                  userEntity.Email,
		Name:                   sharedUtils.NewOptionalFromPointer[string](userEntity.Name),
		ProfileImageURL:        sharedUtils.NewOptionalFromPointer[string](userEntity.ProfileImageURL),
		OAuth2Provider:         sharedUtils.NewOptionalFromPointer[string](userEntity.OAuth2Provider),
		OAuth2ProviderIssuedID: sharedUtils.NewOptionalFromPointer[string](userEntity.OAuth2ProviderIssuedID),
		LastLoginAt:            sharedUtils.NewOptionalFromPointer[time.Time](userEntity.LastLoginAt),
		// TODO: Implement 'Invocations' as needed
	}
}
