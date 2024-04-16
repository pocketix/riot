import React, { useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material'
import styles from './styles.module.scss'
import { SdTypesQuery } from '../../../../generated/graphql'

interface CreateSDTypeFormProps {
  sdTypesQueryData: SdTypesQuery
  createSDType: (denotation: string, parameters: { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]) => Promise<void>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const CreateSDTypeForm: React.FC<CreateSDTypeFormProps> = (props) => {
  const [denotation, setDenotation] = useState<string>('shelly1pro')
  const [parameters, setParameters] = useState<{ denotation: string; type: string }[]>([{ denotation: 'relay_0_temperature', type: 'NUMBER' }])

  const isFormDisabled: boolean = useMemo<boolean>(() => props.anyLoadingOccurs || props.anyErrorOccurred, [props.anyLoadingOccurs, props.anyErrorOccurred])
  const denotationFieldError: boolean = useMemo<boolean>(
    () => denotation.length === 0 || props.sdTypesQueryData?.sdTypes.some((sdType) => sdType.denotation === denotation),
    [denotation, props.sdTypesQueryData]
  )
  const denotationFieldHelperText: string = useMemo<string>(() => {
    if (!denotationFieldError) {
      return ''
    } else if (denotation.length === 0) {
      return 'SD type denotation must be a non-empty string'
    } else {
      return 'SD type denotation must be unique'
    }
  }, [denotationFieldError, denotation])
  const formSubmitButtonDisabled: boolean = useMemo<boolean>(
    () => isFormDisabled || denotationFieldError || parameters.some((p) => p.denotation.length === 0),
    [isFormDisabled, denotationFieldError, parameters]
  )

  const onSubmitHandler = useCallback(async () => {
    await props.createSDType(denotation, parameters as { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[])
  }, [denotation, parameters, props.createSDType])

  const onDenotationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDenotation(e.target.value)
  }, [])

  const onParameterDenotationChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const newParameters = [...parameters]
    newParameters[index].denotation = e.target.value
    setParameters(newParameters)
  }

  const onParameterTypeChange = (index: number) => (e: SelectChangeEvent) => {
    const newParameters = [...parameters]
    newParameters[index].type = e.target.value
    setParameters(newParameters)
  }

  const addParameter = () => {
    setParameters([...parameters, { denotation: 'relay_0_temperature', type: 'NUMBER' }])
  }

  const deleteParameter = (index: number) => {
    const newParameters = [...parameters]
    newParameters.splice(index, 1)
    setParameters(newParameters)
  }

  return (
    <div className={styles.form}>
      <h2>Create SD type definition</h2>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={8}>
          <TextField fullWidth error={denotationFieldError} label="Denotation" value={denotation} disabled={isFormDisabled} onChange={onDenotationChange} helperText={denotationFieldHelperText} />
        </Grid>
        <Grid item xs={4} />
        <Grid item xs={12} style={{ height: 15 }} />
        {parameters.map((parameter, index) => {
          const parameterDenotationFieldError: boolean = parameter.denotation.length === 0
          const parameterDenotationFieldHelperText: string = parameterDenotationFieldError ? 'Parameter denotation must be a non-empty string' : ''

          return (
            <React.Fragment key={index}>
              <Grid item xs={4} style={{ height: 80 }}>
                <TextField
                  fullWidth
                  error={parameterDenotationFieldError}
                  label={`Parameter ${index + 1} – Denotation`}
                  value={parameter.denotation}
                  disabled={isFormDisabled}
                  onChange={onParameterDenotationChange(index)}
                  helperText={parameterDenotationFieldHelperText}
                />
              </Grid>
              <Grid item xs={4} style={{ height: 80 }}>
                <FormControl fullWidth>
                  <InputLabel id={`parameter-type-select-label-${index}`}>{`Parameter ${index + 1} – Type`}</InputLabel>
                  <Select
                    labelId={`parameter-type-select-label-${index}`}
                    label={`Parameter ${index + 1} – Type`}
                    value={parameter.type}
                    onChange={onParameterTypeChange(index)}
                    disabled={isFormDisabled}
                  >
                    <MenuItem value={'STRING'}>STRING</MenuItem>
                    <MenuItem value={'NUMBER'}>NUMBER</MenuItem>
                    <MenuItem value={'BOOLEAN'}>BOOLEAN</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3} style={{ height: 60 }}>
                <Button fullWidth disabled={isFormDisabled} onClick={() => deleteParameter(index)}>
                  Delete this parameter
                </Button>
              </Grid>
              <Grid item xs={1} />
            </React.Fragment>
          )
        })}
        <Grid item xs={3}>
          <Button fullWidth disabled={isFormDisabled} onClick={addParameter}>
            Introduce next parameter
          </Button>
        </Grid>
        <Grid item xs={7} />
        <Grid item xs={4}>
          <Button fullWidth disabled={formSubmitButtonDisabled} onClick={onSubmitHandler}>
            Submit
          </Button>
        </Grid>
      </Grid>
    </div>
  )
}

export default CreateSDTypeForm
