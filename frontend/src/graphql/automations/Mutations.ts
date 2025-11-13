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

export const CREATE_VPL_PROCEDURE = gql`
  mutation CreateVPLProcedure($input: VPLProcedureInput!) {
    createVPLProcedure(input: $input) {
      id
      name
      data
    }
  }
`

export const UPDATE_VPL_PROCEDURE = gql`
  mutation UpdateVPLProcedure($id: ID!, $input: VPLProcedureInput!) {
    updateVPLProcedure(id: $id, input: $input) {
      id
      name
      data
    }
  }
`

export const DELETE_VPL_PROCEDURE = gql`
  mutation DeleteVPLProcedure($id: ID!) {
    deleteVPLProcedure(id: $id)
  }
`

export const LINK_PROGRAM_TO_PROCEDURE = gql`
  mutation LinkProgramToProcedure($programId: ID!, $procedureId: ID!) {
    linkProgramToProcedure(programId: $programId, procedureId: $procedureId)
  }
`

export const UNLINK_PROGRAM_FROM_PROCEDURE = gql`
  mutation UnlinkProgramFromProcedure($programId: ID!, $procedureId: ID!) {
    unlinkProgramFromProcedure(programId: $programId, procedureId: $procedureId)
  }
`
