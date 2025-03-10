import { gql } from '@apollo/client'

export const GET_INSTANCES = gql`
  query SdInstances {
    sdInstances {
      id
      uid
      confirmedByUser
      userIdentifier
      type {
        id
        denotation
      }
    }
  }
`

export const GET_PARAMETERS = gql`
  query SdType($sdTypeId: ID!) {
    sdType(id: $sdTypeId) {
      denotation
      id
      parameters {
        denotation
        id
        type
      }
    }
  }
`

export const GET_SD_TYPES = gql`
  query SDTypes {
    sdTypes {
      id
      denotation
      label
      icon
      parameters {
        id
        label
        denotation
        type
      }
    }
  }
`

export const GET_TABLE_DATA = gql`
  query StatisticsQuerySensorsWithFields($sensors: SensorsWithFields!, $request: StatisticsInput) {
    statisticsQuerySensorsWithFields(sensors: $sensors, request: $request) {
      data
      time
      deviceId
    }
  }
`
