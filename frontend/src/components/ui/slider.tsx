// vertical slider issue : https://github.com/shadcn-ui/ui/issues/2186

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
      props.orientation === 'vertical' && 'flex-col'
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        'relative h-1.5 w-full grow overflow-hidden rounded-xl bg-primary/20',
        props.orientation === 'vertical' && 'h-full'
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          'absolute h-full bg-yellow-200 transition-all duration-200 ease-out',
          props.orientation === 'vertical' && 'w-full'
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-2 w-10 rounded-lg border border-primary/50 bg-muted shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
