import { Grid } from '@mui/material'
import { Button } from '@/components/ui/button'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { EffectFunction } from '../util'

interface SelectNewNodeTypeModalProps {
  initiateNewLogicalOperationNodeCreation: EffectFunction
  initiateNewAtomNodeCreation: EffectFunction
}

export default NiceModal.create<SelectNewNodeTypeModalProps>((props) => {
  const { visible, remove } = useModal()
  return (
    <ModalBase isOpen={visible} onClose={remove} modalTitle="Select the type of the node">
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={3}>
          <Button variant={'secondary'} onClick={props.initiateNewAtomNodeCreation}>
            Atom
          </Button>
        </Grid>
        <Grid item xs={9}></Grid>
        <Grid item xs={6}>
          <Button variant={'secondary'} onClick={props.initiateNewLogicalOperationNodeCreation}>
            Logical operation
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
