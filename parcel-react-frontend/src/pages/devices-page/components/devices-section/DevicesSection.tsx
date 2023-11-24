import { DevicesQuery } from '../../../../generated/graphql'
import React from 'react'
import DeviceWidget from '../device-widget/DeviceWidget'
import styles from './DevicesSection.module.scss'

interface DevicesSectionProps {
  devicesQueryData: DevicesQuery
  updateDeviceName: (id: string, newName: string) => Promise<void>
}

const DevicesSection: React.FC<DevicesSectionProps> = (props) => {
  return (
    <div className={styles.section}>
      {props.devicesQueryData &&
        props.devicesQueryData.devices
          .slice()
          .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
          .map((device) => <DeviceWidget key={device.id} id={device.id} name={device.name} uid={device.uid} typeDenotation={device.type.denotation} updateDeviceName={props.updateDeviceName} />)}
    </div>
  )
}

export default DevicesSection
