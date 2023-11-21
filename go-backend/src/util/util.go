package util

import "bp-bures-SfPDfSD/src/dto"

type ValueOrError struct {
	Value interface{}
	Error error
}

func GetArtificialKPIDefinitions() []dto.KPIDefinitionDTO { // TODO: Delete once replaced by user definition of the KPIs

	rootKPIDefinitionObject1 := dto.KPIDefinitionDTO{
		DeviceTypeSpecification:  "shelly1pro",
		HumanReadableDescription: "The relay NO. 0 temperature of devices belonging to device type shelly1pro must be between 20°C and 24°C and the relay NO. 0 source of such devices must equal 'WS_in'",
		DefinitionRootNode: &dto.LogicalOperatorNodeDTO{
			Type: dto.AND,
			ChildNodes: []dto.FulfillableNode{
				&dto.NumericInRangeSubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: dto.SubKPIDefinitionBaseNodeDTO{
						DeviceParameterSpecification: "relay_0_temperature",
					},
					LowerBoundaryValue: 20,
					UpperBoundaryValue: 24,
				},
				&dto.StringEqualitySubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: dto.SubKPIDefinitionBaseNodeDTO{
						DeviceParameterSpecification: "relay_0_source",
					},
					ReferenceValue: "WS_in",
				},
			},
		},
	}

	rootKPIDefinitionObject2 := dto.KPIDefinitionDTO{
		DeviceTypeSpecification:  "shelly1pro",
		HumanReadableDescription: "The value of 'model_name' device parameter of devices belonging to device type shelly1pro must equal 'shelly1pro'",
		DefinitionRootNode: &dto.StringEqualitySubKPIDefinitionNodeDTO{
			SubKPIDefinitionBaseNodeDTO: dto.SubKPIDefinitionBaseNodeDTO{
				DeviceParameterSpecification: "model_name",
			},
			ReferenceValue: "shelly1pro",
		},
	}

	rootKPIDefinitionObject3 := dto.KPIDefinitionDTO{
		DeviceTypeSpecification:  "shelly1pro",
		HumanReadableDescription: "All shelly1pro devices must run in the so-called ECO mode.",
		DefinitionRootNode: &dto.BooleanEqualitySubKPIDefinitionNodeDTO{
			SubKPIDefinitionBaseNodeDTO: dto.SubKPIDefinitionBaseNodeDTO{
				DeviceParameterSpecification: "eco_mode",
			},
			ReferenceValue: true,
		},
	}

	rootKPIDefinitionObject4 := dto.KPIDefinitionDTO{
		DeviceTypeSpecification:  "GW10K-ET",
		HumanReadableDescription: "The 'safety_country_label' of GW10K-ET devices cannot be 'Czechia'",
		DefinitionRootNode: &dto.LogicalOperatorNodeDTO{
			Type: dto.NOR, // Works like NOT here
			ChildNodes: []dto.FulfillableNode{
				&dto.StringEqualitySubKPIDefinitionNodeDTO{
					SubKPIDefinitionBaseNodeDTO: dto.SubKPIDefinitionBaseNodeDTO{
						DeviceParameterSpecification: "safety_country_label",
					},
					ReferenceValue: "Czechia",
				},
			},
		},
	}

	return []dto.KPIDefinitionDTO{rootKPIDefinitionObject1, rootKPIDefinitionObject2, rootKPIDefinitionObject3, rootKPIDefinitionObject4}
}
