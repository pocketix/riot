import React from 'react'
import { Button, Grid } from '@mui/material'
import MuiModalBase from '../../../../page-independent-components/mui-modal-base/MuiModalBase'

interface SelectNewNodeTypeModalProps {
  isOpen: boolean
  onCloseHandler: () => void
  initiateNewLogicalOperationNodeCreation: () => void
  initiateNewAtomNodeCreation: () => void
}

const SelectNodeTypeModal: React.FC<SelectNewNodeTypeModalProps> = (props) => {
  return (
    <MuiModalBase
      isOpen={props.isOpen}
      onCloseHandler={props.onCloseHandler}
      modalTitle="Select the type of the node"
      content={
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3}>
            <Button fullWidth onClick={props.initiateNewAtomNodeCreation}>
              Atom
            </Button>
          </Grid>
          <Grid item xs={9}></Grid>
          <Grid item xs={6}>
            <Button fullWidth onClick={props.initiateNewLogicalOperationNodeCreation}>
              Logical operation
            </Button>
          </Grid>
        </Grid>
      }
    ></MuiModalBase>
  )
}

export default SelectNodeTypeModal
