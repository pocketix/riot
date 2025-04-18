package sharedModel

type VPLProgram struct {
	ID               uint32            `json:"id"`
	Name             string            `json:"name"`
	Data             string            `json:"data"`
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
	Program                      VPLProgram                       `json:"program"`
	SDParameterSnapshotsToUpdate []SDParameterSnapshotInfoMessage `json:"snapshots,omitempty"`
	SDCommandInvocations         []SDCommandInvocationMessage     `json:"commands,omitempty"`
	Error                        string                           `json:"error,omitempty"`
}

type SDCommandInvocationMessage struct {
	SDInstanceUID string                `json:"sdInstanceUID"`
	CommandName   string                `json:"commandName"`
	Parameters    []SDParameterSnapshot `json:"parameters"`
}

type VPLInterpretGetSnapshotsResultOrError struct {
	SDParameterSnapshotsValues []SDParameterSnapshotValue `json:"snapshots,omitempty"`
	Error                      string                     `json:"error,omitempty"`
}

type SDParameterSnapshotValue struct {
	SDInstanceUID string   `json:"sdInstanceUID"`
	SDType        string   `json:"sdType"`
	String        *string  `json:"string,omitempty"`
	Number        *float64 `json:"number,omitempty"`
	Boolean       *bool    `json:"boolean,omitempty"`
}
