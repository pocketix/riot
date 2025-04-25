import { gql } from '@apollo/client'

export const GET_VPL_PROGRAMS = gql`
  query VplPrograms {
    vplPrograms {
      id
      name
      data
      lastRun
      enabled
    }
  }
`

export const GET_VPL_PROGRAM = gql`
  query VplProgram($id: ID!) {
    vplProgram(id: $id) {
      id
      name
      data
      lastRun
      enabled
    }
  }
`

export const GET_VPL_PROGRAM_BY_NAME = gql`
  query VplProgramByName($name: String!) {
    vplProgramByName(name: $name) {
      id
      name
      data
      lastRun
      enabled
    }
  }
`

export const GET_VPL_PROCEDURES = gql`
  query VplProcedures {
    vplProcedures {
      id
      name
      data
    }
  }
`

export const GET_VPL_PROCEDURE = gql`
  query VplProcedure($id: ID!) {
    vplProcedure(id: $id) {
      id
      name
      data
    }
  }
`
