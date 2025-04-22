import React, { ReactNode } from 'react'
import { Dialog, DialogContent } from '@mui/material'
import { EffectFunction } from '@/features/settings/KPIDefinitions/components/util'

interface MuiModalBaseProps {
  isOpen: boolean
  onClose: EffectFunction
  modalTitle: string
  children: ReactNode
  vwPercentage?: number
}

const ModalBase: React.FC<MuiModalBaseProps> = (props) => {
  return (
    <Dialog
      open={props.isOpen}
      onClose={props.onClose}
      PaperProps={{
        sx: {
          maxWidth: 'none'
        }
      }}
    >
      <DialogContent sx={{ width: `${props.vwPercentage ?? 20}vw` }}>
        <div className="mb-3 flex items-center justify-between gap-2.5">
          <p className="m-0 text-center text-2xl">{props.modalTitle}</p>
          <span onClick={props.onClose} className="material-symbols-outlined cursor-pointer text-5xl">
            close
          </span>
        </div>
        {props.children}
      </DialogContent>
    </Dialog>
  )
}

export default ModalBase
