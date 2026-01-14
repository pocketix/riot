package dll2db

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
)

func ToDBModelRole(role dllModel.Role) dbModel.RoleEntity {
	return dbModel.RoleEntity{
		ID:    role.ID.GetPayloadOrDefault(0),
		Label: role.Label,
		Permissions: sharedUtils.Map(role.Permissions, func(permission dllModel.Permission) dbModel.PermissionEntity {
			return ToDBModelPermission(permission)
		}),
	}
}

func ToDBModelPermission(permission dllModel.Permission) dbModel.PermissionEntity {
	var operationTypeAccessPermissionEntity *dbModel.OperationTypeAccessPermissionEntity
	if permission.OperationTypeAccessPermission.IsPresent() {
		operationTypeAccessPermission := permission.OperationTypeAccessPermission.GetPayload()
		operationTypeAccessPermissionEntity = &dbModel.OperationTypeAccessPermissionEntity{
			OperationType: string(operationTypeAccessPermission.OperationType),
		}
	}
	var singleOperationPermissionEntity *dbModel.SingleOperationPermissionEntity
	if permission.SingleOperationPermission.IsPresent() {
		singleOperationPermission := permission.SingleOperationPermission.GetPayload()
		singleOperationPermissionEntity = &dbModel.SingleOperationPermissionEntity{
			Effect: singleOperationPermission.Effect,
		}
	}
	return dbModel.PermissionEntity{
		ID:                            permission.ID.GetPayload(),
		Label:                         permission.Label,
		Roles:                         nil, // TODO: Confirm that this is harmless
		OperationTypeAccessPermission: operationTypeAccessPermissionEntity,
		SingleOperationPermission:     singleOperationPermissionEntity,
	}
}
