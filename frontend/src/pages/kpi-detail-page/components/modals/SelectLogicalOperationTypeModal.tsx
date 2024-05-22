import React from 'react'
import { FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { LogicalOperationNodeType } from '../editable-tree/EditableTree'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import { ConsumerFunction } from '../../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

interface SelectLogicalOperationTypeModalProps {
  onLogicalOperationTypeSelection: ConsumerFunction<LogicalOperationNodeType>
}

export default NiceModal.create<SelectLogicalOperationTypeModalProps>((props) => {
  const { visible, remove } = useModal()
  return (
    <ModalBase isOpen={visible} onClose={remove} modalTitle="Select logical operation type">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={8.8}>
          <FormControl fullWidth>
            <InputLabel id="select-field-label">Logical operation type</InputLabel>
            <Select
              labelId="select-field-label"
              value=""
              label="Logical operation type"
              onChange={(e: SelectChangeEvent<LogicalOperationNodeType>) => {
                props.onLogicalOperationTypeSelection(e.target.value as LogicalOperationNodeType)
                remove()
              }}
            >
              <MenuItem value={LogicalOperationNodeType.AND}>AND</MenuItem>
              <MenuItem value={LogicalOperationNodeType.OR}>OR</MenuItem>
              <MenuItem value={LogicalOperationNodeType.NOR}>NOR</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
