import React, { useState } from 'react'
import { DeviceTypesQuery } from '../../../../generated/graphql'
import { FormControlLabel, Switch } from '@mui/material'
import DeviceTypeWidget from '../device-type-widget/DeviceTypeWidget'
import styles from './CurrentlyDefinedDeviceTypesSection.module.scss'

interface CurrentlyDefinedDeviceTypesSectionProps {
  deviceTypesQueryData: DeviceTypesQuery
  deleteDeviceType: (id: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const CurrentlyDefinedDeviceTypesSection: React.FC<CurrentlyDefinedDeviceTypesSectionProps> = (props) => {
  const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParametersDisplayed(event.target.checked)
  }

  return (
    <div className={styles.sectionContainer}>
      <h2>Currently defined device types</h2>
      <FormControlLabel control={<Switch checked={areParametersDisplayed} onChange={handleChange} />} label="Display parameters?" />
      <div className={styles.section}>
        {props.deviceTypesQueryData &&
          props.deviceTypesQueryData.deviceTypes
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((deviceType) => {
              const deleteButtonDisabled: boolean = props.deviceTypesQueryData && props.deviceTypesQueryData.devices && props.deviceTypesQueryData.devices.some((device) => device.type.id === deviceType.id)
              return (
                <DeviceTypeWidget
                  key={deviceType.id}
                  id={deviceType.id}
                  denotation={deviceType.denotation}
                  areParametersDisplayed={areParametersDisplayed}
                  parameters={deviceType.parameters}
                  deleteDeviceType={props.deleteDeviceType}
                  anyLoadingOccurs={props.anyLoadingOccurs}
                  anyErrorOccurred={props.anyErrorOccurred}
                  deviceButtonDisabled={deleteButtonDisabled}
                />
              )
            })}
      </div>
    </div>
  )
}

export default CurrentlyDefinedDeviceTypesSection
