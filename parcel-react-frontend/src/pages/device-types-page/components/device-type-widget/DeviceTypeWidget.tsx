import React from 'react'
import { Collapse } from '@mui/material'
import styles from './DeviceTypeWidget.module.scss'

interface DeviceTypeParameter {
  id: string
  name: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN'
}

interface DeviceTypeWidgetProps {
  id: string
  denotation: string
  areParametersDisplayed: boolean
  parameters: DeviceTypeParameter[]
  deleteUserDefinedDeviceType: (id: string) => Promise<void>
}

const DeviceTypeWidget: React.FC<DeviceTypeWidgetProps> = (props) => {
  const parameterElements = (
    <>
      <div className={styles.parameterElements}>
        {props.parameters.map((parameter) => (
          <div className={styles.parameterElement}>
            <p>
              Name: <strong>{parameter.name}</strong>
            </p>
            <p>
              Type: <strong>{parameter.type}</strong>
            </p>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className={styles.widget}>
      <div className={styles.upperRow}>
        <p>
          Denotation: <strong>{props.denotation}</strong>
        </p>
        <div className={styles.deleteButton} onClick={() => props.deleteUserDefinedDeviceType(props.id)}>
          <span className="material-symbols-outlined">delete</span>
        </div>
      </div>
      <Collapse in={props.areParametersDisplayed}>{parameterElements}</Collapse>
    </div>
  )
}

export default DeviceTypeWidget
