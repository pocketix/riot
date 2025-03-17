import React, { useMemo } from 'react'
import { InputLabel, ListItemText, MenuItem } from '@mui/material'
import { Select } from '@mui/material'
import { SxProps } from '@mui/system'
import { Theme } from '@mui/material/styles'
import { ConsumerFunction, generateNewUUID, SelectionSubject } from '@/features/settings/KPIDefinitions/components/util'

interface StandardSingleSelectProps {
  title: string
  allSelectionSubjects: SelectionSubject[]
  selectedSelectionSubjectID: string
  onChange: ConsumerFunction<string>
  error?: boolean
  sx?: SxProps<Theme>
}

const StandardSingleSelect: React.FC<StandardSingleSelectProps> = (props) => {
  const labelID = useMemo(() => `mui-based-select-label-${generateNewUUID()}`, [])
  return (
    <>
      <InputLabel id={labelID} error={props?.error ?? false}>
        {props.title}
      </InputLabel>
      <Select
        labelId={labelID}
        error={props?.error ?? false}
        value={props.selectedSelectionSubjectID}
        label={props.title}
        onChange={(e) => props.onChange(e.target.value)}
        sx={props.sx ? props.sx : {}}
      >
        {props.allSelectionSubjects.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            <ListItemText primary={name} />
          </MenuItem>
        ))}
      </Select>
    </>
  )
}

export default StandardSingleSelect
