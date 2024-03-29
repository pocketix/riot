import React from 'react'
import { DevicesQuery } from '../../generated/graphql'
import StandardContentPageTemplate from '../../page-independent-components/standard-content-page-template/StandardContentPageTemplate'
import styles from './DevicesPageView.module.scss'
import DevicesSection from './components/devices-section/DevicesSection'

interface DeviceTypesPageViewProps {
  devicesQueryData: DevicesQuery
  refetchDevices: VoidFunction
  updateDeviceName: (id: string, newName: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DevicesPageView: React.FC<DeviceTypesPageViewProps> = (props) => {
  return (
    <StandardContentPageTemplate pageTitle="Devices" anyLoadingOccurs={props.anyLoadingOccurs} anyErrorOccurred={props.anyErrorOccurred}>
      <div className={styles.devicesSectionTitle}>
        <h2>Currently registered devices</h2>
        <span onClick={props.refetchDevices} className={`material-symbols-outlined ${styles.pointerCursor}`}>
          refresh
        </span>
      </div>
      <DevicesSection devicesQueryData={props.devicesQueryData} updateDeviceName={props.updateDeviceName}></DevicesSection>
    </StandardContentPageTemplate>
  )
}

export default DevicesPageView
