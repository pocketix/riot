package utils

import (
	"time"

	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/pocketix/pocketix-go/src/models"
)

func ReferencedValue2StringMap(referencedValue map[string]models.ReferencedValue) map[string]string {
	result := make(map[string]string, 0)
	for _, value := range referencedValue {
		result[value.DeviceUID] = value.ParameterName
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

func SetReferencedValue2SDParameterSnapshot(referencedValue models.ReferencedValue) sharedModel.SDParameterSnapshotsResult {
	now := time.Now()
	deviceID := referencedValue.DeviceID
	parameterID := referencedValue.ParameterID

	switch referencedValue.Type {
	case "string":
		return sharedModel.SDParameterSnapshotsResult{
			InstanceID:  deviceID,
			ParameterID: parameterID,
			UpdatedAt:   now,
			String:      sharedModel.SDParameterSnapshotString{String: referencedValue.Value.(string), Set: true},
		}
	case "number":
		return sharedModel.SDParameterSnapshotsResult{
			InstanceID:  deviceID,
			ParameterID: parameterID,
			UpdatedAt:   now,
			Number:      sharedModel.SDParameterSnapshotNumber{Number: referencedValue.Value.(float64), Set: true},
		}
	case "boolean":
		return sharedModel.SDParameterSnapshotsResult{
			InstanceID:  deviceID,
			ParameterID: parameterID,
			UpdatedAt:   now,
			Boolean:     sharedModel.SDParameterSnapshotBoolean{Boolean: referencedValue.Value.(bool), Set: true},
		}
	default:
		return sharedModel.SDParameterSnapshotsResult{
			InstanceID:  deviceID,
			ParameterID: parameterID,
			UpdatedAt:   now,
		}
	}
}
