package dllModel

import "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"

type SDInstance struct {
	ID              sharedUtils.Optional[uint32]
	UID             string
	ConfirmedByUser bool
	UserIdentifier  string
	SDType          SDType
	Commands        []SDCommand // Vazba na příkazy
}

type SDCommand struct {
	ID          uint32
	Denotation  string
	Type        string
	Payload     string
	Invocations []SDCommandInvocation // Vazba na historii spuštění příkazu
}

type SDCommandInvocation struct {
	ID             uint32
	InvocationTime string
	Payload        string
	UserID         uint32
}
