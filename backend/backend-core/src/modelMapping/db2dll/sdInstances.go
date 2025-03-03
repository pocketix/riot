package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDInstance(sdInstanceEntity dbModel.SDInstanceEntity) dllModel.SDInstance {
	return dllModel.SDInstance{
		ID:              sharedUtils.NewOptionalOf[uint32](sdInstanceEntity.ID),
		UID:             sdInstanceEntity.UID,
		ConfirmedByUser: sdInstanceEntity.ConfirmedByUser,
		UserIdentifier:  sdInstanceEntity.UserIdentifier,
		SDType:          ToDLLModelSDType(sdInstanceEntity.SDType),
		Commands:        ToDLLModelSDCommands(sdInstanceEntity.Commands), // Přidáno mapování Commands
	}
}

func ToDLLModelSDCommands(commands []dbModel.SDCommandEntity) []dllModel.SDCommand {
	dllCommands := make([]dllModel.SDCommand, len(commands))
	for i, cmd := range commands {
		dllCommands[i] = dllModel.SDCommand{
			ID:          cmd.ID,
			Denotation:  cmd.Denotation,
			Type:        cmd.Type,
			Payload:     cmd.Payload,
			Invocations: ToDLLModelSDCommandInvocations(cmd.Invocations), // Mapování invokací
		}
	}
	return dllCommands
}

func ToDLLModelSDCommandInvocations(invocations []dbModel.SDCommandInvocationEntity) []dllModel.SDCommandInvocation {
	dllInvocations := make([]dllModel.SDCommandInvocation, len(invocations))
	for i, inv := range invocations {
		dllInvocations[i] = dllModel.SDCommandInvocation{
			ID:             inv.ID,
			InvocationTime: inv.InvocationTime.Format("2006-01-02T15:04:05Z07:00"), // Převod `time.Time` na string
			Payload:        inv.Payload,
			UserID:         inv.UserId,
		}
	}
	return dllInvocations
}

