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
        icon
      }
    }
  }
`

export const GET_PARAMETERS = gql`
  query SdType($sdTypeId: ID!) {
    sdType(id: $sdTypeId) {
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
      commands {
        id
        name
        payload
        sdTypeId
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

export const GET_USER_CONFIG = gql`
  query UserConfig($userConfigId: ID!) {
    userConfig(id: $userConfigId) {
      userId
      config
    }
  }
`
export const GET_KPI_DEFINITIONS = gql`
  query KPIDefinitions {
    kpiDefinitions {
      id
      userIdentifier
      sdTypeID
      sdTypeSpecification
      sdInstanceMode
      selectedSDInstanceUIDs
    }
  }
`

export const GET_KPI_DEFINITION_DETAILS = gql`
  query KPIDefinitionDetail($id: ID!) {
    kpiDefinition(id: $id) {
      id
      userIdentifier
      sdTypeID
      sdTypeSpecification
      sdInstanceMode
      selectedSDInstanceUIDs
      nodes {
        ... on LogicalOperationKPINode {
          id
          parentNodeID
          nodeType
          type
        }
        ... on BooleanEQAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          booleanReferenceValue
        }
        ... on NumericEQAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          numericReferenceValue
        }
        ... on NumericGEQAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          numericReferenceValue
        }
        ... on NumericGTAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          numericReferenceValue
        }
        ... on NumericLEQAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          numericReferenceValue
        }
        ... on NumericLTAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          numericReferenceValue
        }
        ... on StringEQAtomKPINode {
          id
          parentNodeID
          nodeType
          sdParameterID
          sdParameterSpecification
          stringReferenceValue
        }
      }
    }
  }
`
export const GET_REST_OF_KPI_DEFINITION_DETAIL_PAGE_DATA = gql`
  query RestOfKPIDefinitionDetailPageData {
    sdTypes {
      id
      denotation
      parameters {
        id
        denotation
        type
      }
    }
    sdInstances {
      id
      uid
      confirmedByUser
      userIdentifier
      type {
        id
      }
    }
  }
`

export const GET_PROGRMS = gql`
  query VplPrograms {
    vplPrograms {
      data
      id
      enabled
      lastRun
      name
    }
  }
`
