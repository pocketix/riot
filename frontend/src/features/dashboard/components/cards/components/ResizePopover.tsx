import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Arrow } from '@/styles/dashboard/CardGlobal'
import { FiMinusSquare, FiPlusSquare } from 'react-icons/fi'
import { Separator } from '@/components/ui/separator'

export interface ResizePopoverProps {
  children: React.ReactNode
  maxValue?: number
  minValue?: number
  currentValue?: number
  rightEdge?: boolean
  onDecrease?: () => void
  onIncrease?: () => void
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function ResizePopover({
  children,
  onDecrease,
  onIncrease,
  currentValue,
  maxValue,
  minValue,
  rightEdge,
  isOpen,
  onOpenChange
}: ResizePopoverProps) {
  const increaseDisabled = currentValue === maxValue || rightEdge
  const decreaseDisabled = currentValue === minValue

  // Do not even display the popover if both buttons are disabled
  if (increaseDisabled && decreaseDisabled) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Arrow disabled={false}>{children}</Arrow>
      </PopoverTrigger>
      <PopoverContent className="flex h-fit w-fit gap-2 p-2">
        {!increaseDisabled && (
          <Arrow onClick={onIncrease} $green={true}>
            <FiPlusSquare />
          </Arrow>
        )}

        {!increaseDisabled && !decreaseDisabled && <Separator orientation="vertical" className="h-6" />}

        {!decreaseDisabled && (
          <Arrow onClick={onDecrease} $red={true}>
            <FiMinusSquare />
          </Arrow>
        )}
      </PopoverContent>
    </Popover>
  )
}
