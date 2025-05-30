import { format, setHours, setMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { forwardRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@radix-ui/react-scroll-area'

interface DateTimeRangePickerProps {
  value?: { start: Date | undefined; end: Date | undefined }
  onValueChange?: (range: { start: Date | undefined; end: Date | undefined }) => void
  className?: string
  maxDate?: Date
}

export const DateTimeRangePicker = forwardRef<HTMLButtonElement, DateTimeRangePickerProps>(
  ({ value, onValueChange, className, maxDate }, ref) => {
    const [range, setRange] = useState<{ start: Date | undefined; end: Date | undefined }>(
      value || { start: undefined, end: undefined }
    )
    const [isOpen, setIsOpen] = useState(false)
    const [showTimes, setShowTimes] = useState(false)

    useEffect(() => {
      setShowTimes(false)
    }, [isOpen])

    // Without this useEffect, the value cannot be set externally
    useEffect(() => {
      setRange(value || { start: undefined, end: undefined })
    }, [value])

    const handleDateSelect = (selected: { from?: Date; to?: Date } | undefined) => {
      const newRange = selected ? { start: selected.from, end: selected.to } : { start: undefined, end: undefined }
      setRange(newRange)
      if (onValueChange) onValueChange(newRange)
    }

    // The input's value must be set as string in the format HH:mm
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time
    const getTimeString = (date: Date | undefined) => {
      if (!date) return ''
      return [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':')
    }

    // The inputs return strings in the format HH:mm,
    // it is necessary to convert them to Date objects
    const handleInputTimeChange = (type: 'start' | 'end', value: string) => {
      const [hours, minutes] = value.split(':').map(Number)
      const date = type === 'start' ? range.start : range.end
      if (date) {
        let newDate = new Date(date)
        newDate = setHours(newDate, hours)
        newDate = setMinutes(newDate, minutes)
        newDate.setSeconds(0, 0)
        const newRange = { ...range, [type]: newDate }
        setRange(newRange)
        if (onValueChange) onValueChange(newRange)
      }
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild className={cn('w-full', className)}>
          <Button
            ref={ref}
            variant="outline"
            className={cn('h-fit w-full justify-start text-left font-normal', !range.start && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className={'flex max-w-full flex-col items-center justify-center truncate'}>
              {range.start && range.end ? (
                <>
                  <span className="truncate">{format(range.start, 'MM/dd/yyyy HH:mm:ss')}</span>
                  <span className="truncate">{format(range.end, 'MM/dd/yyyy HH:mm:ss')}</span>
                </>
              ) : (
                <span className="truncate text-muted-foreground">Select time range...</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[100px] max-w-[95vw] p-0">
          <ScrollArea className="max-h-[350px] w-full overflow-y-auto">
            <div className="flex w-full flex-col gap-4 px-2 py-2">
              <div className="w-full min-w-0 max-w-full">
                <Calendar
                  mode="range"
                  initialFocus
                  selected={{ from: range.start, to: range.end }}
                  onSelect={handleDateSelect}
                  toDate={maxDate}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col justify-center gap-4">
                {!showTimes ? (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowTimes(true)}>
                    Add Times
                  </Button>
                ) : (
                  <div className="flex w-full flex-col items-center gap-2">
                    <p className="font-semibold">Exact Times</p>
                    <Separator orientation="horizontal" className="w-full" />
                    <div className="w-full">
                      <p className="text-xs font-semibold">Start Time</p>
                      <Input
                        type="time"
                        value={getTimeString(range.start)}
                        onChange={(e) => handleInputTimeChange('start', e.target.value)}
                        className="invert-time-icon flex w-full items-center justify-center px-1 py-1 text-center"
                        disabled={!range.start}
                      />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-semibold">End Time</p>
                      <Input
                        type="time"
                        value={getTimeString(range.end)}
                        onChange={(e) => handleInputTimeChange('end', e.target.value)}
                        className="invert-time-icon flex w-full items-center justify-center px-1 py-1 text-center"
                        disabled={!range.end}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  }
)
