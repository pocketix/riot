import React, { useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material'
import styles from './NewDeviceTypeForm.module.scss'

interface NewDeviceTypeFormProps {
  createNewUserDefinedDeviceType: (denotation: string, parameters: { name: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const NewDeviceTypeForm: React.FC<NewDeviceTypeFormProps> = (props) => {
  const [denotation, setDenotation] = useState<string>('shelly1pro')
  const [parameterName, setParameterName] = useState<string>('relay_0_temperature')
  const [parameterType, setParameterType] = useState<string>('STRING')
  const isFormDisabled: boolean = useMemo<boolean>(() => props.anyLoadingOccurs || props.anyErrorOccurred, [props.anyLoadingOccurs, props.anyErrorOccurred])

  const onSubmitHandler = useCallback(async () => {
    if (denotation.length === 0) {
      return
    }
    await props.createNewUserDefinedDeviceType(denotation, [
      {
        name: parameterName,
        type: parameterType as 'STRING' | 'NUMBER' | 'BOOLEAN'
      }
    ])
  }, [denotation, parameterName, parameterType, props.createNewUserDefinedDeviceType])

  const onDenotationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDenotation(e.target.value)
  }, [])

  const onParameterNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setParameterName(e.target.value)
  }, [])

  const onParameterTypeChange = useCallback((e: SelectChangeEvent) => {
    setParameterType(e.target.value)
  }, [])

  return (
    <div className={styles.form}>
      <h2>Define new device type</h2>
      <TextField error={denotation.length === 0} label="Denotation" value={denotation} disabled={isFormDisabled} onChange={onDenotationChange} />
      <TextField error={parameterName.length === 0} label="Parameter name" value={parameterName} disabled={isFormDisabled} onChange={onParameterNameChange} />
      <FormControl>
        <InputLabel id="parameter-type-select-label">Parameter type</InputLabel>
        <Select id="parameter-type-select" labelId="parameter-type-select-label" label="Parameter type" value={parameterType} onChange={onParameterTypeChange} disabled={isFormDisabled}>
          <MenuItem value={'STRING'}>STRING</MenuItem>
          <MenuItem value={'NUMBER'}>NUMBER</MenuItem>
          <MenuItem value={'BOOLEAN'}>BOOLEAN</MenuItem>
        </Select>
      </FormControl>
      <Button disabled={isFormDisabled || denotation.length === 0 || parameterName.length === 0} onClick={onSubmitHandler}>
        Submit
      </Button>
    </div>
  )
}

export default NewDeviceTypeForm
