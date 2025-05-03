import { FormControl, Grid } from '@mui/material'
import { LogicalOperationNodeType } from '../editable-tree/EditableTree'
import ModalBase from '../../../../page-independent-components/mui-based/ModalBase'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import StandardSingleSelect from '../../../../page-independent-components/mui-based/StandardSingleSelect'
import { ConsumerFunction } from '../util'

interface SelectLogicalOperationTypeModalProps {
  onLogicalOperationTypeSelection: ConsumerFunction<LogicalOperationNodeType>
}

export default NiceModal.create<SelectLogicalOperationTypeModalProps>((props) => {
  const { visible, remove } = useModal()
  return (
    <ModalBase isOpen={visible} onClose={remove} modalTitle="Select logical operation type">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={8.8}>
          <FormControl fullWidth>
            <StandardSingleSelect
              title="Logical operation type"
              allSelectionSubjects={[
                {
                  id: LogicalOperationNodeType.AND,
                  name: LogicalOperationNodeType.AND
                },
                {
                  id: LogicalOperationNodeType.OR,
                  name: LogicalOperationNodeType.OR
                },
                {
                  id: LogicalOperationNodeType.NOR,
                  name: LogicalOperationNodeType.NOR
                }
              ]}
              selectedSelectionSubjectID=""
              onChange={(selectedSelectionSubjectID) => {
                props.onLogicalOperationTypeSelection(selectedSelectionSubjectID as LogicalOperationNodeType)
                remove()
              }}
            />
          </FormControl>
        </Grid>
      </Grid>
    </ModalBase>
  )
})
