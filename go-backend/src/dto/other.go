package dto

const (
	DeviceTypeParameterTypeString  DeviceTypeParameterType = "STRING"
	DeviceTypeParameterTypeNumber  DeviceTypeParameterType = "NUMBER"
	DeviceTypeParameterTypeBoolean DeviceTypeParameterType = "BOOLEAN"
)

type DeviceTypeParameterType string

type DeviceTypeParameterDTO struct {
	ID   *uint32
	Name string
	Type DeviceTypeParameterType
}

type DeviceTypeDTO struct {
	ID         *uint32
	Denotation string
	Parameters []DeviceTypeParameterDTO
}

type DeviceDTO struct {
	ID         *uint32
	UID        string
	Name       string
	DeviceType *DeviceTypeDTO
}
