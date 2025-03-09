package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDLLModelUserConfig(userConfig dbModel.UserConfigEntity) dllModel.UserConfig {
	return dllModel.UserConfig{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
