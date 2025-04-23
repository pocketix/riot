import { gql } from '@apollo/client'

export const CREATE_VPL_PROGRAM = gql`
  mutation CreateVPLProgram($name: String!, $data: JSON!) {
    createVPLProgram(name: $name, data: $data) {
      id
      name
      data
      lastRun
      enabled
    }
  }
`

export const UPDATE_VPL_PROGRAM = gql`
  mutation UpdateVPLProgram($id: ID!, $name: String!, $data: JSON!) {
    updateVPLProgram(id: $id, name: $name, data: $data) {
      id
      name
      data
      lastRun
      enabled
    }
  }
`

export const DELETE_VPL_PROGRAM = gql`
  mutation DeleteVPLProgram($id: ID!) {
    deleteVPLProgram(id: $id)
  }
`
