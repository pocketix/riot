package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToGraphQLModelUser(user dllModel.User) graphQLModel.User {
	return graphQLModel.User{
		ID:              uint32(user.ID.GetPayload()),
		Username:        user.Username,
		Email:           user.Email,
		Name:            user.Name.ToPointer(),
		ProfileImageURL: user.ProfileImageURL.ToPointer(),
		Roles:           sharedUtils.Map(user.Roles, ToGraphQLModelRole),
	}
}

func ToGraphQLModelUserConfig(userConfig dllModel.UserConfig) graphQLModel.UserConfig {
	return graphQLModel.UserConfig{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
