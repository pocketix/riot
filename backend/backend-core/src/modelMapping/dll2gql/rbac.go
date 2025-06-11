package dll2gql

import (
  "github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/db/misc"
  "github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/dllModel"
  "github.com/MichalBures-OG/bp-bures-RIoT-backend-core/src/model/graphQLModel"
  su "github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils" // TODO: Consider renaming the package or introducing an ergonomic alias such as "su"
)

func ToGraphQLModelRole(role dllModel.Role) graphQLModel.Role {
  return graphQLModel.Role{
    ID:          role.ID.GetPayload(),
    Label:       role.Label,
    Permissions: su.Map(role.Permissions, ToGraphQLModelPermission),
  }
}

func ToGraphQLModelPermission(permission dllModel.Permission) graphQLModel.Permission {
  return graphQLModel.Permission{
    ID:    permission.ID.GetPayload(),
    Label: permission.Label,
    OperationTypeAccessPermission: func() *graphQLModel.OperationTypeAccessPermission {
      if permission.OperationTypeAccessPermission.IsEmpty() {
        return nil
      }
      operationTypeAccessPermission := permission.OperationTypeAccessPermission.GetPayload()
      return &graphQLModel.OperationTypeAccessPermission{
        OperationType: func() graphQLModel.GraphQLOperationType {
          switch operationTypeAccessPermission.OperationType {
          case misc.GraphQLOperationTypeQuery:
            return graphQLModel.GraphQLOperationTypeQuery
          case misc.GraphQLOperationTypeMutation:
            return graphQLModel.GraphQLOperationTypeMutation
          case misc.GraphQLOperationTypeSubscription:
            return graphQLModel.GraphQLOperationTypeSubscription
          default:
            panic("unrecognized 'OperationType': " + operationTypeAccessPermission.OperationType)
          }
        }(),
      }
    }(),
    SingleOperationPermission: func() *graphQLModel.SingleOperationPermission {
      if permission.SingleOperationPermission.IsEmpty() {
        return nil
      }
      singleOperationPermission := permission.SingleOperationPermission.GetPayload()
      return &graphQLModel.SingleOperationPermission{
        GraphQLOperationIdentifier: singleOperationPermission.GraphQLOperationIdentifier,
        Effect: func() graphQLModel.PermissionEffect {
          switch singleOperationPermission.Effect {
          case "allow":
            return graphQLModel.PermissionEffectAllow
          case "deny":
            return graphQLModel.PermissionEffectDeny
          default:
            panic("unrecognized 'Effect': " + singleOperationPermission.Effect)
          }
        }(),
      }
    }(),
  }
}
