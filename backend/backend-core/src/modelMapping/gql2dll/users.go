package gql2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToDLLModelUserConfig(userConfigInput graphQLModel.UserConfigInput) dllModel.UserConfig {
	return dllModel.UserConfig{
		UserID: 0,
		Config: userConfigInput.Config,
	}
}
