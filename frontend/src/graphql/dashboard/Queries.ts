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
  query SdInstancesWithSnapshots {
    sdInstances {
      confirmedByUser
      id
      uid
      userIdentifier
      parameterSnapshots {
        parameterDenotation
        boolean
        instanceUid
        number
        string
        updatedAt
      }
    }
  }
`
