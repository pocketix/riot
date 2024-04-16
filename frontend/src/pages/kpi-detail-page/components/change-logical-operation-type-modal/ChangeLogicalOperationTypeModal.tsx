import React from 'react'
import { Box, FormControl, InputLabel, MenuItem, Modal, Select, SelectChangeEvent } from '@mui/material'
import { LogicalOperationNodeType } from '../editable-tree/EditableTree'

interface ChangeLogicalOperationTypeModalProps {
  isOpen: boolean
  onCloseHandler: () => void
  changeLogicalOperationType: (newOperationType: LogicalOperationNodeType) => void
}

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '10vw',
  height: '10vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
}

const ChangeLogicalOperationTypeModal: React.FC<ChangeLogicalOperationTypeModalProps> = (props) => {
  const handleChange = (event: SelectChangeEvent<LogicalOperationNodeType>) => {
    props.changeLogicalOperationType(event.target.value as LogicalOperationNodeType)
    props.onCloseHandler()
  }

  return (
    <div>
      <Modal open={props.isOpen}>
        <Box sx={style}>
          <span
            onClick={props.onCloseHandler}
            style={{
              fontSize: 48
            }}
            className="material-symbols-outlined"
          >
            close
          </span>
          <FormControl fullWidth>
            <InputLabel id="select-field-label">Logical operation type</InputLabel>
            <Select labelId="select-field-label" value="" label="Logical operation type" onChange={handleChange}>
              <MenuItem value={LogicalOperationNodeType.AND}>AND</MenuItem>
              <MenuItem value={LogicalOperationNodeType.OR}>OR</MenuItem>
              <MenuItem value={LogicalOperationNodeType.NOR}>NOR</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Modal>
    </div>
  )
}

export default ChangeLogicalOperationTypeModal
