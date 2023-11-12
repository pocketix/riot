import React from 'react'
import styles from './DeviceTypesPage.module.scss'
import CurrentlyDefinedDeviceTypesSection from './components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection'
import NewDeviceTypeForm from './components/new-device-type-form/NewDeviceTypeForm'
import { UserDefinedDeviceTypesQuery } from '../../generated/graphql'

interface DeviceTypesPageViewProps {
  userDefinedDeviceTypesQueryData: UserDefinedDeviceTypesQuery
  createNewUserDefinedDeviceType: (denotation: string) => Promise<void>
  deleteUserDefinedDeviceType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DeviceTypesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <div className={styles.deviceTypesPage}>
      <h1>Device types</h1>
      <CurrentlyDefinedDeviceTypesSection
        userDefinedDeviceTypesQueryData={props.userDefinedDeviceTypesQueryData}
        deleteUserDefinedDeviceType={props.deleteUserDefinedDeviceType}
        anyLoadingOccurs={props.anyLoadingOccurs}
        anyErrorOccurred={props.anyErrorOccurred}
      />
      <NewDeviceTypeForm createNewUserDefinedDeviceType={props.createNewUserDefinedDeviceType} anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred} />
    </div>
  )
}

export default DeviceTypesPageView
