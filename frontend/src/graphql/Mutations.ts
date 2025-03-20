import { gql } from '@apollo/client'

export const UPDATE_USER_CONFIG = gql`
  mutation UpdateUserConfig($userId: ID!, $input: UserConfigInput!) {
    updateUserConfig(userId: $userId, input: $input) {
      userId
      config
    }
  }
`
