import { AsynchronousBiConsumerFunction } from '../../../util'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import ModalBase from '../../../page-independent-components/mui-based/ModalBase'
import { Box, Button, Checkbox, Chip, FormControl, Grid, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, TextField } from '@mui/material'
import React, { useMemo, useRef, useState } from 'react'

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
  onConfirm: AsynchronousBiConsumerFunction<string, string[]>
}

export default NiceModal.create<SDInstanceGroupModalProps>((props) => {
  const { visible, hide } = useModal()
  const [userIdentifier, setUserIdentifier] = useState<string>('Set a sensible user identifier for this SD instance group...')
  const [selectedSDInstanceIDs, setSelectedSDInstanceIDs] = useState<string[]>([])
  const sdInstanceUserIdentifierByIDMap: { [key: string]: string } = useMemo(() => {
    if (!props.sdInstanceData) {
      return {}
    }
    return props.sdInstanceData.reduce(
      (map, { id, userIdentifier }) => ({
        ...map,
        [id]: userIdentifier
      }),
      {}
    )
  }, [props.sdInstanceData])
  const canConfirm = useMemo(() => {
    return userIdentifier !== '' && selectedSDInstanceIDs.length > 0
  }, [userIdentifier, selectedSDInstanceIDs])
  const interactionWithSDInstanceMultiSelectDetectedRef = useRef<boolean>(false)
  const sdInstanceMultiSelectFieldErrorFlag = useMemo(() => {
    return interactionWithSDInstanceMultiSelectDetectedRef.current && selectedSDInstanceIDs.length === 0
  }, [selectedSDInstanceIDs])

  const reset = () => {
    setUserIdentifier('Set a sensible user identifier for this SD instance group...')
    setSelectedSDInstanceIDs([])
    interactionWithSDInstanceMultiSelectDetectedRef.current = false
  }

  return (
    <ModalBase
      isOpen={visible}
      onClose={() => {
        reset()
        hide()
      }}
      modalTitle={`${props.mode === SDInstanceGroupModalMode.create ? 'Create' : 'Update'} SD instance group`}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="standard-basic"
            label="User identifier of the SD instance group"
            variant="outlined"
            value={userIdentifier}
            error={userIdentifier.length === 0}
            onChange={(e) => setUserIdentifier(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel error={sdInstanceMultiSelectFieldErrorFlag} id="multiple-sd-instance-select-label">
              SD Instances
            </InputLabel>
            <Select
              labelId="multiple-sd-instance-select-label"
              multiple
              value={selectedSDInstanceIDs}
              onChange={(e) => {
                const newValue = e.target.value
                setSelectedSDInstanceIDs(typeof newValue === 'string' ? newValue.split(',') : newValue)
                interactionWithSDInstanceMultiSelectDetectedRef.current = true
              }}
              error={sdInstanceMultiSelectFieldErrorFlag}
              input={<OutlinedInput label="SD Instances" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {selected.map((sdInstanceID) => (
                    <Chip key={sdInstanceID} label={sdInstanceUserIdentifierByIDMap[sdInstanceID] ?? '---'} />
                  ))}
                </Box>
              )}
            >
              {props.sdInstanceData.map(({ id, userIdentifier }) => (
                <MenuItem key={id} value={id}>
                  <Checkbox checked={selectedSDInstanceIDs.indexOf(id) !== -1} />
                  <ListItemText primary={userIdentifier} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            disabled={!canConfirm}
            onClick={() => {
              props.onConfirm(userIdentifier, selectedSDInstanceIDs)
              reset()
            }}
          >
            Confirm
          </Button>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
