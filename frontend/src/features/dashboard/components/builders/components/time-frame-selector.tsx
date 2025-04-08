import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface TimeFrameOption {
  value: string
  label: string
}

interface TimeFrameSelectorProps {
  onValueChange: (value: string | null) => void
  value?: string | null
  disabled?: boolean
  className?: string
}

const options: TimeFrameOption[] = [
  { value: '1', label: '1 hour' },
  { value: '3', label: '3 hours' },
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
  { value: '336', label: '14 days' },
  { value: '720', label: '30 days' }
]

export function TimeFrameSelector({
  onValueChange,
  value,
  disabled = false,
  className
}: TimeFrameSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between truncate px-2', className)}
        >
          {value ? options.find((option) => option.value === value)?.label : 'Select timeframe...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandList>
            <ScrollArea>
              <div className="h-fit max-h-[150px]">
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
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
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
