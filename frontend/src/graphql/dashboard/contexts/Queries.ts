import { gql } from '@apollo/client'

export const GET_KPI_DEFINITIONS_DATA = gql`
  query KPIDefinitionsAndResults {
    kpiDefinitions {
      id
      sdTypeSpecification
      userIdentifier
      sdInstanceMode
      selectedSDInstanceUIDs
      sdTypeID
    }
    kpiFulfillmentCheckResults {
      kpiDefinitionID
      sdInstanceID
      fulfilled
    }
  }
`

export const GET_GROUPS = gql`
  query Groups {
    sdInstanceGroups {
      id
      userIdentifier
      sdInstanceIDs
    }
  }
`

export const GET_ALL_SD_TYPES = gql`
  query getAllSdTypes {
    sdTypes {
      id
      parameters {
        id
        denotation
        label
        type
      }
    }
  }
`
