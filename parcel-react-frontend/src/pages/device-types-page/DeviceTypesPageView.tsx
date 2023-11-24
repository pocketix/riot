import React from 'react'
import CurrentlyDefinedDeviceTypesSection from './components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection'
import NewDeviceTypeForm from './components/new-device-type-form/NewDeviceTypeForm'
import { DeviceTypesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'

interface DeviceTypesPageViewProps {
  deviceTypesQueryData: DeviceTypesQuery
  createNewDeviceType: (denotation: string, parameters: { name: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  deleteDeviceType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DeviceTypesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="Device types" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <CurrentlyDefinedDeviceTypesSection deviceTypesQueryData={props.deviceTypesQueryData} deleteDeviceType={props.deleteDeviceType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
      <NewDeviceTypeForm deviceTypesQueryData={props.deviceTypesQueryData} createNewDeviceType={props.createNewDeviceType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
    </StandardContentPageTemplate>
  )
}

export default DeviceTypesPageView
