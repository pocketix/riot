package util

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/kpi"

func GetHardcodedKPIDefinitions() []kpi.DefinitionDTO { // TODO: Delete once KPI definition through FE becomes feasible
	kpi1 := kpi.DefinitionDTO{
		SDTypeSpecification: "shelly1pro",
		UserIdentifier:      "shelly1pro temperature (20°C-24°C) and relay NO. 0 source ('WS_in')",
		RootNode: kpi.LogicalOperationNodeDTO{
			Type: kpi.AND,
			ChildNodes: []kpi.NodeDTO{
				kpi.NumericGEQAtomNodeDTO{
					SDParameterSpecification: "relay_0_temperature",
					ReferenceValue:           20,
				},
				kpi.NumericLEQAtomNodeDTO{
					SDParameterSpecification: "relay_0_temperature",
					ReferenceValue:           24,
				},
				kpi.EQAtomNodeDTO[string]{
					SDParameterSpecification: "relay_0_source",
					ReferenceValue:           "WS_in",
				},
			},
		},
	}
	kpi2 := kpi.DefinitionDTO{
		SDTypeSpecification: "shelly1pro",
		UserIdentifier:      "Corresponding model_name (shelly1pro)",
		RootNode: kpi.EQAtomNodeDTO[string]{
			SDParameterSpecification: "model_name",
			ReferenceValue:           "shelly1pro",
		},
	}
	kpi3 := kpi.DefinitionDTO{
		SDTypeSpecification: "shelly1pro",
		UserIdentifier:      "ECO mode (shelly1pro)",
		RootNode: kpi.EQAtomNodeDTO[bool]{
			SDParameterSpecification: "eco_mode",
			ReferenceValue:           true,
		},
	}
	return []kpi.DefinitionDTO{kpi1, kpi2, kpi3}
}
