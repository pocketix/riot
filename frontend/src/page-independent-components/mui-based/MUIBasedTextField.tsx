import React, { useMemo } from 'react'
import { TextField } from '@mui/material'
import { AsynchronousEffectFunction, ConsumerFunction, EffectFunction, generateNewUUID } from '../../util'
import { styled, Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'

export enum MUIBasedTextFieldType {
  Standard,
  Plain
}

interface MUIBasedTextFieldProps {
  content: string
  onContentChange: ConsumerFunction<string>
  label?: string
  type?: MUIBasedTextFieldType
  error?: boolean
  blurOnKeyDownKeys?: string[]
  onBlur?: EffectFunction | AsynchronousEffectFunction
  sx?: SxProps<Theme>
  helperText?: React.ReactNode
}

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

const MUIBasedTextField: React.FC<MUIBasedTextFieldProps> = (props) => {
  const textFieldID = useMemo(() => `text-field-${generateNewUUID()}`, [])
  return props.type && props.type === MUIBasedTextFieldType.Plain ? (
    <PlainTextField
      sx={props.sx ? props.sx : {}}
      id={textFieldID}
      label={props?.label ?? ''}
      value={props.content}
      variant="standard"
      error={props?.error ?? false}
      onChange={(e) => props.onContentChange(e.target.value)}
      onKeyDown={(e) => ((props.blurOnKeyDownKeys && props.blurOnKeyDownKeys.indexOf(e.key) !== -1) || e.key === 'Enter') && (e.target as HTMLInputElement).blur()}
      onBlur={() => props.onBlur && props.onBlur()}
      helperText={props?.helperText ?? ''}
    />
  ) : (
    <TextField
      sx={props.sx ? props.sx : {}}
      id={textFieldID}
      label={props?.label ?? ''}
      value={props.content}
      error={props?.error ?? false}
      onChange={(e) => props.onContentChange(e.target.value)}
      onKeyDown={(e) => ((props.blurOnKeyDownKeys && props.blurOnKeyDownKeys.indexOf(e.key) !== -1) || e.key === 'Enter') && (e.target as HTMLInputElement).blur()}
      onBlur={() => props.onBlur && props.onBlur()}
      helperText={props?.helperText ?? ''}
    />
  )
}

export default MUIBasedTextField
