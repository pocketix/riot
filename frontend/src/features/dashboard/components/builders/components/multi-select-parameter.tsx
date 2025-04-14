// Original Source: https://github.com/sersavan/shadcn-multi-select-component

import { cn } from '@/lib/utils'
import { CheckIcon, XCircle, ChevronDown, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ButtonHTMLAttributes, forwardRef, KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Parameter } from '@/context/InstancesContext'

export type SelectedParameters = {
  id: number
  denotation: string
}

interface ParameterMultiSelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'defaultValue' | 'value'> {
  options: Parameter[]
  value: SelectedParameters[]
  onValueChange: (value: SelectedParameters[]) => void
  defaultValue?: number[]
  maxCount?: number
  modalPopover?: boolean
  asChild?: boolean
  className?: string
  reset?: any
  onClose?: () => void
  disabled?: boolean
}

export const ParameterMultiSelect = forwardRef<HTMLButtonElement, ParameterMultiSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      defaultValue = [],
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      reset,
      onClose,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [tempValue, setTempValue] = useState<SelectedParameters[]>(value)

    const sortedOptions = useMemo(() => {
      return options.sort((a, b) => a.label!.localeCompare(b.label!))
    }, [options])

    const getWholeOptions = (selectedIDs: number[]): SelectedParameters[] => {
      const selectedParameters: SelectedParameters[] = []
      selectedIDs.forEach((id) => {
        const option = options.find((opt) => opt.id === id)
        if (option) {
          selectedParameters.push({ id: option.id, denotation: option.denotation })
        }
      })
      return selectedParameters
    }

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setIsPopoverOpen(true)
      } else if (event.key === 'Backspace' && !event.currentTarget.value) {
        const newValue = [...tempValue]
        newValue.pop()
        setTempValue(newValue)
      }
    }

    useEffect(() => {
      if (reset) {
        console.log('Ressetting the value')
        setTempValue([])
        onValueChange([])
      }
    }, [reset])

    // If the value passed from the form does not match the tempValue,
    // make it match. This happens when there is not user interaction with the popover.
    // And happens when config is loaded in the edit mode
    useEffect(() => {
      if (value && value.length > 0 && tempValue.length === 0) {
        setTempValue(value)
      }
    }, [value])

    const selectedIds = tempValue.map((item) => item.id)

    const toggleOption = (optionId: number) => {
      const option = options.find((opt) => opt.id === optionId)
      if (!option) return

      if (selectedIds.includes(optionId)) {
        setTempValue(tempValue.filter((item) => item.id !== optionId))
      } else {
        setTempValue([...tempValue, { id: option.id, denotation: option.denotation }])
      }
    }

    const handleClear = () => {
      setTempValue([])
    }

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev)
    }

    const toggleAll = () => {
      if (tempValue.length === options.length) {
        handleClear()
      } else {
        setTempValue(getWholeOptions(sortedOptions.map((opt) => opt.id)))
      }
    }

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open) => {
          setIsPopoverOpen(open)
          if (!open) {
            // call onValueChange when the popover closes,
            // so that we do not return value one by one
            onValueChange(tempValue)
            if (onClose) {
              onClose()
            }
          }
        }}
        modal={modalPopover}
      >
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
            {tempValue.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-wrap items-center">
                  {tempValue.slice(0, maxCount).map((item) => {
                    const option = options.find((o) => o.id === item.id)
                    return (
                      <Badge
                        key={item.id}
                        className="m-1 border-foreground/10 bg-card text-foreground hover:bg-card/80"
                      >
                        {option?.label || option?.denotation}
                        <XCircle
                          className="ml-2 h-4 w-4 cursor-pointer"
                          onClick={(event) => {
                            event.stopPropagation()
                            setTempValue(tempValue.filter((i) => i.id !== item.id))
                            onValueChange(tempValue.filter((i) => i.id !== item.id))
                          }}
                        />
                      </Badge>
                    )
                  })}
                  {tempValue.length > maxCount && (
                    <Badge className="m-1 border-foreground/10 bg-transparent text-foreground hover:bg-transparent">
                      {`+ ${tempValue.length - maxCount} more`}
                      <XCircle
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          // clear the extra items
                          event.stopPropagation()
                          const newValue = tempValue.slice(0, maxCount)
                          setTempValue(newValue)
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
                      // clear all items
                      event.stopPropagation()
                      setTempValue([])
                      onValueChange([])
                    }}
                  />
                  <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="mx-3 text-sm text-muted-foreground">Select parameters...</span>
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
                          tempValue.length === options.length
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>(Select All)</span>
                    </CommandItem>
                    {sortedOptions.map((option) => {
                      const isSelected = selectedIds.includes(option.id)
                      return (
                        <CommandItem
                          key={option.id}
                          onSelect={() => toggleOption(option.id)}
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
                          <span>{option.label || option.denotation}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  <CommandGroup>
                    <div className="flex items-center justify-between">
                      {tempValue.length > 0 && (
                        <>
                          <CommandItem onSelect={handleClear} className="flex-1 cursor-pointer justify-center">
                            Clear
                          </CommandItem>
                        </>
                      )}
                    </div>
                  </CommandGroup>
                </div>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

ParameterMultiSelect.displayName = 'ParameterMultiSelect'
