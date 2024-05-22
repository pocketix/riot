import React, { MutableRefObject } from 'react'
import { Box, Checkbox, Chip, InputLabel, ListItemText, MenuItem, OutlinedInput, Select } from '@mui/material'
import { ConsumerFunction } from '../../util'

interface SelectionSubject {
  id: string
  name: string
}

interface ChipBasedMultiSelectProps {
  title: string
  allSelectionSubjects: SelectionSubject[]
  selectedSelectionSubjects: SelectionSubject[]
  onChange: ConsumerFunction<string[]>
  error?: boolean
  interactionDetectedRef?: MutableRefObject<boolean>
}

const ChipBasedMultiSelect: React.FC<ChipBasedMultiSelectProps> = (props) => {
  return (
    <>
      <InputLabel error={props?.error ?? false} id="chip-based-multi-select">
        {props.title}
      </InputLabel>
      <Select
        labelId="chip-based-multi-select"
        multiple
        value={props.selectedSelectionSubjects.map(({ id }) => id)}
        onChange={(e) => {
          const newValue = e.target.value
          props.onChange(typeof newValue === 'string' ? newValue.split(',') : newValue)
          if (props.interactionDetectedRef) {
            props.interactionDetectedRef.current = true
          }
        }}
        error={props?.error ?? false}
        input={<OutlinedInput label={props.title} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {selected.map((id) => (
              <Chip key={id} label={props.selectedSelectionSubjects.find((selectedSelectionSubject) => selectedSelectionSubject.id === id)?.name ?? '---'} />
            ))}
          </Box>
        )}
      >
        {props.allSelectionSubjects.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            <Checkbox checked={props.selectedSelectionSubjects.some((selectedSelectionSubject) => selectedSelectionSubject.id === id)} />
            <ListItemText primary={name} />
          </MenuItem>
        ))}
      </Select>
    </>
  )
}

export default ChipBasedMultiSelect
