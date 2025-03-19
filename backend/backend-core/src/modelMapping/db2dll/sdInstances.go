package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelSDInstance(sdInstanceEntity dbModel.SDInstanceEntity) dllModel.SDInstance {
	return dllModel.SDInstance{
		ID:                 sharedUtils.NewOptionalOf[uint32](sdInstanceEntity.ID),
		UID:                sdInstanceEntity.UID,
		ConfirmedByUser:    sdInstanceEntity.ConfirmedByUser,
		UserIdentifier:     sdInstanceEntity.UserIdentifier,
		SDType:             ToDLLModelSDType(sdInstanceEntity.SDType),
		CommandInvocations: ToDLLModelSDCommandInvocations(sdInstanceEntity.CommandInvocations),
	}
}

func ToDLLModelSDCommandInvocations(commandInvocations []dbModel.SDCommandInvocationEntity) []dllModel.SDCommandInvocation {
	dllInvocations := make([]dllModel.SDCommandInvocation, len(commandInvocations))
	for i, inv := range commandInvocations {
		dllInvocations[i] = dllModel.SDCommandInvocation{
			ID:             inv.ID,
			InvocationTime: inv.InvocationTime.Format("2006-01-02T15:04:05Z07:00"), // Transfer from `time.Time` to string
			Payload:        inv.Payload,
			UserID:         inv.UserId,
			CommandID:      inv.CommandID,
			SDInstanceID:   inv.SDInstanceID,
		}
	}
	return dllInvocations
}

func ToDLLModelSDCommandInvocation(command dbModel.SDCommandInvocationEntity) dllModel.SDCommandInvocation {
	return dllModel.SDCommandInvocation{
		ID:             command.ID,
		InvocationTime: command.InvocationTime.Format("2006-01-02T15:04:05Z07:00"),
		Payload:        command.Payload,
		UserID:         command.UserId,
		CommandID:      command.CommandID,
		SDInstanceID:   command.SDInstanceID,
	}
}

func ToDLLModelSDCommand(commandEntity dbModel.SDCommandEntity) dllModel.SDCommand {
	return dllModel.SDCommand{
		ID:          commandEntity.ID,
		Name:        commandEntity.Name,
		Description: commandEntity.Description,
		SdTypeID:    commandEntity.SdTypeID,
	}
}
