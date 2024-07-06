package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"github.com/google/go-cmp/cmp"
	"testing"
)

func TestToDLLModelSDType(t *testing.T) {
	sdTypeEntity := dbModel.SDTypeEntity{
		ID:         1,
		Denotation: "shelly1pro",
		Parameters: sharedUtils.SliceOf(dbModel.SDParameterEntity{
			ID:         1,
			SDTypeID:   1,
			Denotation: "relay_0_temperature",
			Type:       "number",
		}, dbModel.SDParameterEntity{
			ID:         2,
			SDTypeID:   1,
			Denotation: "relay_0_source",
			Type:       "string",
		}),
	}
	expected := dllModel.SDType{
		ID:         sharedUtils.NewOptionalOf[uint32](1),
		Denotation: "shelly1pro",
		Parameters: sharedUtils.SliceOf(dllModel.SDParameter{
			ID:         sharedUtils.NewOptionalOf[uint32](1),
			Denotation: "relay_0_temperature",
			Type:       dllModel.SDParameterTypeNumber,
		}, dllModel.SDParameter{
			ID:         sharedUtils.NewOptionalOf[uint32](2),
			Denotation: "relay_0_source",
			Type:       dllModel.SDParameterTypeString,
		}),
	}
	actual := ToDLLModelSDType(sdTypeEntity)
	if diff := cmp.Diff(expected, actual, cmp.Comparer(sharedUtils.OptionalComparer[uint32])); diff != "" {
		t.Fatalf("ToDLLModelSDType() mismatch (-expected +actual):\n%s", diff)
	}
}
