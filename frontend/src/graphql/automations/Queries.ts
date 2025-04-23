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
