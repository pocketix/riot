import { gql } from "@apollo/client";

export const GET_GROUPS_WITH_KPI_DATA = gql`
  query SdInstanceGroupsWithKPIData {
    sdInstanceGroups {
      id
      userIdentifier
      sdInstanceIDs
    }
    kpiDefinitions {
      id
      sdTypeSpecification
      userIdentifier
      sdInstanceMode
      selectedSDInstanceUIDs
      sdTypeID
    }
    kpiFulfillmentCheckResults {
      kpiDefinitionID
      sdInstanceID
      fulfilled
    }
  }
`
