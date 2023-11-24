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
          props.deviceTypesQueryData.deviceTypes.map((deviceType) => (
            <DeviceTypeWidget
              key={deviceType.id}
              id={deviceType.id}
              denotation={deviceType.denotation}
              areParametersDisplayed={areParametersDisplayed}
              parameters={deviceType.parameters}
              deleteDeviceType={props.deleteDeviceType}
              anyLoadingOccurs={props.anyLoadingOccurs}
              anyErrorOccurred={props.anyErrorOccurred}
            />
          ))}
      </div>
    </div>
  )
}

export default CurrentlyDefinedDeviceTypesSection
