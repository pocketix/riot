package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"gorm.io/gorm"
)

func ToDBModelEntityUser(user dllModel.User) dbModel.UserEntity {
	id := user.ID.GetPayloadOrDefault(0)
	return dbModel.UserEntity{
		Model: gorm.Model{
			ID: id,
		},
		Username:               user.Username,
		Email:                  user.Email,
		Name:                   user.Name.ToPointer(),
		ProfileImageURL:        user.ProfileImageURL.ToPointer(),
		OAuth2Provider:         user.OAuth2Provider.ToPointer(),
		OAuth2ProviderIssuedID: user.OAuth2ProviderIssuedID.ToPointer(),
		LastLoginAt:            user.LastLoginAt.ToPointer(),
		Sessions:               sharedUtils.Map(user.Sessions, ToDBModelEntityUserSession),
		Invocations:            sharedUtils.EmptySlice[dbModel.SDCommandInvocationEntity](), // TODO: Implement 'Invocations' as needed
		UserConfig: dbModel.UserConfigEntity{ // TODO: Implement 'UserConfig' as needed
			UserID: uint32(id),
			Config: "{}",
		},
	}
}

func ToDBModelEntityUserSession(userSession dllModel.UserSession) dbModel.UserSessionEntity {
	return dbModel.UserSessionEntity{
		Model: gorm.Model{
			ID: userSession.ID.GetPayloadOrDefault(0),
		},
		UserID:           userSession.UserID,
		RefreshTokenHash: userSession.RefreshTokenHash,
		ExpiresAt:        userSession.ExpiresAt,
		Revoked:          userSession.Revoked,
		IPAddress:        userSession.IPAddress,
		UserAgent:        userSession.UserAgent,
	}
}

func ToDBModelEntityUserConfig(userConfig dllModel.UserConfig) dbModel.UserConfigEntity {
	return dbModel.UserConfigEntity{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
