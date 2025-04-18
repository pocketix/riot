import { ReactNode, useState } from 'react'
import { useKpiContext } from '@/context/KPIContext'
import { AddEditGroupDialogView } from './AddEditGroupDialogView'
import {
  SdInstanceGroupsWithKpiDataDocument,
  useCreateSdInstanceGroupMutation,
  useDeleteSdInstanceGroupMutation,
  useUpdateSdInstanceGroupMutation
} from '@/generated/graphql'
import { GroupSchema } from '@/schemas/GroupSchema'
import { toast } from 'sonner'

interface AddEditGroupDialogControllerProps {
  initial?: { userIdentifier?: string; sdInstanceIDs?: number[]; groupID?: number }
  children?: ReactNode
}

export const AddEditGroupDialogController = (props: AddEditGroupDialogControllerProps) => {
  const [open, setOpen] = useState(false)
  const { instancesWithKPIs: instances, kpiLoading: loading } = useKpiContext()
  const [createGroup] = useCreateSdInstanceGroupMutation({
    onCompleted: () => {
      toast.success('Group created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create group: ${error.message}`)
    },
    refetchQueries: [{ query: SdInstanceGroupsWithKpiDataDocument }]
  })

  const [updateGroup] = useUpdateSdInstanceGroupMutation({
    onCompleted: () => {
      toast.success('Group updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update group: ${error.message}`)
    },
    refetchQueries: [{ query: SdInstanceGroupsWithKpiDataDocument }]
  })

  const [deleteGroup] = useDeleteSdInstanceGroupMutation({
    onCompleted: () => {
      toast.success('Group deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete group: ${error.message}`)
    },
    refetchQueries: [{ query: SdInstanceGroupsWithKpiDataDocument }]
  })

  const handleFormSubmit = (values: GroupSchema) => {
    if (props.initial) {
      updateGroup({
        variables: {
          updateSdInstanceGroupId: props.initial.groupID!,
          input: {
            userIdentifier: values.userIdentifier,
            sdInstanceIDs: values.sdInstanceIDs
          }
        }
      })
    } else {
      createGroup({
        variables: {
          input: {
            userIdentifier: values.userIdentifier,
            sdInstanceIDs: values.sdInstanceIDs
          }
        }
      })
    }
    setOpen(false)
  }

  const handleDeteleGroup = () => {
    if (!props.initial?.groupID) {
      console.error('Group ID is required for deletion')
      return
    }

    deleteGroup({
      variables: {
        deleteSdInstanceGroupId: props.initial.groupID
      }
    })

    setOpen(false)
  }

  return (
    <AddEditGroupDialogView
      open={open}
      setOpen={setOpen}
      isLoading={loading}
      instances={instances}
      onSubmit={handleFormSubmit}
      onDelete={handleDeteleGroup}
      initial={props.initial}
      children={props.children}
    />
  )
}
