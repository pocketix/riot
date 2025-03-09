package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"gorm.io/gorm"
)

func ToDBModelEntityUser(user dllModel.User) dbModel.UserEntity {
	return dbModel.UserEntity{
		Model: gorm.Model{
			ID: user.ID.GetPayloadOrDefault(0),
		},
		Username:               user.Username,
		Email:                  user.Email,
		Name:                   user.Name.ToPointer(),
		ProfileImageURL:        user.ProfileImageURL.ToPointer(),
		OAuth2Provider:         user.OAuth2Provider.ToPointer(),
		OAuth2ProviderIssuedID: user.OAuth2ProviderIssuedID.ToPointer(),
		LastLoginAt:            user.LastLoginAt.ToPointer(),
		Invocations:            sharedUtils.EmptySlice[dbModel.SDCommandInvocationEntity](), // TODO: Implement 'Invocations' as needed
	}
}
