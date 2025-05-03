package dll2gql

import (
	"fmt"

	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToGraphQLModelSDType(sdType dllModel.SDType) graphQLModel.SDType {
	label := sdType.Label.GetPayload()
	icon := sdType.Icon.GetPayload()
	return graphQLModel.SDType{
		ID:         sdType.ID.GetPayload(),
		Denotation: sdType.Denotation,
		Label:      &label,
		Icon:       &icon,
		Parameters: sharedUtils.Map(sdType.Parameters, func(sdParameter dllModel.SDParameter) graphQLModel.SDParameter {
			label := sdParameter.Label.GetPayload()
			return graphQLModel.SDParameter{
				ID:         sdParameter.ID.GetPayload(),
				Denotation: sdParameter.Denotation,
				Label:      &label,
				Type: func(sdParameterType dllModel.SDParameterType) graphQLModel.SDParameterType {
					switch sdParameterType {
					case dllModel.SDParameterTypeString:
						return graphQLModel.SDParameterTypeString
					case dllModel.SDParameterTypeNumber:
						return graphQLModel.SDParameterTypeNumber
					case dllModel.SDParameterTypeTypeBoolean:
						return graphQLModel.SDParameterTypeBoolean
					}
					panic(fmt.Errorf("unpexted model mapping failure – shouldn't happen"))
				}(sdParameter.Type),
				ParameterSnapshots: sharedUtils.Map(sdParameter.SDParameterSnapshots, ToGraphQLModelSdParameterSnapshot),
			}
		}),
		Commands: sharedUtils.Map(sdType.Commands, ToGraphQLModelSDCommand),
	}
}
