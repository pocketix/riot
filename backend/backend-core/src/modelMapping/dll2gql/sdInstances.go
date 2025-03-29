package dll2gql

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
)

func ToGraphQLModelSDInstance(sdInstance dllModel.SDInstance) graphQLModel.SDInstance {
	return graphQLModel.SDInstance{
		ID:                 sdInstance.ID.GetPayload(),
		UID:                sdInstance.UID,
		ConfirmedByUser:    sdInstance.ConfirmedByUser,
		UserIdentifier:     sdInstance.UserIdentifier,
		Type:               ToGraphQLModelSDType(sdInstance.SDType),
		CommandInvocations: ToGraphQLModelSDCommandInvocations(sdInstance.CommandInvocations),
	}
}

func ToGraphQLModelSDCommandInvocations(invocations []dllModel.SDCommandInvocation) []graphQLModel.SDCommandInvocation {
	result := make([]graphQLModel.SDCommandInvocation, len(invocations))
	for i, invocation := range invocations {
		result[i] = graphQLModel.SDCommandInvocation{
			ID:             invocation.ID,
			InvocationTime: invocation.InvocationTime,
			Payload:        invocation.Payload,
			UserID:         invocation.UserID,
			CommandID:      invocation.CommandID,
			SdInstanceID:   invocation.SDInstanceID,
		}
	}
	return result
}

func ToGraphQLModelSDCommandInvocation(invocation dllModel.SDCommandInvocation) graphQLModel.SDCommandInvocation {
	return graphQLModel.SDCommandInvocation{
		ID:             invocation.ID,
		InvocationTime: invocation.InvocationTime,
		Payload:        invocation.Payload,
		UserID:         invocation.UserID,
		CommandID:      invocation.CommandID,
		SdInstanceID:   invocation.SDInstanceID,
	}
}

func ToDLLModelSDCommandInvocation(input graphQLModel.SDCommandInvocationInput) dllModel.SDCommandInvocation {
	return dllModel.SDCommandInvocation{
		ID:             0, // ID bude generováno při uložení do DB
		InvocationTime: input.InvocationTime,
		Payload:        input.Payload,
		UserID:         input.UserID,
		CommandID:      input.CommandID,
		SDInstanceID:   input.SdInstanceID,
	}
}

func ToDLLModelSDCommand(input graphQLModel.SDCommandInput) dllModel.SDCommand {
	var description string
	if input.Description != nil {
		description = *input.Description
	}

	return dllModel.SDCommand{
		Name:        input.Name,
		Description: description,
		SdTypeID:    input.SdTypeID,
	}
}

func ToGraphQLModelSDCommand(command dllModel.SDCommand) graphQLModel.SDCommand {
	return graphQLModel.SDCommand{
		ID:          command.ID,
		Name:        command.Name,
		Description: &command.Description, // Musíme vrátit pointer na string
		SdTypeID:    command.SdTypeID,
	}
}
