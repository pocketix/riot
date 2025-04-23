import React, { useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material'
import { SdTypesQuery } from '../../../generated/graphql'
import { AsynchronousBiConsumerFunction } from '../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import ModalBase from '../../../page-independent-components/mui-based/ModalBase'
import MUIBasedTextField from '../../../page-independent-components/mui-based/MUIBasedTextField'

interface SDTypeModalProps {
  sdTypesQueryData: SdTypesQuery
  onConfirm: AsynchronousBiConsumerFunction<string, { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[]>
}

export default NiceModal.create<SDTypeModalProps>((props) => {
  const { visible, remove } = useModal()

  const [denotation, setDenotation] = useState<string>('shelly1pro')
  const [parameters, setParameters] = useState<{ denotation: string; type: string }[]>([{ denotation: 'relay_0_temperature', type: 'NUMBER' }])

  const denotationFieldErrorFlag = useMemo(() => denotation.length === 0 || props.sdTypesQueryData?.sdTypes.some((sdType) => sdType.denotation === denotation), [denotation, props.sdTypesQueryData])

  const denotationFieldHelperText = useMemo(() => {
    if (!denotationFieldErrorFlag) {
      return ''
    } else if (denotation.length === 0) {
      return 'SD type denotation must be a non-empty string'
    } else {
      return 'SD type denotation must be unique'
    }
  }, [denotationFieldErrorFlag, denotation])

  const formSubmitButtonDisabled = useMemo(() => denotationFieldErrorFlag || parameters.some((p) => p.denotation.length === 0), [denotationFieldErrorFlag, parameters])

  const onSubmitHandler = useCallback(async () => {
    await props.onConfirm(denotation, parameters as { denotation: string; type: 'STRING' | 'NUMBER' | 'BOOLEAN' }[])
  }, [denotation, parameters, props.onConfirm])

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
    <ModalBase isOpen={visible} onClose={remove} modalTitle="Create SD type definition" vwPercentage={40}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={5.5}>
          <FormControl fullWidth>
            <MUIBasedTextField content={denotation} onContentChange={setDenotation} label="Denotation" error={denotationFieldErrorFlag} helperText={denotationFieldHelperText} />
          </FormControl>
        </Grid>
        <Grid item xs={6.5} />
        <Grid item xs={12} />
        {parameters.map((parameter, index) => {
          const parameterDenotationFieldError = parameter.denotation.length === 0
          const parameterDenotationFieldHelperText = parameterDenotationFieldError ? 'Parameter denotation must be a non-empty string' : ''
          return (
            <React.Fragment key={index}>
              <Grid item xs={5.5}>
                <TextField
                  fullWidth
                  error={parameterDenotationFieldError}
                  label={`Parameter ${index + 1} – Denotation`}
                  value={parameter.denotation}
                  onChange={onParameterDenotationChange(index)}
                  helperText={parameterDenotationFieldHelperText}
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel id={`parameter-type-select-label-${index}`}>{`Parameter ${index + 1} – Type`}</InputLabel>
                  <Select labelId={`parameter-type-select-label-${index}`} label={`Parameter ${index + 1} – Type`} value={parameter.type} onChange={onParameterTypeChange(index)}>
                    <MenuItem value={'STRING'}>STRING</MenuItem>
                    <MenuItem value={'NUMBER'}>NUMBER</MenuItem>
                    <MenuItem value={'BOOLEAN'}>BOOLEAN</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={2.5}>
                <Button fullWidth onClick={() => deleteParameter(index)}>
                  Delete this parameter
                </Button>
              </Grid>
              <Grid item xs={1} />
            </React.Fragment>
          )
        })}
        <Grid item xs={3}>
          <Button fullWidth onClick={addParameter}>
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
    </ModalBase>
  )
})
