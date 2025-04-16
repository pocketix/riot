import { Button } from '@/components/ui/button'

export interface TimeFrameOption {
  value: string
  label: string
  shortLabel: string
}

interface TimeFrameButtonSelectorProps {
  onValueChange: (value: string | null) => void
  value?: string | null
  disabled?: boolean
  className?: string
  compact?: boolean
}

const options: TimeFrameOption[] = [
  { value: '1', label: '1 hour', shortLabel: '1h' },
  { value: '6', label: '6 hours', shortLabel: '6h' },
  { value: '24', label: '24 hours', shortLabel: '1d' },
  { value: '168', label: '7 days', shortLabel: '1w' },
  { value: '720', label: '30 days', shortLabel: '1m' }
]

export function TimeFrameButtonSelector({
  onValueChange,
  value,
  disabled = false,
  compact = false
}: TimeFrameButtonSelectorProps) {
  const handleSelect = (optionValue: string) => {
    if (disabled) return

    const newValue = value === optionValue ? null : optionValue
    onValueChange(newValue)
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-1 px-0.5 py-0">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'outline'}
          className="rounded-md px-2 py-1 text-sm font-semibold"
          onClick={() => handleSelect(option.value)}
          disabled={disabled}
        >
          {compact ? option.shortLabel : option.label}
        </Button>
      ))}
    </div>
  )
}
