package dllModel

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/misc"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

type Role struct {
	ID          sharedUtils.Optional[uint32]
	Label       string
	Permissions []Permission
}

type Permission struct {
	ID                            sharedUtils.Optional[uint32]
	Label                         string
	OperationTypeAccessPermission sharedUtils.Optional[OperationTypeAccessPermission]
	SingleOperationPermission     sharedUtils.Optional[SingleOperationPermission]
}

type OperationTypeAccessPermission struct {
	OperationType misc.GraphQLOperationType
}

type SingleOperationPermission struct {
	GraphQLOperationIdentifier string
	Effect                     string
}
