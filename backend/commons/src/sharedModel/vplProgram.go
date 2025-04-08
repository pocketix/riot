package sharedModel

type VPLInterpretProgramRequestMessage struct {
	ProgramID   uint32 `json:"programID"`
	ProgramName string `json:"programName"`
	ProgramCode string `json:"programCode"`
}

type VPLInterpretSaveResult struct {
	ProgramID               uint32            `json:"programID"`
	ProgramName             string            `json:"programName"`
	ProgramReferencedValues map[string]string `json:"programReferencedValues"`
	Output                  string            `json:"output"`
}

type VPLInterpretExecuteResult struct {
	ProgramID   uint32 `json:"programID"`
	ProgramName string `json:"programName"`
	Output      string `json:"output"`
}
