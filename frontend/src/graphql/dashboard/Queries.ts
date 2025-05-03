import { gql } from '@apollo/client'

export const GET_USER_CONFIG = gql`
  query UserConfig($userConfigId: ID!) {
    userConfig(id: $userConfigId) {
      userId
      config
    }
  }
`

export const GET_INSTANCES_WITH_SNAPSHOTS = gql`
  query SdInstancesWithTypeAndSnapshot {
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
`
