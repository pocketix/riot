import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger
} from '@/components/ui/drawer'
import { TbTrash } from 'react-icons/tb'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect, ReactNode } from 'react'
import { useMediaQuery } from '@uidotdev/usehooks'

export interface ResponsiveAlertDialogProps {
  onSuccess: () => void
  children?: ReactNode
  content?: ReactNode
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function ResponsiveAlertDialog(props: ResponsiveAlertDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = props.externalOpen !== undefined ? props.externalOpen : internalOpen
  const setOpen = props.onExternalOpenChange ?? setInternalOpen
  const dialogRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const handleClickOutside = (event: MouseEvent) => {
    if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (open && isDesktop) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, isDesktop])

  const handleDelete = () => {
    props.onSuccess()
    setOpen(false)
  }

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          {props.children ? (
            props.children
          ) : (
            <span>
              <TbTrash className="cursor-pointer text-destructive" />
            </span>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent ref={dialogRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          {props.content && <div className="mb-4">{props.content}</div>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              Confirm
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {props.children ? (
          props.children
        ) : (
          <span>
            <TbTrash className="cursor-pointer text-destructive" />
          </span>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button variant="destructive" onClick={handleDelete}>
              Confirm
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
