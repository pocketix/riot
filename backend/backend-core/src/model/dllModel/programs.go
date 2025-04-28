package dllModel

import "time"

type VPLProgram struct {
	ID                   uint32
	Name                 string
	Data                 string
	LastRun              *time.Time
	Enabled              bool
	SDParameterSnapshots []VPLProgramSDSnapshotLink
}

type VPLProgramExecutionResult struct {
	Program                 VPLProgram
	SDParameterSnapshotList []SDParameterSnapshot
	SDCommandInvocationList []SDCommandInvocation
	ExecutionTime           string
	Enabled                 bool
	Success                 bool
	Error                   *string
	ExecutionReasion        *string
}

type VPLProgramSDSnapshotLink struct {
	ProgramID   uint32
	InstanceID  uint32
	ParameterID uint32
}
