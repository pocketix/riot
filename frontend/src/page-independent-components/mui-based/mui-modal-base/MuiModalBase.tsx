import React, { ReactNode } from 'react'
import { Box, Modal } from '@mui/material'
import styles from './styles.module.scss'
import { EffectFunction } from '../../../util'

interface MuiModalBaseProps {
  isOpen: boolean
  onCloseHandler: EffectFunction
  modalTitle: string
  content: ReactNode
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

const MuiModalBase: React.FC<MuiModalBaseProps> = (props) => {
  return (
    <div>
      <Modal open={props.isOpen}>
        <Box sx={style}>
          <div className={styles.headerRow}>
            <p>{props.modalTitle}</p>
            <span onClick={props.onCloseHandler} className="material-symbols-outlined">
              close
            </span>
          </div>
          {props.content}
        </Box>
      </Modal>
    </div>
  )
}

export default MuiModalBase
