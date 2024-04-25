import React from 'react'
import { SdInstancesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import SDInstancesSection from './components/SDInstancesSection'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../util'

interface SDTypesPageViewProps {
  sdInstancesData: SdInstancesQuery
  updateUserIdentifierOfSdInstance: AsynchronousBiConsumerFunction<string, string>
  confirmSdInstance: AsynchronousConsumerFunction<string>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDInstancesPageView: React.FC<SDTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="SD instances" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <h2>Currently registered SD instances</h2>
      <h3>SD instances confirmed by user</h3>
      <SDInstancesSection
        sdInstancesData={props.sdInstancesData}
        confirmedByUserRequirement={true}
        updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
        confirmSdInstance={props.confirmSdInstance}
      />
      <h3>SD instances not yet confirmed by user</h3>
      <SDInstancesSection
        sdInstancesData={props.sdInstancesData}
        confirmedByUserRequirement={false}
        updateUserIdentifierOfSdInstance={props.updateUserIdentifierOfSdInstance}
        confirmSdInstance={props.confirmSdInstance}
      />
    </StandardContentPageTemplate>
  )
}

export default SDInstancesPageView
