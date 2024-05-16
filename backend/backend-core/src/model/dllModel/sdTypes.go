package dllModel

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"

type SDParameterType string

const (
	SDParameterTypeString      SDParameterType = "string"
	SDParameterTypeNumber      SDParameterType = "number"
	SDParameterTypeTypeBoolean SDParameterType = "boolean"
)

type SDParameter struct {
	ID         util.Optional[uint32]
	Denotation string
	Type       SDParameterType
}

type SDType struct {
	ID         util.Optional[uint32]
	Denotation string
	Parameters []SDParameter
}
