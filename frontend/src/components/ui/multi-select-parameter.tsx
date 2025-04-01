// Original Source: https://github.com/sersavan/shadcn-multi-select-component

import { cva, type VariantProps } from 'class-variance-authority'
import { CheckIcon, XCircle, ChevronDown, XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { ButtonHTMLAttributes, ComponentType, forwardRef, KeyboardEvent, useEffect, useState } from 'react'
import { ScrollArea } from './scroll-area'

const ParameterMultiSelectVariants = cva('m-1', {
  variants: {
    variant: {
      default: 'border-foreground/10 text-foreground bg-card hover:bg-card/80',
      secondary: 'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      inverted: 'inverted'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

type SelectedParameters = {
  id: number
  denotation: string
}

interface ParameterMultiSelectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'defaultValue' | 'value'>,
    VariantProps<typeof ParameterMultiSelectVariants> {
  options: {
    label: string
    value: number
    icon?: ComponentType<{ className?: string }>
  }[]
  value: SelectedParameters[]
  onValueChange: (value: SelectedParameters[]) => void
  defaultValue?: number[]
  placeholder?: string
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
      variant,
      defaultValue = [],
      placeholder = 'Select options',
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
    const [tempValue, setTempValue] = useState<SelectedParameters[]>([])

    useEffect(() => {
      setTempValue(value)
    }, [value])

    const getWholeOptions = (selectedIDs: number[]): SelectedParameters[] => {
      const selectedParameters: SelectedParameters[] = []
      selectedIDs.forEach((id) => {
        const option = options.find((opt) => opt.value === id)
        if (option) {
          selectedParameters.push({ id: option.value, denotation: option.label })
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
        setTempValue([])
        onValueChange([])
      }
    }, [reset])

    const selectedIds = tempValue.map((item) => item.id)

    const toggleOption = (optionId: number) => {
      const option = options.find((opt) => opt.value === optionId)
      if (!option) return

      if (selectedIds.includes(optionId)) {
        setTempValue(tempValue.filter((item) => item.id !== optionId))
      } else {
        setTempValue([...tempValue, { id: option.value, denotation: option.label }])
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
        setTempValue(getWholeOptions(options.map((opt) => opt.value)))
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
                    const option = options.find((o) => o.value === item.id)
                    const IconComponent = option?.icon
                    return (
                      <Badge key={item.id} className={cn(ParameterMultiSelectVariants({ variant }))}>
                        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                        {option?.label}
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
                    <Badge
                      className={cn(
                        'border-foreground/1 bg-transparent text-foreground hover:bg-transparent',
                        ParameterMultiSelectVariants({ variant })
                      )}
                    >
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
                  <Separator orientation="vertical" className="flex h-full min-h-6" />
                  <ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full items-center justify-between">
                <span className="mx-3 text-sm text-muted-foreground">{placeholder}</span>
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
              <ScrollArea className="h-fit max-h-48">
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
                  {options.map((option) => {
                    const isSelected = selectedIds.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
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
                        {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                        <span>{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandSeparator />
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
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

ParameterMultiSelect.displayName = 'ParameterMultiSelect'
