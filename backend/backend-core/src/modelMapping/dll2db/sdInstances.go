package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"time"
)

func ToDBModelEntitySDInstance(sdInstance dllModel.SDInstance) dbModel.SDInstanceEntity {
	return dbModel.SDInstanceEntity{
		ID:                 sdInstance.ID.GetPayloadOrDefault(0),
		UID:                sdInstance.UID,
		ConfirmedByUser:    sdInstance.ConfirmedByUser,
		UserIdentifier:     sdInstance.UserIdentifier,
		SDTypeID:           sdInstance.SDType.ID.GetPayloadOrDefault(0),
		CommandInvocations: ToDBModelSDCommandInvocations(sdInstance.CommandInvocations), // Invocations mapping
	}
}

func ToDBModelSDCommandInvocations(commandInvocations []dllModel.SDCommandInvocation) []dbModel.SDCommandInvocationEntity {
	dbInvocations := make([]dbModel.SDCommandInvocationEntity, len(commandInvocations))
	for i, inv := range commandInvocations {
		invocationTime, _ := time.Parse("2006-01-02T15:04:05Z07:00", inv.InvocationTime)
		dbInvocations[i] = dbModel.SDCommandInvocationEntity{
			ID:             inv.ID,
			InvocationTime: invocationTime,
			Payload:        inv.Payload,
			UserId:         inv.UserID,
			CommandID:      inv.CommandID,
			SDInstanceID: 	inv.SDInstanceID,
		}
	}
	return dbInvocations
}