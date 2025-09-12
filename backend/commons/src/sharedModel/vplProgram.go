package sharedModel

import "time"

type VPLProgram struct {
	ID               uint32            `json:"id"`
	Name             string            `json:"name"`
	Data             string            `json:"data"`
	LastRun          *string           `json:"lastRun,omitempty"`
	Enabled          bool              `json:"enabled"`
	ReferencedValues map[string]string `json:"referencedValues"`
	Procedures       map[string]string `json:"procedures,omitempty"`
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
	Program                      VPLProgram                   `json:"program"`
	SDParameterSnapshotsToUpdate []SDParameterSnapshotsResult `json:"snapshots,omitempty"`
	SDCommandInvocations         []SDCommandToInvoke          `json:"commands,omitempty"`
	ExecutionTime                *time.Time                   `json:"executionTime,omitempty"`
	Enabled                      bool                         `json:"enabled"`
	Success                      bool                         `json:"success"`
	Error                        *string                      `json:"error,omitempty"`
	ExecuingReason               *string                      `json:"executionReason,omitempty"`
}

type VPLInterpretGetDeviceInformationResultOrError struct {
	SDInstanceResultInformation SDInstanceResultInformation `json:"sdInstanceResultInformation"`
	Error                       string                      `json:"error,omitempty"`
}

type SDParameterSnapshotToUpdate struct {
	SDInstanceID  uint32                     `json:"sdInstanceID"`
	SDInstanceUID string                     `json:"sdInstanceUID"`
	SDParameterID uint32                     `json:"sdParameterID"`
	String        SDParameterSnapshotString  `json:"string,omitempty"`
	Number        SDParameterSnapshotNumber  `json:"number,omitempty"`
	Boolean       SDParameterSnapshotBoolean `json:"boolean,omitempty"`
}

type SDParameterSnapshotsResult struct {
	InstanceID  uint32                     `json:"instanceID"`
	ParameterID uint32                     `json:"parameterID"`
	String      SDParameterSnapshotString  `json:"string,omitempty"`
	Number      SDParameterSnapshotNumber  `json:"number,omitempty"`
	Boolean     SDParameterSnapshotBoolean `json:"boolean,omitempty"`
	UpdatedAt   time.Time                  `json:"updatedAt"`
}
type SDParameterSnapshotString struct {
	String string `json:"string"`
	Set    bool   `json:"set"`
}

type SDParameterSnapshotNumber struct {
	Number float64 `json:"number"`
	Set    bool    `json:"set"`
}

type SDParameterSnapshotBoolean struct {
	Boolean bool `json:"boolean"`
	Set     bool `json:"set"`
}

type SDCommandToInvoke struct {
	SDInstanceID  uint32 `json:"sdInstanceID"`
	SDInstanceUID string `json:"sdInstanceUID"`
	CommandID     uint32 `json:"commandID"`
	CommandName   string `json:"commandName"`
	Payload       string `json:"payload,omitempty"`
}

type SDInstanceRequest struct {
	SDInstanceUID string `json:"sdInstanceUID"`
	SDParameterID string `json:"sdParameterID"`
	RequestType   string `json:"requestType"`
}

type SDInstanceResultInformation struct {
	SDParameterSnapshotToUpdate SDParameterSnapshotToUpdate `json:"sdParameterSnapshotToUpdate"`
	SDCommandToInvoke           SDCommandToInvoke           `json:"sdCommandToInvoke"`
}
