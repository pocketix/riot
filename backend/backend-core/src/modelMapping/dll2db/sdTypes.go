package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDBModelEntitySDType(sdType dllModel.SDType) dbModel.SDTypeEntity {
	return dbModel.SDTypeEntity{
		ID:         sdType.ID.GetPayloadOrDefault(0),
		Denotation: sdType.Denotation,
		Label:      sdType.Label.GetPayloadOrDefault(""),
		Icon:       sdType.Icon.GetPayloadOrDefault(""),
		Parameters: sharedUtils.Map(sdType.Parameters, func(sdParameter dllModel.SDParameter) dbModel.SDParameterEntity {
			return dbModel.SDParameterEntity{
				ID:         sdParameter.ID.GetPayloadOrDefault(0),
				Denotation: sdParameter.Denotation,
				Label:      sdParameter.Label.GetPayloadOrDefault(""),
				Type:       string(sdParameter.Type),
			}
		}),
		Commands: sharedUtils.Map(sdType.Commands, ToDBModelSDCommand),
	}
}

func ToDBModelSDCommand(cmd dllModel.SDCommand) dbModel.SDCommandEntity {
	return dbModel.SDCommandEntity{
		ID:       cmd.ID,
		SDTypeID: cmd.SdTypeID,
		Name:     cmd.Name,
		Type:     "default",
		Payload:  cmd.Payload,
	}
}
