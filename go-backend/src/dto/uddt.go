package dto

const (
	UserDefinedDeviceTypeParameterTypeString  UserDefinedDeviceTypeParameterType = "STRING"
	UserDefinedDeviceTypeParameterTypeNumber  UserDefinedDeviceTypeParameterType = "NUMBER"
	UserDefinedDeviceTypeParameterTypeBoolean UserDefinedDeviceTypeParameterType = "BOOLEAN"
)

type UserDefinedDeviceTypeParameterType string

type UserDefinedDeviceTypeParameterDTO struct {
	ID   *uint32
	Name string
	Type UserDefinedDeviceTypeParameterType
}

type UserDefinedDeviceTypeDTO struct {
	ID         *uint32
	Denotation string
	Parameters []UserDefinedDeviceTypeParameterDTO
}
