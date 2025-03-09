package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
)

func ToDBModelEntityUserConfig(userConfig dllModel.UserConfig) dbModel.UserConfigEntity {
	return dbModel.UserConfigEntity{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
