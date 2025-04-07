import { gql } from '@apollo/client'

export const ON_SD_INSTANCE_REGISTERED = gql`
  subscription OnSDInstanceRegistered {
    onSDInstanceRegistered {
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
