import { Button, Grid } from '@mui/material'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import ModalBase from './mui-based/ModalBase'
import { AsynchronousEffectFunction } from '../settings/KPIDefinitions/components/util'

interface ConfirmDeletionModalProps {
  denotationOfItemToBeDeleted: string
  onConfirm: AsynchronousEffectFunction
}

export default NiceModal.create<ConfirmDeletionModalProps>((props) => {
  const { visible, hide } = useModal()
  return (
    <ModalBase isOpen={visible} onClose={hide} modalTitle={`Confirm deletion – ${props.denotationOfItemToBeDeleted}`}>
      <p className="mb-5">
        The {props.denotationOfItemToBeDeleted} is going to be deleted once you click on the '<strong>Confirm</strong>' button. Remember that this cannot be taken back.
      </p>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={5}>
          <Button fullWidth onClick={props.onConfirm}>
            Confirm
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
