import React from 'react'
import SDTypesSection from './components/sd-types-section/SDTypesSection'
import CreateSDTypeForm from './components/create-sd-type-form/CreateSDTypeForm'
import { SdTypesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'

interface SDTypesPageViewProps {
  sdTypesQueryData: SdTypesQuery
  createSDType: (denotation: string, parameters: { denotation: string, type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  deleteSDType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDTypesPageView: React.FC<SDTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="SD types" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <SDTypesSection sdTypesQueryData={props.sdTypesQueryData} deleteSDType={props.deleteSDType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
      <CreateSDTypeForm sdTypesQueryData={props.sdTypesQueryData} createSDType={props.createSDType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
    </StandardContentPageTemplate>
  )
}

export default SDTypesPageView
