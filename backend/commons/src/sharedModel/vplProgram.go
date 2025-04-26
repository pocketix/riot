package sharedModel

import "time"

type VPLProgram struct {
	ID               uint32            `json:"id"`
	Name             string            `json:"name"`
	Data             string            `json:"data"`
	LastRun          *string           `json:"lastRun,omitempty"`
	Enabled          bool              `json:"enabled"`
	ReferencedValues map[string]string `json:"referencedValues"`
}

type VPLInterpretSaveRequestBody struct {
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

type VPLInterpretExecuteResultOrError struct {
	Program                      VPLProgram                    `json:"program"`
	SDParameterSnapshotsToUpdate []SDParameterSnapshotToUpdate `json:"snapshots,omitempty"`
	SDCommandInvocations         []SDCommandToInvoke           `json:"commands,omitempty"`
	ExecutionTime                *time.Time                    `json:"executionTime,omitempty"`
	Error                        string                        `json:"error,omitempty"`
}

type SDParameterSnapshotToUpdate struct {
	SDInstanceUID string   `json:"sdInstanceUID"`
	SDParameterID string   `json:"sdParameterID"`
	String        *string  `json:"string,omitempty"`
	Number        *float64 `json:"number,omitempty"`
	Boolean       *bool    `json:"boolean,omitempty"`
}

type SDCommandToInvoke struct {
	SDInstanceUID string              `json:"sdInstanceUID"`
	CommandName   string              `json:"commandName"`
	Arguments     []SDCommandArgument `json:"parameters"`
}

type SDCommandArgument struct {
	Type  string `json:"type"`
	Value any    `json:"value"`
}

type SDParameterSnapshotRequest struct {
	SDInstanceUID string `json:"sdInstanceUID"`
	SDParameterID string `json:"sdParameterID"`
}

type VPLInterpretGetSnapshotsResultOrError struct {
	SDParameterSnapshotRequest []SDParameterSnapshotResponse `json:"snapshots,omitempty"`
	Error                      string                        `json:"error,omitempty"`
}

type SDParameterSnapshotResponse struct {
	SDInstanceUID        string                `json:"sdInstanceUID"`
	SDType               SDType                `json:"sdType"`
	SDParameterSnapshots []SDParameterSnapshot `json:"snapshots"`
}

type SDType struct {
	SDParameters []SDParameter `json:"sdParameters"`
	SDCommands   []SDCommand   `json:"sdCommands"`
}

type SDParameter struct {
	ParameterID         uint32 `json:"parameterID"`
	ParameterDenotation string `json:"parameterDenotation"`
}

type SDCommand struct {
	CommandID         uint32 `json:"commandID"`
	CommandDenotation string `json:"commandDenotation"`
}
