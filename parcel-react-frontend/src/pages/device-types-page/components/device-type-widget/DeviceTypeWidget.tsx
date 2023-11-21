import React, { useCallback, useEffect, useMemo } from 'react'
import { Collapse } from '@mui/material'
import styles from './DeviceTypeWidget.module.scss'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'

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
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const DeviceTypeWidget: React.FC<DeviceTypeWidgetProps> = (props) => {
  const deleteButtonDisabled: boolean = useMemo<boolean>(() => props.anyErrorOccurred, [props.anyErrorOccurred])

  const onDeleteHandler = useCallback(async () => {
    if (deleteButtonDisabled) {
      return
    }
    await props.deleteUserDefinedDeviceType(props.id)
  }, [deleteButtonDisabled, props.deleteUserDefinedDeviceType, props.id])

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
    <GenericCardTemplate
      headerContent={
        <>
          <div className={`${deleteButtonDisabled ? styles.deleteButtonDisabled : styles.deleteButton}`} onClick={() => onDeleteHandler()}>
            <span className="material-symbols-outlined">delete</span>
          </div>
        </>
      }
      bodyContent={
        <>
          <p>
            Denotation: <strong>{props.denotation}</strong>
          </p>
          <Collapse in={props.areParametersDisplayed}>{parameterElements}</Collapse>
        </>
      }
    ></GenericCardTemplate>
  )
}

export default DeviceTypeWidget
