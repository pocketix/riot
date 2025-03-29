package dllModel

import "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

type SDParameterType string

const (
	SDParameterTypeString      SDParameterType = "string"
	SDParameterTypeNumber      SDParameterType = "number"
	SDParameterTypeTypeBoolean SDParameterType = "boolean"
)

type SDParameter struct {
	ID                   sharedUtils.Optional[uint32]
	Denotation           string
	Label      sharedUtils.Optional[string]
	Type                 SDParameterType
	SDParameterSnapshots []SDParameterSnapshot
}

type SDType struct {
	ID         sharedUtils.Optional[uint32]
	Denotation string
	Label      sharedUtils.Optional[string]
	Icon       sharedUtils.Optional[string]
	Parameters []SDParameter
}
