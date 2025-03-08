import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SdInstance } from '@/generated/graphql'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/dashboard/PopOver.css'

export interface AddItemComboboxProps {
  instances: SdInstance[] | undefined
  selectedInstance: SdInstance | null
  setInstance: (instance: SdInstance | null) => void
}

export function AddItemCombobox({ instances, selectedInstance, setInstance }: AddItemComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between flex">
          {selectedInstance ? instances?.find((instance) => instance.type.denotation === selectedInstance.type.denotation)?.type.denotation : 'Select a device'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="PopoverContent p-0">
        <Command>
          <CommandInput placeholder="Search instance..." />
          <ScrollArea>
            <div className="max-h-[250px]">
              <CommandEmpty>No devices found.</CommandEmpty>
              <CommandGroup>
                {instances?.map((instance) => (
                  <CommandItem
                    key={instance.id}
                    value={instance.type.denotation}
                    onSelect={(currentValue) => {
                      if (currentValue === selectedInstance?.type.denotation) {
                        setInstance(null)
                      } else {
                        const selected = instances.find((inst) => inst.type.denotation === currentValue)
                        setInstance(selected || null)
                      }
                      setOpen(false)
                    }}
                  >
                    {instance.type.denotation}
                    <Check className={cn('ml-auto', selectedInstance?.type.denotation === instance.type.denotation ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
