import React, { useState } from 'react'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { Button } from '@mui/material'
import { PlainTextField } from '../../../page-independent-components/mui-based/Styled'
import { AsynchronousBiConsumerFunction, AsynchronousConsumerFunction } from '../../../util'

interface SDInstanceCardProps {
  id: string
  userIdentifier: string
  uid: string
  sdTypeDenotation: string
  confirmedByUser: boolean
  updateUserIdentifierOfSdInstance: AsynchronousBiConsumerFunction<string, string>
  confirmSdInstance: AsynchronousConsumerFunction<string>
}

const SDInstanceCard: React.FC<SDInstanceCardProps> = (props) => {
  const [userIdentifier, setUserIdentifier] = useState<string>(props.userIdentifier)
  return (
    <GenericCardTemplate
      headerContent={<></>}
      bodyContent={
        <>
          <div className="flex flex-col gap-1 text-[18px]">
            {props.confirmedByUser && (
              <div className="flex items-baseline gap-1">
                <p className="mb-1 mt-1">User identifier:</p>
                <PlainTextField
                  id="standard-basic"
                  label=""
                  variant="standard"
                  value={userIdentifier}
                  onChange={(e) => setUserIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  onBlur={async () => {
                    if (userIdentifier === '') {
                      setUserIdentifier(props.userIdentifier)
                      return
                    }
                    await props.updateUserIdentifierOfSdInstance(props.id, userIdentifier)
                  }}
                />
              </div>
            )}
            <p className="mb-1 mt-1">
              UID: <strong className="font-bold">{props.uid}</strong>
            </p>
            <p className="mb-1 mt-1">
              SD type denotation: <strong className="font-bold">{props.sdTypeDenotation}</strong>
            </p>
            {!props.confirmedByUser && <Button onClick={() => props.confirmSdInstance(props.id)}>Confirm this SD instance</Button>}
          </div>
        </>
      }
    />
  )
}

export default SDInstanceCard
