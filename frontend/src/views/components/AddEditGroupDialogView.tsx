import { ReactNode, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerDescription,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InstanceMultiSelect } from './multi-select-instance'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'
import { zodResolver } from '@hookform/resolvers/zod'
import { GroupSchema, groupSchema } from '@/schemas/GroupSchema'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { DeleteAlertDialog } from '@/features/dashboard/components/cards/components/DeleteAlertDialog'

interface AddEditGroupDialogViewProps {
  open: boolean
  isLoading?: boolean
  instances: InstanceWithKPIs[]
  initial?: { userIdentifier?: string; sdInstanceIDs?: number[] }
  children?: ReactNode
  setOpen: (open: boolean) => void
  onSubmit: (values: any) => void
  onDelete: () => void
}

export const AddEditGroupDialogView = (props: AddEditGroupDialogViewProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const form = useForm<GroupSchema>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      userIdentifier: props.initial?.userIdentifier || '',
      sdInstanceIDs: props.initial?.sdInstanceIDs || []
    }
  })

  useEffect(() => {
    if (props.open) {
      form.reset({
        userIdentifier: props.initial?.userIdentifier || '',
        sdInstanceIDs: props.initial?.sdInstanceIDs || []
      })
    }
  }, [props.open, props.initial])

  const groupInfo = useMemo(() => {
    const selectedInstances = props.instances.filter((instance) =>
      form.getValues('sdInstanceIDs').includes(instance.id)
    )

    if (selectedInstances.length === 0) return null

    const totalKPIs = selectedInstances.reduce((acc, instance) => acc + instance.kpis.length, 0)
    const fulfilledKPIs = selectedInstances.reduce((acc, instance) => acc + instance.kpiStats.fulfilled, 0)
    const notFulfilledKPIs = selectedInstances.reduce((acc, instance) => acc + instance.kpiStats.notFulfilled, 0)

    return (
      <Card className="mt-2 rounded-md px-4 py-2 shadow-sm">
        <h3 className="font-medium">Group Overview</h3>
        <Separator className="my-2" />
        <div className="grid grid-cols-1 gap-2 px-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:flex-col">
            <span className="text-muted-foreground">Devices selected:</span>
            <span className="text-lg font-medium">{selectedInstances.length}</span>
          </div>
          <div className="flex justify-between sm:flex-col">
            <span className="text-muted-foreground">Total KPIs:</span>
            <span className="text-lg font-medium">{totalKPIs}</span>
          </div>
          <div className="flex justify-between sm:flex-col">
            <span className="text-muted-foreground">Fulfilled KPIs:</span>
            <span className="text-lg font-medium text-green-600">{fulfilledKPIs}</span>
          </div>
          <div className="flex justify-between sm:flex-col">
            <span className="text-muted-foreground">Not Fulfilled KPIs:</span>
            <span className="text-lg font-medium text-red-600">{notFulfilledKPIs}</span>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="flex flex-wrap justify-center gap-1">
          {selectedInstances.map((instance) => (
            <Badge key={instance.id} variant="secondary" className="whitespace-nowrap rounded-md text-xs font-medium">
              {instance.userIdentifier}
              {' - '}
              <span className="ml-1 text-muted-foreground">
                {instance.kpiStats.fulfilled}/{instance.kpis.length}
                {' KPIs'}
              </span>
            </Badge>
          ))}
        </div>
      </Card>
    )
  }, [form.watch('sdInstanceIDs'), props.instances])

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(props.onSubmit)} className="mt-4 space-y-4">
        <FormField
          control={form.control}
          name="userIdentifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter group name" disabled={props.isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sdInstanceIDs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Devices</FormLabel>
              <FormControl>
                <InstanceMultiSelect
                  options={props.instances}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={props.isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  return isDesktop ? (
    <Dialog open={props.open} onOpenChange={props.setOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.initial ? 'Edit Group' : 'Create Group'}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {props.initial ? 'Edit group details and devices.' : 'Enter a group name and select devices.'}
        </DialogDescription>
        {groupInfo}
        {formContent}
        <DialogFooter className="flex w-full justify-between sm:justify-between">
          {props.initial && (
            <DeleteAlertDialog onSuccess={props.onDelete}>
              <Button variant="destructive" type="button" disabled={props.isLoading}>
                Delete Group
              </Button>
            </DeleteAlertDialog>
          )}
          <div className="ml-auto flex">
            <Button type="button" variant="ghost" onClick={() => props.setOpen(false)} disabled={props.isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={props.isLoading} onClick={() => props.onSubmit(form.getValues())}>
              {props.initial ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={props.open} onOpenChange={props.setOpen}>
      <DrawerTrigger asChild>{props.children}</DrawerTrigger>
      <DrawerContent className="px-4">
        <ScrollArea>
          <div className="h-fit max-h-[calc(95vh-2rem)] sm:p-4">
            <DrawerHeader className="px-0">
              <DrawerTitle>{props.initial ? 'Edit Group' : 'Create Group'}</DrawerTitle>
              <DrawerDescription>
                {props.initial ? 'Edit group details and devices.' : 'Enter a group name and select devices.'}
              </DrawerDescription>
            </DrawerHeader>
            {groupInfo}
            {formContent}
            <DrawerFooter className="pt-4">
              {props.initial && (
                <DeleteAlertDialog onSuccess={props.onDelete}>
                  <Button variant="destructive" type="button" disabled={props.isLoading}>
                    Delete Group
                  </Button>
                </DeleteAlertDialog>
              )}
              <DrawerClose asChild>
                <Button type="button" variant="ghost" className="w-full" disabled={props.isLoading}>
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="w-full"
                disabled={props.isLoading}
                onClick={() => props.onSubmit(form.getValues())}
              >
                {props.initial ? 'Save Changes' : 'Create Group'}
              </Button>
            </DrawerFooter>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
