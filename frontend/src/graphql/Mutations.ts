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
