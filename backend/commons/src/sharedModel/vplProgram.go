package sharedModel

type VPLInterpretProgramRequestMessage struct {
	ProgramID   uint32 `json:"programID"`
	ProgramName string `json:"programName"`
	ProgramCode string `json:"programCode"`
}

type VPLProgram struct {
	ID               uint32            `json:"id"`
	Name             string            `json:"name"`
	Data             string            `json:"data"`
	ReferencedValues map[string]string `json:"referencedValues"`
}

type VPLInterpretSaveRequestBody struct {
	Name string `json:"name"`
	Data string `json:"data"`
}

type VPLInterpretUpdateRequestBody struct {
	ID   uint32 `json:"id"`
	Name string `json:"name"`
	Data string `json:"data"`
}

type VPLInterpretSaveResultOrError struct {
	Program VPLProgram `json:"program"`
	Error   string     `json:"error,omitempty"`
}

type VPLInterpretExecuteResult struct {
	ProgramID   uint32 `json:"programID"`
	ProgramName string `json:"programName"`
	Output      string `json:"output"`
}
