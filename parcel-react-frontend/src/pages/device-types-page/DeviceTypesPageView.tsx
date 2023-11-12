import React from 'react'
import styles from './DeviceTypesPage.module.scss'
import CurrentlyDefinedDeviceTypesSection from './components/currently-defined-device-types-section/CurrentlyDefinedDeviceTypesSection'
import NewDeviceTypeForm from './components/new-device-type-form/NewDeviceTypeForm'
import { UserDefinedDeviceTypesQuery } from '../../generated/graphql'
import { Alert, LinearProgress } from '@mui/material'

interface DeviceTypesPageViewProps {
  userDefinedDeviceTypesQueryData: UserDefinedDeviceTypesQuery
  createNewUserDefinedDeviceType: (denotation: string, parameters: { name: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  deleteUserDefinedDeviceType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DeviceTypesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <div className={styles.deviceTypesPage}>
      <h1>Device types</h1>
      <div className={styles.statusBar}>
        {props.anyLoadingOccurs && <LinearProgress />}
        {props.anyErrorOccurred && <Alert severity="error">Error occurred in communication between system front-end and back-end</Alert>}
      </div>
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
