import { cn } from '@/lib/utils'
import { CheckIcon, XCircle, ChevronDown, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ButtonHTMLAttributes, forwardRef, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { InstanceWithKPIs } from '@/context/stores/kpiStore'

interface InstanceMultiSelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'defaultValue' | 'value'> {
  options: InstanceWithKPIs[]
  value: number[]
  onValueChange: (value: number[]) => void
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
  disabled?: boolean
}

type InstanceGroup = {
  typeID: number
  typeLabel: string
  typeIcon: string
  instances: InstanceWithKPIs[]
}

export const InstanceMultiSelect = forwardRef<HTMLButtonElement, InstanceMultiSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      maxCount = 10,
      modalPopover = false,
      asChild = false,
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [instanceGroups, setInstanceGroups] = useState<InstanceGroup[]>([])

    useEffect(() => {
      if (!options || options.length === 0) {
        setInstanceGroups([])
        return
      }

      // Key for groups that do not have a label set
      const OTHERS_GROUP_KEY = -1
      const groups: { [key: number]: InstanceGroup } = {}

      // Sort the instances
      const sortedInstances = [...options].sort((a, b) => a.userIdentifier.localeCompare(b.userIdentifier))

      // Group instances by type.id
      sortedInstances.forEach((instance) => {
        const typeID = instance.type?.label ? instance.type?.id || OTHERS_GROUP_KEY : OTHERS_GROUP_KEY
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
    }, [options])

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setIsPopoverOpen(true)
      } else if (event.key === 'Backspace' && !event.currentTarget.value) {
        const newValue = [...value]
        newValue.pop()
        onValueChange(newValue)
      }
    }

    const toggleOption = (optionId: number) => {
      if (value.includes(optionId)) {
        onValueChange(value.filter((id) => id !== optionId))
      } else {
        onValueChange([...value, optionId])
      }
    }

    const handleClear = () => {
      onValueChange([])
    }

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev)
    }

    const toggleAll = () => {
      if (value.length === options.length) {
        handleClear()
      } else {
        onValueChange(options.map((opt) => opt.id))
      }
    }

    // Get the selected instances for badge display
    const selectedInstances = useMemo(() => {
      return options.filter(instance => value.includes(instance.id))
        .sort((a, b) => a.userIdentifier.localeCompare(b.userIdentifier));
    }, [options, value]);

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              'flex h-auto min-h-10 w-full items-center justify-between rounded-md border bg-inherit p-1 hover:bg-inherit [&_svg]:pointer-events-auto',
              className
            )}
            disabled={disabled}
          >
            {value.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-wrap items-center">
                  {selectedInstances.slice(0, maxCount).map((instance) => (
                    <Badge key={instance.id} className="m-1 border-foreground/10 bg-card text-foreground hover:bg-card/80">
                      {instance.userIdentifier}
                      <XCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation()
                          onValueChange(value.filter((i) => i !== instance.id))
                        }}
                      />
                    </Badge>
                  ))}
                  {value.length > maxCount && (
                    <Badge className="m-1 border-foreground/10 bg-transparent text-foreground hover:bg-transparent">
                      {`+ ${value.length - maxCount} more`}
                      <XCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation()
                          const newValue = value.slice(0, maxCount)
                          onValueChange(newValue)
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <XIcon
                    className="mx-2 h-4 cursor-pointer text-muted-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      onValueChange([])
                    }}
                  />
                  <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="mx-3 text-sm text-muted-foreground">Select devices...</span>
                <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            <CommandInput placeholder="Search..." onKeyDown={handleInputKeyDown} />
            <CommandList>
              <ScrollArea>
                <div className="h-fit max-h-[150px] sm:max-h-[300px]">
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm',
                          value.length === options.length
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>(Select All)</span>
                    </CommandItem>
                  </CommandGroup>
                  
                  {/* Grouped Instances */}
                  {instanceGroups.map((group) => (
                    <CommandGroup key={group.typeID} heading={group.typeLabel}>
                      {group.instances.map((instance) => {
                        const isSelected = value.includes(instance.id);
                        return (
                          <CommandItem
                            key={instance.id}
                            onSelect={() => toggleOption(instance.id)}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm',
                                isSelected ? 'text-primary' : 'opacity-50 [&_svg]:invisible'
                              )}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </div>
                            <span>{instance.userIdentifier}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                  
                  <CommandGroup>
                    <div className="flex items-center justify-between">
                      {value.length > 0 && (
                        <>
                          <CommandItem onSelect={handleClear} className="flex-1 cursor-pointer justify-center">
                            Clear
                          </CommandItem>
                        </>
                      )}
                    </div>
                  </CommandGroup>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)