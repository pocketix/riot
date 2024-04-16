import React from 'react'
import { Box, FormControl, Grid, InputLabel, MenuItem, Modal, Select, SelectChangeEvent } from '@mui/material'
import { LogicalOperationNodeType } from '../editable-tree/EditableTree'
import styles from './styles.module.scss'

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
  backgroundColor: '#ffffff',
  border: '3px solid #000',
  p: 2
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
          <div className={styles.headerRow}>
            <p>Change logical operation type</p>
            <span onClick={props.onCloseHandler} className="material-symbols-outlined">
              close
            </span>
          </div>
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
        </Box>
      </Modal>
    </div>
  )
}

export default ChangeLogicalOperationTypeModal
