import React, { useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Alert, Button, TextField } from '@mui/material'
import styles from './NewDeviceTypeForm.module.scss'

interface NewDeviceTypeFormProps {
  createNewUserDefinedDeviceType: (denotation: string) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const NewDeviceTypeForm: React.FC<NewDeviceTypeFormProps> = (props) => {
  const [denotationText, setDenotationText] = useState<string>('shelly1pro')
  const isFormDisabled: boolean = useMemo<boolean>(() => props.anyLoadingOccurs || props.anyErrorOccurred, [props.anyLoadingOccurs, props.anyErrorOccurred])

  const onSubmitHandler = useCallback(async () => {
    if (denotationText.length === 0) {
      return
    }
    await props.createNewUserDefinedDeviceType(denotationText)
  }, [denotationText, props.createNewUserDefinedDeviceType])

  const onDenotationTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDenotationText(e.target.value)
  }, [])

  return (
    <div className={styles.form}>
      <h2>Define new device type</h2>
      {props.anyErrorOccurred && <Alert severity="error">Error occurred in communication between system front-end and back-end</Alert>}
      <TextField error={denotationText.length === 0} label="Denotation" value={denotationText} disabled={isFormDisabled} onChange={onDenotationTextChange} />
      <Button disabled={isFormDisabled} onClick={onSubmitHandler}>
        Submit
      </Button>
    </div>
  )
}

export default NewDeviceTypeForm
