import React from 'react'
import { Button, Grid } from '@mui/material'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import { EffectFunction } from '../../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

interface SelectNewNodeTypeModalProps {
  initiateNewLogicalOperationNodeCreation: EffectFunction
  initiateNewAtomNodeCreation: EffectFunction
}

export default NiceModal.create<SelectNewNodeTypeModalProps>((props) => {
  const { visible, hide } = useModal()
  return (
    <ModalBase isOpen={visible} onClose={hide} modalTitle="Select the type of the node">
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
    </ModalBase>
  )
})
