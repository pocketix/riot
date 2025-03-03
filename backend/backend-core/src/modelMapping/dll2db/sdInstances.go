package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"time"
)

func ToDBModelEntitySDInstance(sdInstance dllModel.SDInstance) dbModel.SDInstanceEntity {
	return dbModel.SDInstanceEntity{
		ID:              sdInstance.ID.GetPayloadOrDefault(0),
		UID:             sdInstance.UID,
		ConfirmedByUser: sdInstance.ConfirmedByUser,
		UserIdentifier:  sdInstance.UserIdentifier,
		SDTypeID:        sdInstance.SDType.ID.GetPayloadOrDefault(0),
		Commands:        ToDBModelSDCommands(sdInstance.Commands), // Mapování Commands
	}
}

func ToDBModelSDCommands(commands []dllModel.SDCommand) []dbModel.SDCommandEntity {
	dbCommands := make([]dbModel.SDCommandEntity, len(commands))
	for i, cmd := range commands {
		dbCommands[i] = dbModel.SDCommandEntity{
			ID:          cmd.ID,
			Denotation:  cmd.Denotation,
			Type:        cmd.Type,
			Payload:     cmd.Payload,
			Invocations: ToDBModelSDCommandInvocations(cmd.Invocations), // Mapování invokací
		}
	}
	return dbCommands
}

func ToDBModelSDCommandInvocations(invocations []dllModel.SDCommandInvocation) []dbModel.SDCommandInvocationEntity {
	dbInvocations := make([]dbModel.SDCommandInvocationEntity, len(invocations))
	for i, inv := range invocations {
		invocationTime, _ := time.Parse("2006-01-02T15:04:05Z07:00", inv.InvocationTime)
		dbInvocations[i] = dbModel.SDCommandInvocationEntity{
			ID:             inv.ID,
			InvocationTime: invocationTime,
			Payload:        inv.Payload,
			UserId:         inv.UserID,
		}
	}
	return dbInvocations
}