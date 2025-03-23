import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEffect, useState } from 'react'
import { SdParameter } from '@/generated/graphql'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ParameterOption {
  id: number
  denotation: string
}

interface SingleParameterComboboxProps {
  options: SdParameter[]
  onValueChange: (value: ParameterOption | null) => void
  value?: ParameterOption | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SingleParameterCombobox({
  onValueChange,
  options,
  value,
  disabled = false,
  placeholder = 'Select parameter...',
  className
}: SingleParameterComboboxProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    console.log('Value changed:', value)
  }, [value])

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
          {value?.id ? value.denotation : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search parameter..." />
          <CommandList>
            <ScrollArea className="h-[200px]">
              <CommandEmpty>No parameter found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.denotation}
                    onSelect={() => {
                      if (value?.id === option.id) {
                        setOpen(false)
                      }

                      onValueChange(option)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn(value?.id === option.id ? 'opacity-100' : 'opacity-0')} />
                    {option.denotation}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
