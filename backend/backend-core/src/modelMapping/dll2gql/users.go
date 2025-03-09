package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelUserConfig(userConfig dllModel.UserConfig) graphQLModel.UserConfig {
	return graphQLModel.UserConfig{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
