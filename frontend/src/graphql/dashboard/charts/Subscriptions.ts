import { gql } from '@apollo/client'

export const ON_SD_PARAMETER_SNAPSHOT_UPDATE = gql`
  subscription OnSDParameterSnapshotUpdate {
    onSDParameterSnapshotUpdate {
      instanceUid
      parameterDenotation
      string
      number
      boolean
      updatedAt
    }
  }
`
