package utils

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/pocketix/pocketix-go/src/models"
)

func ReferencedValue2StringMap(referencedValue map[string]models.ReferencedValue) map[string]string {
	result := make(map[string]string)
	for _, value := range referencedValue {
		result[value.DeviceID] = value.ParameterName
	}
	return result
}

func SDParameterSnapshotToInterpretModel(snapshots []sharedModel.SDParameterSnapshotResponse) []models.ReferenceValueResponseFromBackend {
	result := make([]models.ReferenceValueResponseFromBackend, 0)
	for _, snapshot := range snapshots {
		result = append(result, models.ReferenceValueResponseFromBackend{
			DeviceID: snapshot.SDInstanceUID,
			SDType: models.SDType{
				SDParameters: sharedUtils.Map(snapshot.SDType.SDParameters, func(sdParameter sharedModel.SDParameter) models.SDParameter {
					return models.SDParameter{
						ParameterID:         sdParameter.ParameterID,
						ParameterDenotation: sdParameter.ParameterDenotation,
					}
				}),
				SDCommands: sharedUtils.Map(snapshot.SDType.SDCommands, func(sdCommand sharedModel.SDCommand) models.SDCommand {
					return models.SDCommand{
						CommandID:         sdCommand.CommandID,
						CommandDenotation: sdCommand.CommandDenotation,
					}
				}),
			},
			SDParameterSnapshots: sharedUtils.Map(snapshot.SDParameterSnapshots, func(sdParameterSnapshot sharedModel.SDParameterSnapshot) models.SDParameterSnapshot {
				return models.SDParameterSnapshot{
					DeviceID:    snapshot.SDInstanceUID,
					SDParameter: sdParameterSnapshot.SDParameter,
					String:      sdParameterSnapshot.String,
					Number:      sdParameterSnapshot.Number,
					Boolean:     sdParameterSnapshot.Boolean,
				}
			}),
		})
	}
	return result
}

func DeviceCommand2SDCommandToInvoke(deviceCommand *models.DeviceCommand) sharedModel.SDCommandToInvoke {
	return sharedModel.SDCommandToInvoke{
		SDInstanceUID: deviceCommand.DeviceID,
		CommandName:   deviceCommand.Command,
		Arguments: sharedUtils.Map(deviceCommand.Arguments, func(typeValue models.TypeValue) sharedModel.SDCommandArgument {
			return sharedModel.SDCommandArgument{
				Type:  typeValue.Type,
				Value: typeValue.Value,
			}
		}),
	}
}

func InterpretParameterSnapshot2SDParameterSnapshotToUpdate(snapshot *models.SDParameterSnapshot) sharedModel.SDParameterSnapshotToUpdate {
	return sharedModel.SDParameterSnapshotToUpdate{
		SDInstanceUID: snapshot.DeviceID,
		SDParameterID: snapshot.SDParameter,
		String:        snapshot.String,
		Number:        snapshot.Number,
		Boolean:       snapshot.Boolean,
	}
}
