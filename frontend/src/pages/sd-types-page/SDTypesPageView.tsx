import React from 'react'
import SDTypesSection from './components/SDTypesSection'
import CreateSDTypeForm from './components/CreateSDTypeForm'
import { SdTypesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/StandardContentPageTemplate'
import { AsynchronousBiConsumerFunction, ConsumerFunction } from '../../util'

interface SDTypesPageViewProps {
  sdTypesData: SdTypesQuery
  createSDType: AsynchronousBiConsumerFunction<string, { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]>
  deleteSDType: ConsumerFunction<string>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDTypesPageView: React.FC<SDTypesPageViewProps> = (props) => (
  <StandardContentPageTemplate pageTitle="SD type definitions" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
    <SDTypesSection sdTypesQueryData={props.sdTypesData} deleteSDType={props.deleteSDType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
    <CreateSDTypeForm sdTypesQueryData={props.sdTypesData} createSDType={props.createSDType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
  </StandardContentPageTemplate>
)

export default SDTypesPageView
