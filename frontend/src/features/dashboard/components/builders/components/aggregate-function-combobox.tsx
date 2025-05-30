import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { forwardRef, useState } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { StatisticsOperation } from '@/generated/graphql'

interface AggregateFunctionComboboxProps {
  onValueChange: (value: StatisticsOperation | null) => void
  value?: string
  disabled?: boolean
  className?: string
}

export const AggregateFunctionCombobox = forwardRef<HTMLButtonElement, AggregateFunctionComboboxProps>(
  ({ onValueChange, value, disabled = false, className }, ref) => {
    const [open, setOpen] = useState(false)
    const options = [
      { value: StatisticsOperation.Sum, label: 'Total' },
      { value: StatisticsOperation.Mean, label: 'Average' },
      { value: StatisticsOperation.Max, label: 'Maximum' },
      { value: StatisticsOperation.Min, label: 'Minimum' },
      { value: StatisticsOperation.Count, label: 'Count' },
      { value: StatisticsOperation.Last, label: 'Last Value' },
      { value: StatisticsOperation.First, label: 'First Value' }
    ]

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
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
              {value ? options.find((opt) => opt.value === value)?.label : 'Select aggregate function...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search functions..." />
            <CommandList>
              <ScrollArea>
                <div className="h-fit max-h-[150px] sm:max-h-[300px]">
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.label}
                        value={option.value}
                        onSelect={() => {
                          if (value === option.value) {
                            setOpen(false)
                          }

                          onValueChange(option.value)
                          setOpen(false)
                        }}
                      >
                        <Check className={cn(value === option.value ? 'opacity-100' : 'opacity-0')} />
                        {option.label}
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
  }
)
