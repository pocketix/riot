import { gql } from '@apollo/client'

export const KPIFulfillment = gql`
  subscription KPIFulfillment {
    onKPIFulfillmentChecked {
      kpiFulfillmentCheckResults {
        kpiDefinitionID
        sdInstanceID
        fulfilled
      }
    }
  }
`
