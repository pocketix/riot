package dllModel

type VPLProgram struct {
	ID                   uint32
	Name                 string
	Data                 string
	SDParameterSnapshots []SDParameterSnapshot
}

type VPLProgramExecutionResult struct {
	Program                 VPLProgram
	SDParameterSnapshotList []SDParameterSnapshot
	SDCommandInvocationList []SDCommandInvocation
}
