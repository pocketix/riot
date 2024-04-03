import React, { ChangeEvent, KeyboardEvent, useCallback, useState } from 'react'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'
import { Button, TextField } from '@mui/material'
import styles from './SDInstanceCard.module.scss'
import { styled } from '@mui/material/styles'

const PlainTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    fontSize: 'inherit',
    fontWeight: '700',
    color: 'inherit',
    padding: 0,
    margin: 0,
    border: 'none',
    '&:before': {
      borderBottom: 'none'
    },
    '&:after': {
      borderBottom: 'none'
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottom: 'none'
    }
  }
})

interface SDInstanceCardProps {
  id: string
  userIdentifier: string
  uid: string
  sdTypeDenotation: string
  confirmedByUser: boolean
  updateUserIdentifierOfSdInstance: (id: string, newUserIdentifier: string) => Promise<void>
  confirmSdInstance: (id: string) => Promise<void>
}

const SDInstanceCard: React.FC<SDInstanceCardProps> = (props) => {
  const [userIdentifier, setUserIdentifier] = useState<string>(props.userIdentifier)

  const onUserIdentifierChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUserIdentifier(e.target.value)
  }, [])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key == 'Enter') {
      ;(e.target as EventTarget & HTMLInputElement).blur()
    }
  }, [])

  const onUserIdentifierConfirm = useCallback(async () => {
    if (userIdentifier === '') {
      setUserIdentifier(props.userIdentifier)
      return
    }
    await props.updateUserIdentifierOfSdInstance(props.id, userIdentifier)
  }, [userIdentifier])

  return (
    <GenericCardTemplate
      headerContent={<></>}
      bodyContent={
        <>
          <div className={styles.body}>
            {props.confirmedByUser && (
              <div className={styles.userIdentifierRow}>
                <p>User identifier:</p>
                <PlainTextField id="standard-basic" label="" variant="standard" value={userIdentifier} onChange={onUserIdentifierChange} onKeyDown={onKeyDown} onBlur={onUserIdentifierConfirm} />
              </div>
            )}
            <p>
              UID: <strong>{props.uid}</strong>
            </p>
            <p>
              SD type denotation: <strong>{props.sdTypeDenotation}</strong>
            </p>
            {!props.confirmedByUser && <Button onClick={() => props.confirmSdInstance(props.id)}>Confirm this SD instance</Button>}
          </div>
        </>
      }
    />
  )
}

export default SDInstanceCard
