import React, { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from 'react'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'
import { TextField } from '@mui/material'
import styles from './DeviceWidget.module.scss'
import { styled } from '@mui/material/styles'

const PlainTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    fontSize: 'inherit',
    fontWeight: '700',
    color: 'inherit',
    padding: 0,
    margin: 0,
    border: 'none',
    '&:before': {
      borderBottom: 'none'
    },
    '&:after': {
      borderBottom: 'none'
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottom: 'none'
    }
  }
})

interface DeviceWidgetProps {
  name: string
  uid: string
  typeDenotation: string
}

const DeviceWidget: React.FC<DeviceWidgetProps> = (props) => {
  const [name, setName] = useState<string>(props.name)

  const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      ;(e.target as EventTarget & HTMLInputElement).blur()
    }
  }, [])

  const onNameConfirm = useCallback(() => {
    if (name === '') {
      setName(props.name)
      return
    }
    console.log('New name: ', name)
  }, [name])

  return (
    <GenericCardTemplate
      headerContent={<></>}
      bodyContent={
        <>
          <div className={styles.body}>
            <div className={styles.deviceNameRow}>
              <p>Name:</p>
              <PlainTextField id="standard-basic" label="" variant="standard" value={name} onChange={onNameChange} onKeyDown={onKeyDown} onBlur={onNameConfirm} />
            </div>
            <p>
              UID: <strong>{props.uid}</strong>
            </p>
            <p>
              Type denotation: <strong>{props.typeDenotation}</strong>
            </p>
          </div>
        </>
      }
    />
  )
}

export default DeviceWidget
