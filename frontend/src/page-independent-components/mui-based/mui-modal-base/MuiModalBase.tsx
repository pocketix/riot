import React, { ReactNode } from 'react'
import { Dialog, DialogContent } from '@mui/material'
import styles from './styles.module.scss'
import { EffectFunction } from '../../../util'

interface MuiModalBaseProps {
  isOpen: boolean
  onCloseHandler: EffectFunction
  modalTitle: string
  content: ReactNode
}

const MuiModalBase: React.FC<MuiModalBaseProps> = (props) => {
  return (
    <Dialog open={props.isOpen} onClose={props.onCloseHandler}>
      <DialogContent sx={{ width: '20vw' }}>
        <div className={styles.headerRow}>
          <p>{props.modalTitle}</p>
          <span onClick={props.onCloseHandler} className="material-symbols-outlined">
            close
          </span>
        </div>
        {props.content}
      </DialogContent>
    </Dialog>
  )
}

export default MuiModalBase
