import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib//utils"
import { Button } from "./ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useState } from "react"
import { SdParameter, SdType } from "@/generated/graphql"
import { ScrollArea } from "./ui/scroll-area"

export interface ParameterComboboxProps {
    parameters: SdParameter[] | null,
    selectedParameter: SdParameter | null,
    setParameter: (parameter: SdParameter | null) => void
}

export function ParameterCombobox({ parameters, selectedParameter, setParameter }: ParameterComboboxProps) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between flex"
                >
                    {selectedParameter
                        ? parameters?.find((parameter) => parameter.denotation === selectedParameter.denotation)?.denotation
                        : "Select a parameter"}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="PopoverContent p-0">
                <Command className="w-full">
                    <CommandInput placeholder="Search parameter..." />
                    <ScrollArea>
                        <div className="max-h-[250px]">
                            <CommandEmpty>No parameters found.</CommandEmpty>
                            <CommandGroup >
                                {parameters?.map((parameter) => (
                                    <CommandItem
                                        key={parameter.id}
                                        value={parameter.denotation}
                                        onSelect={(currentValue) => {
                                            if (currentValue === selectedParameter?.denotation) {
                                                setParameter(null);
                                            } else {
                                                const selected = parameters.find((param) => param.denotation === currentValue);
                                                setParameter(selected || null);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        {parameter.denotation}
                                        <Check className={cn(
                                            "ml-auto", selectedParameter?.denotation === parameter.denotation ? "opacity-100" : "opacity-0"
                                        )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </div>
                    </ScrollArea>
                </Command>
            </PopoverContent>
        </Popover >
    )
}