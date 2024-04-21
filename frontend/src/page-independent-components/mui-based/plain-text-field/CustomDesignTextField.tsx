import { styled } from '@mui/material/styles'
import { TextField } from '@mui/material'

const CustomDesignTextField = styled(TextField)({
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

export default CustomDesignTextField
