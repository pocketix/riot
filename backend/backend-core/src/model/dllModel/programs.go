package dllModel

type VPLProgram struct {
	ID               uint32
	Name             string
	Data             string
	ReferencedValues []ReferencedValue
}

type ReferencedValue struct {
	ID        uint32
	DeviceID  string
	Parameter string
}
