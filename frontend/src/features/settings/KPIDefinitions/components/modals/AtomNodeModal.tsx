import React, { useEffect, useState } from 'react'
import { FormControl, Grid } from '@mui/material'
import { Button } from '@/components/ui/button'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import { AtomNodeType } from '../editable-tree/EditableTree'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import StandardSingleSelect from '../../../../page-independent-components/mui-based/StandardSingleSelect'
import MUIBasedTextField from '../../../../page-independent-components/mui-based/MUIBasedTextField'
import { SdParameter, SdParameterType, SdType } from '@/generated/graphql'
import { TetraConsumerFunction } from '../util'

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
            return null
          }
        case SdParameterType.Number:
          if (/^-?\d+(\.\d+)?$/.test(referenceValueString)) {
            return parseFloat(referenceValueString)
          } else {
            return null
          }
      }
    })(referenceValueString, sdParameter.type)
    if (referenceValue === null) {
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
            <StandardSingleSelect
              title="Select SD type parameter"
              allSelectionSubjects={
                props?.sdTypeData?.parameters.map((parameter) => ({
                  id: parameter.id,
                  name: `${parameter.denotation} – ${parameter.type.toString()}`
                })) ?? []
              }
              selectedSelectionSubjectID={sdParameter ? sdParameter.id : ''}
              onChange={(selectedSelectionSubjectID) => {
                const selectedSDParameter = props?.sdTypeData?.parameters.find((p) => p.id === selectedSelectionSubjectID)
                selectedSDParameter && setSDParameter(selectedSDParameter)
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <StandardSingleSelect
              title="Select binary relation"
              allSelectionSubjects={currentBinaryRelationOptions.map((currentBinaryRelationOption) => ({
                id: currentBinaryRelationOption,
                name: currentBinaryRelationOption
              }))}
              selectedSelectionSubjectID={binaryRelation ? binaryRelation : ''}
              onChange={(selectedSelectionSubjectID) => setBinaryRelation(selectedSelectionSubjectID as BinaryRelation)}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <MUIBasedTextField content={referenceValueString} onContentChange={setReferenceValueString} label="Reference value" error={incorrectReferenceValueStringFlag} />
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Button variant="secondary" fullWidth onClick={checkThenConfirm}>
            Confirm
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
