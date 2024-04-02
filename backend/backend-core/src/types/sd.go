package types

import "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"

type SDParameterType string

const (
	SDParameterTypeString      SDParameterType = "string"
	SDParameterTypeNumber      SDParameterType = "number"
	SDParameterTypeTypeBoolean SDParameterType = "boolean"
)

type SDParameterDTO struct {
	ID         util.Optional[uint32]
	Denotation string
	Type       SDParameterType
}

type SDTypeDTO struct {
	ID         util.Optional[uint32]
	Denotation string
	Parameters []SDParameterDTO
}

type SDInstanceDTO struct {
	ID              util.Optional[uint32]
	UID             string
	ConfirmedByUser bool
	UserIdentifier  string
	SDType          SDTypeDTO
}
