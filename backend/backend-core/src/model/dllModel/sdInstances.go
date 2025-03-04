package dllModel

import "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

type SDInstance struct {
	ID                 sharedUtils.Optional[uint32]
	UID                string
	ConfirmedByUser    bool
	UserIdentifier     string
	SDType             SDType
	CommandInvocations []SDCommandInvocation
}

type SDCommandInvocation struct {
	ID             uint32
	InvocationTime string
	Payload        string
	UserID         uint32
	CommandID      uint32    // Který příkaz byl volán
	SDInstanceID   uint32    // Ke které instanci zařízení patří invokace
}
