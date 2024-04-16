import React from 'react'
import { FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { LogicalOperationNodeType } from '../editable-tree/EditableTree'
import MuiModalBase from '../../../../page-independent-components/mui-modal-base/MuiModalBase'

interface ChangeLogicalOperationTypeModalProps {
  isOpen: boolean
  onCloseHandler: () => void
  selectedLogicalOperationTypeHandler: (logicalOperationType: LogicalOperationNodeType) => void
}

const SelectLogicalOperationTypeModal: React.FC<ChangeLogicalOperationTypeModalProps> = (props) => {
  const handleChange = (event: SelectChangeEvent<LogicalOperationNodeType>) => {
    props.selectedLogicalOperationTypeHandler(event.target.value as LogicalOperationNodeType)
    props.onCloseHandler()
  }
  return (
    <MuiModalBase
      isOpen={props.isOpen}
      onCloseHandler={props.onCloseHandler}
      modalTitle="Select logical operation type"
      content={
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={8.8}>
            <FormControl fullWidth>
              <InputLabel id="select-field-label">Logical operation type</InputLabel>
              <Select labelId="select-field-label" value="" label="Logical operation type" onChange={handleChange}>
                <MenuItem value={LogicalOperationNodeType.AND}>AND</MenuItem>
                <MenuItem value={LogicalOperationNodeType.OR}>OR</MenuItem>
                <MenuItem value={LogicalOperationNodeType.NOR}>NOR</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      }
    ></MuiModalBase>
  )
}

export default SelectLogicalOperationTypeModal
