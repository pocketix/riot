import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '@/components/ui/command'

const COMMON_SYMBOLS = [
  { symbol: '°C', keywords: ['celsius', 'temperature'] },
  { symbol: '°F', keywords: ['fahrenheit', 'temperature'] },
  { symbol: '%', keywords: ['percent', 'percentage'] },
  { symbol: '$', keywords: ['dollar', 'usd'] },
  { symbol: '€', keywords: ['euro', 'eur'] },
  { symbol: 'kg', keywords: ['kilogram', 'weight', 'mass'] },
  { symbol: 'g', keywords: ['gram', 'weight', 'mass'] },
  { symbol: 'mg', keywords: ['milligram', 'weight', 'mass'] },
  { symbol: 'm', keywords: ['meter', 'length', 'distance'] },
  { symbol: 'cm', keywords: ['centimeter', 'length', 'distance'] },
  { symbol: 'mm', keywords: ['millimeter', 'length', 'distance'] },
  { symbol: 'W', keywords: ['watt', 'power'] },
  { symbol: 'kW', keywords: ['kilowatt', 'power'] },
  { symbol: 'V', keywords: ['volt', 'voltage'] },
  { symbol: 'A', keywords: ['ampere', 'current', 'amps'] },
  { symbol: 'mA', keywords: ['milliampere', 'current', 'amps'] },
  { symbol: 'Hz', keywords: ['hertz', 'frequency'] },
  { symbol: 'N', keywords: ['newton', 'force'] },
  { symbol: 'J', keywords: ['joule', 'energy'] },
  { symbol: 'kJ', keywords: ['kilojoule', 'energy'] },
  { symbol: 'Wh', keywords: ['watt hour', 'energy'] },
  { symbol: 'kWh', keywords: ['kilowatt hour', 'energy'] },
  { symbol: 'L', keywords: ['liter', 'volume'] },
  { symbol: 'Pa', keywords: ['pascal', 'pressure'] }
]

interface ValueSymbolPickerProps {
  value: string
  disabled?: boolean
  onChange: (val: string) => void
  className?: string
}

export function ValueSymbolPicker(props: ValueSymbolPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn('flex gap-2', props.className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={props.disabled}
            className={cn('w-24 justify-between truncate px-2 shadow-none')}
          >
            {props.value && COMMON_SYMBOLS.some((s) => s.symbol === props.value) ? props.value : 'Pick'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0">
          <Command
            filter={(value, search) => {
              const symbol = COMMON_SYMBOLS.find((s) => s.symbol === value)
              if (!symbol) return 0
              const searchInput = search.toLowerCase()
              if (
                symbol.symbol.toLowerCase().includes(searchInput) ||
                symbol.keywords.some((kw) => kw.toLowerCase().includes(searchInput))
              ) {
                return 1
              }
              return 0
            }}
          >
            <CommandInput placeholder="Search symbol..." />
            <CommandList>
              <ScrollArea>
                <div className="h-fit max-h-[150px] sm:max-h-[300px]">
                  <CommandEmpty>No results</CommandEmpty>
                  <CommandGroup>
                    {COMMON_SYMBOLS.map(({ symbol }) => (
                      <CommandItem
                        key={symbol}
                        value={symbol}
                        onSelect={() => {
                          props.onChange(symbol)
                          setOpen(false)
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', props.value === symbol ? 'opacity-100' : 'opacity-0')} />
                        {symbol}
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
      <Input
        className="w-24"
        placeholder="Custom"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  )
}
