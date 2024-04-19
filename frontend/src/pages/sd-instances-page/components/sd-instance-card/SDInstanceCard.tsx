import React, { ChangeEvent, KeyboardEvent, useCallback, useState } from 'react'
import GenericCardTemplate from '../../../../page-independent-components/generic-card-template/GenericCardTemplate'
import { Button } from '@mui/material'
import styles from './styles.module.scss'
import PlainTextField from '../../../../page-independent-components/plain-text-field/PlainTextField'

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
