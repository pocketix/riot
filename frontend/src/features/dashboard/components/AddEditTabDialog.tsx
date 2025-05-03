import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AddTabFormSchema, AddTabFormSchemaType } from '@/schemas/dashboard/AddTabSchema'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useMediaQuery } from '@uidotdev/usehooks'
import { getIcon } from '@/utils/getIcon'
import { Button } from '@/components/ui/button'
import { LucidePlus, Pencil } from 'lucide-react'
import IconPicker from '@/ui/IconPicker'
import { Tab } from '@/schemas/dashboard/DashboardSchema'

interface AddEditTabDialogProps {
  onAddTab?: (values: AddTabFormSchemaType) => void
  onEditTab?: (tabId: number, values: AddTabFormSchemaType) => void
  disabled?: boolean
  initialTab?: Tab
}

export function AddEditTabDialog(props: AddEditTabDialogProps) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const form = useForm<AddTabFormSchemaType>({
    resolver: zodResolver(AddTabFormSchema),
    defaultValues: {
      userIdentifier: props.initialTab?.userIdentifier || '',
      icon: props.initialTab?.icon || ''
    }
  })

  useEffect(() => {
    if (open) {
      form.reset({
        userIdentifier: props.initialTab?.userIdentifier || '',
        icon: props.initialTab?.icon || ''
      })
    }
  }, [open, props.initialTab])

  const IconComponent = getIcon(form.watch('icon')!)

  function onSubmit(values: AddTabFormSchemaType) {
    if (props.initialTab && props.onEditTab) {
      props.onEditTab(props.initialTab.id, values)
    }
    if (props.onAddTab) {
      props.onAddTab(values)
    }
    setOpen(false)
    form.reset()
  }

  const TabPreview = () => {
    return (
      <div className="my-2 flex h-8 items-center gap-2">
        <p className="text-muted-foreground">Preview:</p>
        <div className="flex h-9 items-center gap-1 rounded-md border border-border px-2 py-2 pl-2">
          {form.watch('icon') && (
            <span className="text-muted-foreground">{IconComponent ? <IconComponent /> : null}</span>
          )}
          <span className="truncate text-sm">{form.watch('userIdentifier')}</span>
        </div>
      </div>
    )
  }

  const FormContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-center justify-center space-y-2">
        <div className="flex w-full gap-2">
          <FormField
            control={form.control}
            name="userIdentifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tab Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Dashboard" {...field} className="w-full truncate" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <FormControl>
                  <IconPicker icon={field.value || ''} setIcon={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex w-full justify-end pt-2">
          <Button type="submit" className="w-full">
            {props.initialTab ? 'Update Tab' : 'Create Tab'}
          </Button>
        </div>
      </form>
    </Form>
  )

  const TriggerButton = props.initialTab ? (
    <span className="ml-2 flex h-4 items-center justify-center" onClick={() => setOpen(true)}>
      <Pencil className="h-4 w-4" />
    </span>
  ) : (
    <Button className="ml-2 flex w-fit items-center break-keep px-2" onClick={() => setOpen(true)}>
      <LucidePlus className="mr-1 h-4 w-4" />
      Add Tab
    </Button>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {TriggerButton}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{props.initialTab ? 'Edit Tab' : 'Create New Tab'}</DialogTitle>
            <DialogDescription>
              {props.initialTab
                ? 'Update the name and icon of this dashboard tab'
                : 'Create a new dashboard tab to organize your visualizations'}
            </DialogDescription>
          </DialogHeader>
          <TabPreview />
          {FormContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {TriggerButton}
      <DrawerContent className="px-4">
        <DrawerHeader className="px-0">
          <DrawerTitle>{props.initialTab ? 'Edit Tab' : 'Create New Tab'}</DrawerTitle>
          <DrawerDescription>
            {props.initialTab
              ? 'Update the name and icon of this dashboard tab'
              : 'Create a new dashboard tab to organize your visualizations'}
          </DrawerDescription>
        </DrawerHeader>
        <TabPreview />
        {FormContent}
        <DrawerFooter className="px-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full px-0">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
