package domainLogicLayer

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/dbClient"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/modelMapping/dll2gql"
	su "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"log"
)

func CreateRole(roleCreationInput graphQLModel.RoleCreationInput) su.Result[graphQLModel.Role] {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	setOfPermissionIDs := su.NewSetFromSlice(roleCreationInput.PermissionIDs)
	permissionsLoadResult := dbClientInstance.LoadPermissions()
	if permissionsLoadResult.IsFailure() {
		return su.NewFailureResult[graphQLModel.Role](permissionsLoadResult.GetError())
	}
	permissions := permissionsLoadResult.GetPayload()
	role := dllModel.Role{
		ID:    su.NewEmptyOptional[uint32](),
		Label: roleCreationInput.Label,
		Permissions: su.Filter(permissions, func(permission dllModel.Permission) bool {
			permissionID := permission.ID.GetPayload()
			return setOfPermissionIDs.Contains(permissionID)
		}),
	}
	if persistResult := dbClientInstance.PersistRole(role); persistResult.IsFailure() {
		return su.NewFailureResult[graphQLModel.Role](persistResult.GetError())
	}
	return su.NewSuccessResult[graphQLModel.Role](dll2gql.ToGraphQLModelRole(role))
}

func UpdateRole(id uint32, roleUpdateInput graphQLModel.RoleUpdateInput) su.Result[graphQLModel.Role] {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	roleLoadResult := dbClientInstance.LoadRole(id)
	if roleLoadResult.IsFailure() {
		return su.NewFailureResult[graphQLModel.Role](roleLoadResult.GetError())
	}
	role := roleLoadResult.GetPayload()
	su.NewOptionalFromPointer(roleUpdateInput.Label).DoIfPresent(func(label string) {
		role.Label = label
	})
	if permissionIDs := roleUpdateInput.PermissionIDs; permissionIDs != nil {
		setOfPermissionIDs := su.NewSetFromSlice(permissionIDs)
		permissionsLoadResult := dbClientInstance.LoadPermissions()
		if permissionsLoadResult.IsFailure() {
			return su.NewFailureResult[graphQLModel.Role](permissionsLoadResult.GetError())
		}
		permissions := permissionsLoadResult.GetPayload()
		role.Permissions = su.Filter(permissions, func(permission dllModel.Permission) bool {
			permissionID := permission.ID.GetPayload()
			return setOfPermissionIDs.Contains(permissionID)
		})
	}
	if persistResult := dbClientInstance.PersistRole(role); persistResult.IsFailure() {
		return su.NewFailureResult[graphQLModel.Role](persistResult.GetError())
	}
	return su.NewSuccessResult[graphQLModel.Role](dll2gql.ToGraphQLModelRole(role))
}

func DeleteRole(id uint32) error {
	return dbClient.GetRelationalDatabaseClientInstance().DeleteRole(id)
}

func GetRoles() su.Result[[]graphQLModel.Role] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadRoles()
	if loadResult.IsFailure() {
		return su.NewFailureResult[[]graphQLModel.Role](loadResult.GetError())
	}
	return su.NewSuccessResult[[]graphQLModel.Role](su.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelRole))
}

func GetPermissions() su.Result[[]graphQLModel.Permission] {
	loadResult := dbClient.GetRelationalDatabaseClientInstance().LoadPermissions()
	if loadResult.IsFailure() {
		return su.NewFailureResult[[]graphQLModel.Permission](loadResult.GetError())
	}
	return su.NewSuccessResult[[]graphQLModel.Permission](su.Map(loadResult.GetPayload(), dll2gql.ToGraphQLModelPermission))
}

// The following operations could be streamlined by exposing and manipulating SQL junction tables directly
// TODO: Revisit during the planned DLL<--->DB multi-layer refactoring

