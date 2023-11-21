import React from 'react'
import CurrentlyDefinedDeviceTypesSection from './components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection'
import NewDeviceTypeForm from './components/new-device-type-form/NewDeviceTypeForm'
import { UserDefinedDeviceTypesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'

interface DeviceTypesPageViewProps {
  userDefinedDeviceTypesQueryData: UserDefinedDeviceTypesQuery
  createNewUserDefinedDeviceType: (denotation: string, parameters: { name: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  deleteUserDefinedDeviceType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DeviceTypesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="Device types" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <CurrentlyDefinedDeviceTypesSection
        userDefinedDeviceTypesQueryData={props.userDefinedDeviceTypesQueryData}
        deleteUserDefinedDeviceType={props.deleteUserDefinedDeviceType}
        anyLoadingOccurs={props.anyLoadingOccurs}
        anyErrorOccurred={props.anyErrorOccurred}
      />
      <NewDeviceTypeForm createNewUserDefinedDeviceType={props.createNewUserDefinedDeviceType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
    </StandardContentPageTemplate>
  )
}

export default DeviceTypesPageView
