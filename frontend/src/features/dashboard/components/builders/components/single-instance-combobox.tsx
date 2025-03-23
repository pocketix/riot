import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SdInstance } from '@/generated/graphql'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SingleInstanceComboboxProps {
  instances: SdInstance[]
  onValueChange: (value: SdInstance) => void
  value?: string | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

type InstanceGroup = {
  typeID: number
  typeLabel: string
  typeIcon: string
  instances: SdInstance[]
}

export function SingleInstanceCombobox({
  instances,
  onValueChange,
  value,
  placeholder = 'Select instance...',
  disabled = false,
  className
}: SingleInstanceComboboxProps) {
  const [open, setOpen] = useState(false)
  const [instanceGroups, setInstanceGroups] = useState<InstanceGroup[]>([])

  useEffect(() => {
    if (!instances || instances.length === 0) {
      setInstanceGroups([])
      return
    }

    const groups: { [key: string]: InstanceGroup } = {}

    // Sort the instances
    const sortedInstances = [...instances].sort((a, b) => a.userIdentifier.localeCompare(b.userIdentifier))

    // Group instances by type.id
    sortedInstances.forEach((instance) => {
      const typeID = instance.type?.id || -1
      const typeLabel = instance.type?.label || 'Other'
      const typeIcon = instance.type?.icon || ''

      if (!groups[typeID]) {
        groups[typeID] = {
          typeID,
          typeLabel,
          typeIcon,
          instances: []
        }
      }

      groups[typeID].instances.push(instance)
    })

    // sort the group names
    const sortedGroups = Object.values(groups).sort((a, b) => a.typeLabel.localeCompare(b.typeLabel))

    setInstanceGroups(sortedGroups)
  }, [instances])

  const selectedInstance = value ? instances.find((instance) => instance.uid === value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          {selectedInstance ? selectedInstance.userIdentifier : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search instances..." />
          <CommandList>
            <ScrollArea className="h-[200px]">
              <CommandEmpty>No instance found.</CommandEmpty>
              {instanceGroups.map((group) => (
                <CommandGroup key={group.typeID} heading={group.typeLabel}>
                  {group.instances.map((instance) => (
                    <CommandItem
                      key={instance.uid}
                      value={instance.userIdentifier}
                      onSelect={() => {
                        if (value === instance.uid) {
                          setOpen(false)
                        }
                        onValueChange(instance)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn(value === instance.uid ? 'opacity-100' : 'opacity-0')} />
                      {instance.userIdentifier}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
