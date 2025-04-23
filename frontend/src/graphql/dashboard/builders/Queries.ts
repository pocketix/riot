import { gql } from '@apollo/client'

export const GET_INSTANCES_WITH_PARAMETERS = gql`
  query SdInstancesWithParams {
    sdInstances {
      id
      uid
      confirmedByUser
      userIdentifier
      type {
        id
        denotation
        label
        icon
      }
    }
  }
`
// Not working yet
// parameters {
//   id
//   denotation
//   label
//   type
// }

export const GET_SDTYPE_PARAMETERS = gql`
  query SdTypeParameters($sdTypeId: ID!) {
    sdType(id: $sdTypeId) {
      denotation
      id
      parameters {
        denotation
        id
        type
        label
      }
    }
  }
`
export const GET_SDTYPE_PARAMETERS_WITH_SNAPSHOTS = gql`
  query SdTypeParametersWithSnapshots($sdTypeId: ID!) {
    sdType(id: $sdTypeId) {
      denotation
      id
      parameters {
        denotation
        id
        type
        label
        parameterSnapshots {
          instanceId
          parameterId
          string
          number
          boolean
          updatedAt
        }
      }
    }
  }
`
