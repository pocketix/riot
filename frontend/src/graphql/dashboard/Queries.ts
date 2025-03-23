import { gql } from "@apollo/client";

export const GET_USER_CONFIG = gql`
  query UserConfig($userConfigId: ID!) {
    userConfig(id: $userConfigId) {
      userId
      config
    }
  }
`