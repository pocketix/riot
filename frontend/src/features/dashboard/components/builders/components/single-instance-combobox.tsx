import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SdInstancesWithParamsQuery } from '@/generated/graphql'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useInstances } from '@/context/InstancesContext'

interface SingleInstanceComboboxProps {
  onValueChange: (value: SdInstancesWithParamsQuery['sdInstances'][number]) => void
  value: number | null
  disabled?: boolean
  className?: string
}

type InstanceGroup = {
  typeID: number
  typeLabel: string
  typeIcon: string
  instances: SdInstancesWithParamsQuery['sdInstances']
}

export function SingleInstanceCombobox({
  onValueChange,
  value,
  disabled = false,
  className
}: SingleInstanceComboboxProps) {
  const [open, setOpen] = useState(false)
  const [instanceGroups, setInstanceGroups] = useState<InstanceGroup[]>([])
  const { getInstanceById, instances } = useInstances()

  useEffect(() => {
    if (!instances || instances.length === 0) {
      setInstanceGroups([])
      return
    }

    // Key for groups that do not have a label set
    const OTHERS_GROUP_KEY = -1
    const groups: { [key: number]: InstanceGroup } = {}

    // Sort the instances
    const sortedInstances = [...instances].sort((a, b) => a.userIdentifier.localeCompare(b.userIdentifier))

    // Group instances by type.id
    sortedInstances.forEach((instance) => {
      const typeID = instance.type?.label ? instance.type?.id || -1 : -1
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

    // Sort the groups, putting "Other" at the end
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.typeID === OTHERS_GROUP_KEY) return 1
      if (b.typeID === OTHERS_GROUP_KEY) return -1
      return a.typeLabel.localeCompare(b.typeLabel)
    })

    setInstanceGroups(sortedGroups)
  }, [instances])

  const selectedInstance = value ? getInstanceById(value) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex w-full items-center px-2 text-left font-semibold',
            !value && 'font-normal text-muted-foreground',
            className
          )}
        >
          <span className="flex-1 truncate">
            {selectedInstance ? selectedInstance.userIdentifier : 'Select instance...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search instances..." />
          <CommandList>
            <ScrollArea>
              <div className="h-fit max-h-[150px] sm:max-h-[300px]">
                <CommandEmpty>No instance found.</CommandEmpty>
                {instanceGroups.map((group) => (
                  <CommandGroup key={group.typeID} heading={group.typeLabel}>
                    {group.instances.map((instance) => (
                      <CommandItem
                        key={instance.id}
                        value={instance.userIdentifier}
                        onSelect={() => {
                          if (value === instance.id) {
                            setOpen(false)
                          }
                          onValueChange(instance)
                          setOpen(false)
                        }}
                      >
                        <Check className={cn(value === instance.id ? 'opacity-100' : 'opacity-0')} />
                        {instance.userIdentifier}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
