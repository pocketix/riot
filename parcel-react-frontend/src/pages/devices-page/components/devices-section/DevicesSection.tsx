import { DevicesQuery } from '../../../../generated/graphql'
import React from 'react'
import DeviceWidget from '../device-widget/DeviceWidget'
import styles from "./DevicesSection.module.scss"

interface DevicesSectionProps {
  devicesQueryData: DevicesQuery
}

const DevicesSection: React.FC<DevicesSectionProps> = (props) => {
  return (
    <div className={styles.section}>
      {props.devicesQueryData && props.devicesQueryData.devices.map((device) => <DeviceWidget name={device.name} uid={device.uid} typeDenotation={device.type.denotation}></DeviceWidget>)}
    </div>
  )
}

export default DevicesSection
