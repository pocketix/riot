import { gql } from '@apollo/client'

export const DELETE_DEVICE_TYPE = gql`
  mutation DeleteSDType($id: ID!) {
    deleteSDType(id: $id)
  }
`
