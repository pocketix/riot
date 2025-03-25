import { gql } from '@apollo/client'

export const DELETE_DEVICE_TYPE = gql`
  mutation DeleteSDType($id: ID!) {
    deleteSDType(id: $id)
  }
`

export const CREATE_DEVICE_TYPE = gql`
  mutation CreateSDType($input: SDTypeInput!) {
    createSDType(input: $input) {
      denotation
      icon
      id
      label
      parameters {
        denotation
        id
        label
        type
      }
    }
  }
`

export const CREATE_KPI_DEFINITION = gql`
  mutation createKPIDefinition($input: KPIDefinitionInput!) {
    createKPIDefinition(input: $input) {
      id
    }
  }
`

export const UPDATE_KPI_DEFINITION = gql`
  mutation updateKPIDefinition($id: ID!, $input: KPIDefinitionInput!) {
    updateKPIDefinition(id: $id, input: $input) {
      id
    }
  }
`

export const DELETE_KPI_DEFINITION = gql`
  mutation DeleteKPIDefinition($id: ID!) {
    deleteKPIDefinition(id: $id)
  }
`

export const UPDATE_USER_CONFIG = gql`
  mutation UpdateUserConfig($userId: ID!, $input: UserConfigInput!) {
    updateUserConfig(userId: $userId, input: $input) {
      userId
      config
    }
  }
`
