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

export const UPDATE_VPL_PROGRAM_BY_NAME = gql`
  mutation UpdateVPLProgramByName($name: String!, $newName: String!, $data: JSON!) {
    updateVPLProgramByName(name: $name, newName: $newName, data: $data) {
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

export const DELETE_VPL_PROGRAM_BY_NAME = gql`
  mutation DeleteVPLProgramByName($name: String!) {
    deleteVPLProgramByName(name: $name)
  }
`
