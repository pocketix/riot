import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { forwardRef, useMemo, useState } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Parameter } from '@/context/InstancesContext'
import { SdParameterType } from '@/generated/graphql'

export interface ParameterOption {
  id: number | null
  denotation: string
}

interface SingleParameterComboboxProps {
  options: Parameter[]
  onValueChange: (value: ParameterOption | null) => void
  value?: ParameterOption | null
  disabled?: boolean
  filter?: SdParameterType
  className?: string
}

export const SingleParameterCombobox = forwardRef<HTMLButtonElement, SingleParameterComboboxProps>((props, ref) => {
  const [open, setOpen] = useState(false)
  const sortedOptions = useMemo(() => {
    if (!props.options) return []
    if (props.options.length === 0) return []
    return [...props.options].sort((a, b) => {
      const aLabel = a.label || a.denotation
      const bLabel = b.label || b.denotation
      return aLabel.localeCompare(bLabel)
    })
  }, [props.options])

  const filteredOptions = useMemo(() => {
    if (!sortedOptions) return []
    if (sortedOptions.length === 0) return []
    if (!props.filter) return sortedOptions
    return sortedOptions.filter((option) => {
      return option.type === props.filter
    })
  }, [sortedOptions, props.filter])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={props.disabled}
          className={cn(
            'flex w-full items-center px-2 py-0 text-left font-semibold',
            !props.value?.id && 'font-normal text-muted-foreground',
            props.className
          )}
        >
          <span className="flex-1 truncate">{props.value?.id ? props.value.denotation : 'Select parameter...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search parameter..." />
          <CommandList>
            <ScrollArea>
              <div className="h-fit max-h-[150px] sm:max-h-[300px]">
                <CommandEmpty>No parameter found.</CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.denotation}
                      onSelect={() => {
                        if (props.value?.id === option.id) {
                          setOpen(false)
                        }

                        props.onValueChange(option)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn(props.value?.id === option.id ? 'opacity-100' : 'opacity-0')} />
                      {option.denotation}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
