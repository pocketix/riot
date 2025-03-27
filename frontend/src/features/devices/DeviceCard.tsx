import styled from 'styled-components'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from '@apollo/client'
import {
  UpdateUserIdentifierOfSdInstanceMutation,
  UpdateUserIdentifierOfSdInstanceMutationVariables
} from '@/generated/graphql'
import { UPDATE_USER_IDENTIFIER_OF_SD_INSTANCE } from '@/graphql/Mutations'
import { getIcon } from '@/utils/getIcon'

const Card = styled.div`
  background: var(--color-grey-0);
  color: var(--color-white);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0px 2px 6px var(--color-grey-200);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
`

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
  justify-content: space-between;
  min-height: 90px;
`

const UserIdentifier = styled.h3`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-grey-900);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 1.5rem;
`

const Denotation = styled.span`
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--color-grey-500);
`

const BottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`

const Icon = styled.div`
  width: 40px;
  height: 40px;
  aspect-ratio: 1/1;
  background: var(--color-grey-200);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`

type SdInstanceCardProps = {
  instance: {
    id: number
    uid: string
    userIdentifier?: string | null
    type: {
      denotation: string
      icon?: string | null
    }
  }
  confirmed: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  onUserIdentifierChange?: (newId: string) => void
  onConfirmClick?: () => void
}

export default function DeviceCard({
  instance,
  confirmed,
  selected = false,
  onSelectChange,
  onConfirmClick
}: SdInstanceCardProps) {
  const [editMode, setEditMode] = useState(false)
  const [newUserIdentifier, setNewUserIdentifier] = useState(instance.userIdentifier || '')

  const [updateUserIdentifierOfSdInstanceMutation, { loading: updatingIdentifier }] = useMutation<
    UpdateUserIdentifierOfSdInstanceMutation,
    UpdateUserIdentifierOfSdInstanceMutationVariables
  >(UPDATE_USER_IDENTIFIER_OF_SD_INSTANCE)

  const IconComponent = getIcon(instance.type.icon || 'TbQuestionMark')

  const hasSlashes = instance.uid.includes('/')
  const uidParts = hasSlashes ? instance.uid.split('/') : []
  const [showUid, setShowUid] = useState(false)

  const handleSave = async () => {
    try {
      await updateUserIdentifierOfSdInstanceMutation({
        variables: {
          id: instance.id,
          newUserIdentifier: newUserIdentifier
        }
      })
      toast.success('User identifier updated')
    } catch (err) {
      toast.error('Failed to update user identifier')
      console.error(err)
    } finally {
      setEditMode(false)
    }
  }

  return (
    <Card>
      <Header>
        <TitleWrapper>
          {editMode ? (
            <div className="flex gap-2">
              <Input
                value={newUserIdentifier}
                onChange={(e) => setNewUserIdentifier(e.target.value)}
                className="w-full"
              />
              <Button variant="secondary" onClick={handleSave} disabled={updatingIdentifier}>
                {updatingIdentifier ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ) : (
            <>
              <UserIdentifier>
                <Icon>{IconComponent && <IconComponent />}</Icon>
                {instance.userIdentifier || '-'}
                <Button variant="ghost" size="icon" onClick={() => setEditMode(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </UserIdentifier>
              <Denotation>{instance.type.denotation}</Denotation>
            </>
          )}
        </TitleWrapper>

        {!confirmed && onSelectChange && (
          <Checkbox checked={selected} onCheckedChange={(v) => onSelectChange(Boolean(v))} />
        )}
      </Header>

      <div>
        <strong>UID:</strong>{' '}
        {hasSlashes ? (
          <div className="ml-2 flex flex-col text-sm text-white">
            {(showUid ? uidParts : uidParts.slice(2, 3)).map((part, index) => (
              <span key={index}>{part}</span>
            ))}
            {uidParts.length > 1 && (
              <Button variant="link" className="w-fit px-1 text-xs" onClick={() => setShowUid(!showUid)}>
                {showUid ? 'Hide' : 'Show full UID'}
              </Button>
            )}
          </div>
        ) : (
          <div className="ml-2 flex flex-col text-sm text-white">
            <span
              className={`break-words ${showUid ? '' : 'max-w-[200px] cursor-pointer truncate'}`}
              onClick={() => setShowUid(!showUid)}
              title={instance.uid}
            >
              {showUid ? instance.uid : instance.uid.slice(0, 20) + (instance.uid.length > 20 ? '...' : '')}
            </span>
            {instance.uid.length > 20 && (
              <Button variant="ghost" className="w-fit px-1 text-xs" onClick={() => setShowUid(!showUid)}>
                {showUid ? 'Hide' : 'Show'}
              </Button>
            )}
          </div>
        )}
      </div>
      <BottomRow>
        <Button onClick={() => console.log('Add navigate')}>View Details</Button>
        {!confirmed && onConfirmClick && (
          <Button onClick={onConfirmClick} variant="green">
            Confirm
          </Button>
        )}
      </BottomRow>
    </Card>
  )
}
