import React, { useEffect, useState } from 'react'
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import { SdParameter, SdParameterType, SdType } from '../../../../generated/graphql'
import { AtomNodeType } from '../editable-tree/EditableTree'
import { TetraConsumerFunction } from '../../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

interface AtomNodeModalProps {
  sdTypeData: SdType
  onConfirm: TetraConsumerFunction<AtomNodeType, string, string, string | boolean | number>
  sdParameter?: SdParameter
  binaryRelation?: BinaryRelation
  referenceValueString?: string
}

export enum BinaryRelation {
  EQ = '=',
  LT = '<',
  LEQ = '≤',
  GT = '>',
  GEQ = '≥'
}

const allBinaryRelationOptions = [BinaryRelation.EQ, BinaryRelation.LT, BinaryRelation.LEQ, BinaryRelation.GT, BinaryRelation.GEQ]

export default NiceModal.create<AtomNodeModalProps>((props) => {
  const { visible, remove } = useModal()

  const [referenceValueString, setReferenceValueString] = useState<string>('')
  const [incorrectReferenceValueStringFlag, setIncorrectReferenceValueStringFlag] = useState(false)
  const [sdParameter, setSDParameter] = useState<SdParameter | null>(null)
  const [binaryRelation, setBinaryRelation] = useState<BinaryRelation | null>(null)
  const [currentBinaryRelationOptions, setCurrentBinaryRelationOptions] = useState<BinaryRelation[]>(allBinaryRelationOptions)

  useEffect(() => {
    setSDParameter(props?.sdParameter ?? null)
    setBinaryRelation(props?.binaryRelation ?? null)
    setReferenceValueString(props?.referenceValueString ?? '')
  }, [props])

  useEffect(() => {
    setIncorrectReferenceValueStringFlag(false)
  }, [referenceValueString])

  useEffect(() => {
    if (!sdParameter) {
      return
    }
    if (sdParameter.type === SdParameterType.Number) {
      setCurrentBinaryRelationOptions(allBinaryRelationOptions)
    } else {
      setBinaryRelation(BinaryRelation.EQ)
      setCurrentBinaryRelationOptions([BinaryRelation.EQ])
    }
  }, [sdParameter])

  const checkThenConfirm = () => {
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
    props.onConfirm(atomNodeType, sdParameter.id, sdParameter.denotation, referenceValue)
  }

  return (
    <ModalBase isOpen={visible} onClose={remove} modalTitle="Atom node configuration">
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
              onChange={(e) => setBinaryRelation(e.target.value as BinaryRelation)}
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
          <Button fullWidth onClick={checkThenConfirm}>
            Confirm
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
