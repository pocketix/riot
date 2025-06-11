package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/misc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDLLModelRole(roleEntity dbModel.RoleEntity) dllModel.Role {
	return dllModel.Role{
		ID:          sharedUtils.NewOptionalOf[uint32](roleEntity.ID),
		Label:       roleEntity.Label,
		Permissions: sharedUtils.Map(roleEntity.Permissions, ToDLLModelPermission),
	}
}

func ToDLLModelPermission(permissionEntity dbModel.PermissionEntity) dllModel.Permission {
	var operationTypeAccessPermissionModel *dllModel.OperationTypeAccessPermission
	if operationTypeAccessPermissionEntity := permissionEntity.OperationTypeAccessPermission; operationTypeAccessPermissionEntity != nil {
		operationTypeAccessPermissionModel = &dllModel.OperationTypeAccessPermission{
			OperationType: misc.GraphQLOperationType(operationTypeAccessPermissionEntity.OperationType),
		}
	}
	var singleOperationPermissionModel *dllModel.SingleOperationPermission
	if singleOperationPermissionEntity := permissionEntity.SingleOperationPermission; singleOperationPermissionEntity != nil {
		singleOperationPermissionModel = &dllModel.SingleOperationPermission{
			GraphQLOperationIdentifier: singleOperationPermissionEntity.GraphQLOperation.Identifier,
			Effect:                     singleOperationPermissionEntity.Effect,
		}
	}
	return dllModel.Permission{
		ID:                            sharedUtils.NewOptionalOf(permissionEntity.ID),
		Label:                         permissionEntity.Label,
		OperationTypeAccessPermission: sharedUtils.NewOptionalFromPointer(operationTypeAccessPermissionModel),
		SingleOperationPermission:     sharedUtils.NewOptionalFromPointer(singleOperationPermissionModel),
	}
}
