import React, { ReactNode } from 'react'
import { Dialog, DialogContent } from '@mui/material'
import styles from './styles.module.scss'
import { EffectFunction } from '../../../util'

interface MuiModalBaseProps {
  isOpen: boolean
  onClose: EffectFunction
  modalTitle: string
  children: ReactNode
}

const MuiModalBase: React.FC<MuiModalBaseProps> = (props) => {
  return (
    <Dialog open={props.isOpen} onClose={props.onClose}>
      <DialogContent sx={{ width: '20vw' }}>
        <div className={styles.headerRow}>
          <p>{props.modalTitle}</p>
          <span onClick={props.onClose} className="material-symbols-outlined">
            close
          </span>
        </div>
        {props.children}
      </DialogContent>
    </Dialog>
  )
}

export default MuiModalBase
