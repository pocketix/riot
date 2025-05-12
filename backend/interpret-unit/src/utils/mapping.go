package utils

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/pocketix/pocketix-go/src/models"
)

func ReferencedValue2StringMap(referencedValue map[string]models.ReferencedValue) map[string]string {
	result := make(map[string]string, 0)
	for _, value := range referencedValue {
		result[value.DeviceID] = value.ParameterName
	}
	return result
}

func InterpretInvocationsSlice2BackendInvocations(invocations []models.SDCommandInvocation) []sharedModel.SDCommandToInvoke {
	return sharedUtils.Map(invocations, func(invocation models.SDCommandInvocation) sharedModel.SDCommandToInvoke {
		return sharedModel.SDCommandToInvoke{
			SDInstanceID:  invocation.InstanceID,
			SDInstanceUID: invocation.InstanceUID,
			CommandID:     invocation.CommandID,
			CommandName:   invocation.CommandDenotation,
			Payload:       invocation.Payload,
		}
	})
}
