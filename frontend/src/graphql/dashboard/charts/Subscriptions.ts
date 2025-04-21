import { gql } from '@apollo/client'

export const ON_SD_PARAMETER_SNAPSHOT_UPDATE = gql`
  subscription OnSDParameterSnapshotUpdate {
    onSDParameterSnapshotUpdate {
      instanceId
      parameterId
      string
      number
      boolean
      updatedAt
    }
  }
`
