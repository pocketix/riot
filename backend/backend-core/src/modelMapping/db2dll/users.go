package db2dll

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/misc"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dbModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"time"
)

func ToDLLModelUser(userEntity dbModel.UserEntity) dllModel.User {
	return dllModel.User{
		ID:                     sharedUtils.NewOptionalOf[uint](userEntity.Model.ID),
		Username:               userEntity.Username,
		Email:                  userEntity.Email,
		Name:                   sharedUtils.NewOptionalFromPointer[string](userEntity.Name),
		ProfileImageURL:        sharedUtils.NewOptionalFromPointer[string](userEntity.ProfileImageURL),
		OAuth2Provider:         sharedUtils.NewOptionalFromPointer[string](userEntity.OAuth2Provider),
		OAuth2ProviderIssuedID: sharedUtils.NewOptionalFromPointer[string](userEntity.OAuth2ProviderIssuedID),
		LastLoginAt:            sharedUtils.NewOptionalFromPointer[time.Time](userEntity.LastLoginAt),
		Sessions:               sharedUtils.Map(userEntity.Sessions, ToDLLModelUserSession),
		Roles: sharedUtils.Map(userEntity.Roles, func(roleEntity dbModel.RoleEntity) dllModel.Role {
			return dllModel.Role{
				ID:    sharedUtils.NewOptionalOf[uint32](roleEntity.ID),
				Label: roleEntity.Label,
				Permissions: sharedUtils.Map(roleEntity.Permissions, func(permissionEntity dbModel.PermissionEntity) dllModel.Permission {
					var operationTypeAccessPermission *dllModel.OperationTypeAccessPermission
					if p := permissionEntity.OperationTypeAccessPermission; p != nil {
						operationTypeAccessPermission = &dllModel.OperationTypeAccessPermission{
							OperationType: misc.GraphQLOperationType(p.OperationType),
						}
					}
					var singleOperationPermission *dllModel.SingleOperationPermission
					if p := permissionEntity.SingleOperationPermission; p != nil {
						singleOperationPermission = &dllModel.SingleOperationPermission{
							GraphQLOperationIdentifier: p.GraphQLOperation.Identifier,
							Effect:                     p.Effect,
						}
					}
					return dllModel.Permission{
						ID:                            sharedUtils.NewOptionalOf(permissionEntity.ID),
						Label:                         permissionEntity.Label,
						OperationTypeAccessPermission: sharedUtils.NewOptionalFromPointer(operationTypeAccessPermission),
						SingleOperationPermission:     sharedUtils.NewOptionalFromPointer(singleOperationPermission),
					}
				}),
			}
		}),
		// TODO: Implement 'Invocations', 'UserConfig' and other possibly missing fields as needed
	}
}

func ToDLLModelUserSession(userSessionEntity dbModel.UserSessionEntity) dllModel.UserSession {
	return dllModel.UserSession{
		ID:               sharedUtils.NewOptionalOf(userSessionEntity.ID),
		UserID:           userSessionEntity.UserID,
		RefreshTokenHash: userSessionEntity.RefreshTokenHash,
		ExpiresAt:        userSessionEntity.ExpiresAt,
		Revoked:          userSessionEntity.Revoked,
		IPAddress:        userSessionEntity.IPAddress,
		UserAgent:        userSessionEntity.UserAgent,
	}
}

func ToDLLModelUserConfig(userConfig dbModel.UserConfigEntity) dllModel.UserConfig {
	return dllModel.UserConfig{
		UserID: userConfig.UserID,
		Config: userConfig.Config,
	}
}