func AssignRoleToUser(userID uint, roleID uint32) error {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	userLoadResult := dbClientInstance.LoadUser(userID)
	if userLoadResult.IsFailure() {
		return userLoadResult.GetError()
	}
	user := userLoadResult.GetPayload()
	setOfIDsOfRolesCurrentlyAssignedToTheUser := su.NewSetFromSlice(su.Map(user.Roles, func(role dllModel.Role) uint32 { return role.ID.GetPayload() }))
	if setOfIDsOfRolesCurrentlyAssignedToTheUser.Contains(roleID) {
		log.Printf("role already assigned | user id = %d, role id = %d\n", userID, roleID)
		return nil
	}
	roleLoadResult := dbClientInstance.LoadRole(roleID)
	if roleLoadResult.IsFailure() {
		return roleLoadResult.GetError()
	}
	role := roleLoadResult.GetPayload()
	user.Roles = append(user.Roles, role)
	persistUserResult := dbClientInstance.PersistUser(user)
	if persistUserResult.IsFailure() {
		return persistUserResult.GetError()
	}
	return nil
}

func UnassignRoleFromUser(userID uint, roleID uint32) error {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	userLoadResult := dbClientInstance.LoadUser(userID)
	if userLoadResult.IsFailure() {
		return userLoadResult.GetError()
	}
	user := userLoadResult.GetPayload()
	setOfIDsOfRolesCurrentlyAssignedToTheUser := su.NewSetFromSlice(su.Map(user.Roles, func(role dllModel.Role) uint32 { return role.ID.GetPayload() }))
	if !setOfIDsOfRolesCurrentlyAssignedToTheUser.Contains(roleID) {
		log.Printf("role not assigned | user id = %d, role id = %d\n", userID, roleID)
		return nil
	}
	user.Roles = su.Filter(user.Roles, func(role dllModel.Role) bool { return role.ID.GetPayload() != roleID })
	persistUserResult := dbClientInstance.PersistUser(user)
	if persistUserResult.IsFailure() {
		return persistUserResult.GetError()
	}
	return nil
}

func AssignPermissionToRole(roleID uint32, permissionID uint32) error {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	roleLoadResult := dbClientInstance.LoadRole(roleID)
	if roleLoadResult.IsFailure() {
		return roleLoadResult.GetError()
	}
	role := roleLoadResult.GetPayload()
	setOfIDsOfPermissionsCurrentlyAssignedToTheRole := su.NewSetFromSlice(su.Map(role.Permissions, func(p dllModel.Permission) uint32 { return p.ID.GetPayload() }))
	if setOfIDsOfPermissionsCurrentlyAssignedToTheRole.Contains(permissionID) {
		log.Printf("permission already assigned | role id = %d, permission id = %d\n", roleID, permissionID)
		return nil
	}
	permissionLoadResult := dbClientInstance.LoadPermission(permissionID)
	if permissionLoadResult.IsFailure() {
		return permissionLoadResult.GetError()
	}
	permission := permissionLoadResult.GetPayload()
	role.Permissions = append(role.Permissions, permission)
	persistRoleResult := dbClientInstance.PersistRole(role)
	if persistRoleResult.IsFailure() {
		return persistRoleResult.GetError()
	}
	return nil
}

func UnassignPermissionFromRole(roleID uint32, permissionID uint32) error {
	dbClientInstance := dbClient.GetRelationalDatabaseClientInstance()
	roleLoadResult := dbClientInstance.LoadRole(roleID)
	if roleLoadResult.IsFailure() {
		return roleLoadResult.GetError()
	}
	role := roleLoadResult.GetPayload()
	setOfIDsOfPermissionsCurrentlyAssignedToTheRole := su.NewSetFromSlice(
		su.Map(role.Permissions, func(p dllModel.Permission) uint32 { return p.ID.GetPayload() }),
	)
	if !setOfIDsOfPermissionsCurrentlyAssignedToTheRole.Contains(permissionID) {
		log.Printf("permission not assigned | role id = %d, permission id = %d\n", roleID, permissionID)
		return nil
	}
	role.Permissions = su.Filter(role.Permissions, func(p dllModel.Permission) bool {
		return p.ID.GetPayload() != permissionID
	})
	persistRoleResult := dbClientInstance.PersistRole(role)
	if persistRoleResult.IsFailure() {
		return persistRoleResult.GetError()
	}
	return nil
}
