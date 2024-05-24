import { AsynchronousBiConsumerFunction, AsynchronousTriConsumerFunction } from '../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import ModalBase from '../../../page-independent-components/mui-based/ModalBase'
import { Button, FormControl, Grid } from '@mui/material'
import React, { useMemo, useRef, useState } from 'react'
import ChipBasedMultiSelect from '../../../page-independent-components/mui-based/ChipBasedMultiSelect'
import MUIBasedTextField from '../../../page-independent-components/mui-based/MUIBasedTextField'

export enum SDInstanceGroupModalMode {
  create,
  update
}

interface SDInstanceGroupModalProps {
  mode: SDInstanceGroupModalMode
  sdInstanceData: {
    id: string
    userIdentifier: string
  }[]
  createSDInstanceGroup: AsynchronousBiConsumerFunction<string, string[]>
  updateSDInstanceGroup: AsynchronousTriConsumerFunction<string, string, string[]>
  sdInstanceGroupID?: string
  userIdentifier?: string
  selectedSDInstanceIDs?: string[]
}

export default NiceModal.create<SDInstanceGroupModalProps>((props) => {
  const { visible, remove } = useModal()
  const [userIdentifier, setUserIdentifier] = useState<string>(props.userIdentifier ?? 'Set a sensible user identifier for this SD instance group...')
  const [selectedSDInstanceIDs, setSelectedSDInstanceIDs] = useState<string[]>(props.selectedSDInstanceIDs ?? [])
  const canConfirm = useMemo(() => {
    return userIdentifier !== '' && selectedSDInstanceIDs.length > 0
  }, [userIdentifier, selectedSDInstanceIDs])
  const interactionWithSDInstanceMultiSelectDetectedRef = useRef<boolean>(false)
  const sdInstanceMultiSelectFieldErrorFlag = useMemo(() => {
    return interactionWithSDInstanceMultiSelectDetectedRef.current && selectedSDInstanceIDs.length === 0
  }, [selectedSDInstanceIDs])

  return (
    <ModalBase isOpen={visible} onClose={remove} modalTitle={`${props.mode === SDInstanceGroupModalMode.create ? 'Create' : 'Update'} SD instance group`}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <FormControl fullWidth>
            <MUIBasedTextField label="User identifier of the SD instance group" content={userIdentifier} onContentChange={setUserIdentifier} />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <ChipBasedMultiSelect
              title="SD instances"
              error={sdInstanceMultiSelectFieldErrorFlag}
              allSelectionSubjects={props.sdInstanceData.map(({ id, userIdentifier }) => {
                return {
                  id: id,
                  name: userIdentifier
                }
              })}
              selectedSelectionSubjects={props.sdInstanceData
                .filter(({ id }) => selectedSDInstanceIDs.indexOf(id) !== -1)
                .map(({ id, userIdentifier }) => {
                  return {
                    id: id,
                    name: userIdentifier
                  }
                })}
              onChange={setSelectedSDInstanceIDs}
              interactionDetectedRef={interactionWithSDInstanceMultiSelectDetectedRef}
            />
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            disabled={!canConfirm}
            onClick={() => {
              if (props.mode === SDInstanceGroupModalMode.create) {
                props.createSDInstanceGroup && props.createSDInstanceGroup(userIdentifier, selectedSDInstanceIDs)
              } else {
                props.updateSDInstanceGroup && props.sdInstanceGroupID && props.updateSDInstanceGroup(props.sdInstanceGroupID, userIdentifier, selectedSDInstanceIDs)
              }
            }}
          >
            Confirm
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
