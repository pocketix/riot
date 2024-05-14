import React from 'react'
import SDTypesSection from './components/SDTypesSection'
import { SdTypesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import { ConsumerFunction, EffectFunction } from '../../util'

interface SDTypesPageViewProps {
  sdTypesData: SdTypesQuery
  initiateSDTypeCreation: EffectFunction
  initiateSDTypeDeletion: ConsumerFunction<string>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDTypesPageView: React.FC<SDTypesPageViewProps> = (props) => (
  <StandardContentPageTemplate pageTitle="SD type definitions" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
    <SDTypesSection
      sdTypesQueryData={props.sdTypesData}
      initiateSDTypeCreation={props.initiateSDTypeCreation}
      initiateSDTypeDeletion={props.initiateSDTypeDeletion}
      anyLoadingOccurs={props.anyLoadingOccurs}
      anyErrorOccurred={props.anyErrorOccurred}
    />
  </StandardContentPageTemplate>
)

export default SDTypesPageView
