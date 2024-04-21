import React, { useEffect, useState } from 'react'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import MuiModalBase from '../../../../page-independent-components/mui-based/mui-modal-base/MuiModalBase'
import { SdParameter, SdParameterType, SdType } from '../../../../generated/graphql'
import { AtomNodeType } from '../editable-tree/EditableTree'
import { EffectFunction, TriConsumerFunction } from '../../../../util'

interface AtomNodeModalProps {
  isOpen: boolean
  onCloseHandler: EffectFunction
  sdTypeData: SdType
  onConfirmHandler: TriConsumerFunction<AtomNodeType, string, string | boolean | number>
}

enum BinaryRelation {
  EQ = '=',
  LT = '<',
  LEQ = '≤',
  GT = '>',
  GEQ = '≥'
}

const AtomNodeModal: React.FC<AtomNodeModalProps> = (props) => {
  const [referenceValueString, setReferenceValueString] = useState<string>('')
  const [incorrectReferenceValueStringFlag, setIncorrectReferenceValueStringFlag] = useState(false)
  const [sdParameter, setSDParameter] = useState<SdParameter | null>(null)
  const [binaryRelation, setBinaryRelation] = useState<BinaryRelation | null>(null)
  const [currentBinaryRelationOptions, setCurrentBinaryRelationOptions] = useState<BinaryRelation[]>([BinaryRelation.EQ, BinaryRelation.LT, BinaryRelation.LEQ, BinaryRelation.GT, BinaryRelation.GEQ])

  useEffect(() => {
    setIncorrectReferenceValueStringFlag(false)
  }, [referenceValueString])

  useEffect(() => {
    if (!sdParameter) {
      return
    }
    if (sdParameter.type === SdParameterType.Number) {
      setBinaryRelation(null)
      setCurrentBinaryRelationOptions([BinaryRelation.EQ, BinaryRelation.LT, BinaryRelation.LEQ, BinaryRelation.GT, BinaryRelation.GEQ])
    } else {
      setBinaryRelation(BinaryRelation.EQ)
      setCurrentBinaryRelationOptions([BinaryRelation.EQ])
    }
  }, [sdParameter])

  const clearModal = () => {
    setReferenceValueString('')
    setIncorrectReferenceValueStringFlag(false)
    setSDParameter(null)
    setBinaryRelation(null)
    setCurrentBinaryRelationOptions([BinaryRelation.EQ, BinaryRelation.LT, BinaryRelation.LEQ, BinaryRelation.GT, BinaryRelation.GEQ])
  }

  const onConfirm = () => {
    const referenceValue = ((referenceValueString: string, sdParameterType: SdParameterType): string | boolean | number | undefined => {
      switch (sdParameterType) {
        case SdParameterType.String:
          return referenceValueString.replace(/^"+|"+$/g, '')
        case SdParameterType.Boolean:
          const lowerCaseReferenceValueString = referenceValueString.toLowerCase()
          if (lowerCaseReferenceValueString === 'true') {
            return true
          } else if (lowerCaseReferenceValueString === 'false') {
            return false
          } else {
            return undefined
          }
        case SdParameterType.Number:
          if (/^-?\d+(\.\d+)?$/.test(referenceValueString)) {
            return parseFloat(referenceValueString)
          } else {
            return undefined
          }
      }
    })(referenceValueString, sdParameter.type)
    if (!referenceValue) {
      setIncorrectReferenceValueStringFlag(true)
      return
    }
    const atomNodeType = ((sdParameterType: SdParameterType, binaryRelation: BinaryRelation): AtomNodeType => {
      switch (sdParameterType) {
        case SdParameterType.String:
          return AtomNodeType.StringEQ
        case SdParameterType.Boolean:
          return AtomNodeType.BooleanEQ
        case SdParameterType.Number:
          switch (binaryRelation) {
            case BinaryRelation.EQ:
              return AtomNodeType.NumericEQ
            case BinaryRelation.LT:
              return AtomNodeType.NumericLT
            case BinaryRelation.LEQ:
              return AtomNodeType.NumericLEQ
            case BinaryRelation.GT:
              return AtomNodeType.NumericGT
            case BinaryRelation.GEQ:
              return AtomNodeType.NumericGEQ
          }
      }
    })(sdParameter.type, binaryRelation)
    clearModal()
    props.onConfirmHandler(atomNodeType, sdParameter.denotation, referenceValue)
  }

  return (
    <MuiModalBase
      isOpen={props.isOpen}
      onCloseHandler={() => {
        clearModal()
        props.onCloseHandler()
      }}
      modalTitle="Atom node configuration"
      content={
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="sd-type-parameter-select-field-label">Select SD type parameter</InputLabel>
              <Select
                labelId="sd-type-parameter-select-field-label"
                value={sdParameter ? sdParameter.id : ''}
                label="Select SD type parameter"
                onChange={(e) => setSDParameter(props.sdTypeData.parameters.find((p) => p.id === e.target.value))}
              >
                {props.sdTypeData &&
                  props.sdTypeData.parameters.map((parameter) => (
                    <MenuItem key={parameter.id} value={parameter.id}>
                      {`${parameter.denotation} (of type ${parameter.type})`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="binary-relation-select-field-label">Select binary relation</InputLabel>
              <Select
                labelId="binary-relation-select-field-label"
                value={binaryRelation ? binaryRelation : ''}
                label="Select binary relation"
                disabled={currentBinaryRelationOptions.length === 1}
                onChange={(e) => {
                  switch (e.target.value) {
                    case BinaryRelation.EQ:
                      setBinaryRelation(BinaryRelation.EQ)
                      break
                    case BinaryRelation.LT:
                      setBinaryRelation(BinaryRelation.LT)
                      break
                    case BinaryRelation.LEQ:
                      setBinaryRelation(BinaryRelation.LEQ)
                      break
                    case BinaryRelation.GT:
                      setBinaryRelation(BinaryRelation.GT)
                      break
                    case BinaryRelation.GEQ:
                      setBinaryRelation(BinaryRelation.GEQ)
                      break
                  }
                }}
              >
                {currentBinaryRelationOptions.map((currentBinaryRelationOption) => {
                  return <MenuItem value={currentBinaryRelationOption}>{currentBinaryRelationOption}</MenuItem>
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="standard-basic"
              label="Reference value"
              variant="outlined"
              value={referenceValueString}
              error={incorrectReferenceValueStringFlag}
              onChange={(e) => setReferenceValueString(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth onClick={onConfirm}>
              Confirm
            </Button>
          </Grid>
        </Grid>
      }
    ></MuiModalBase>
  )
}

export default AtomNodeModal
