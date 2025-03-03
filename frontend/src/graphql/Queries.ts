import { gql } from "@apollo/client";

export const GET_INSTANCES = gql`
    query SdInstances {
    sdInstances {
            id
            uid
            confirmedByUser
            userIdentifier
            type {
                id
                denotation
            }
            }
        }
`;

export const GET_PARAMETERS = gql`
    query SdType($sdTypeId: ID!) {
    sdType(id: $sdTypeId) {
        denotation
        id
        parameters {
        denotation
        id
        type
        }
    }
    }
`;
