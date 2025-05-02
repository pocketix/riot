import { ReactNode, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils'

interface ResponsiveTooltipProps {
  content: string | ReactNode
  className?: string
  contentClassName?: string
  align?: 'center' | 'start' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  children: ReactNode
}

// https://github.com/shadcn-ui/ui/issues/86
// tooltip that works on both desktop and mobile
export const ResponsiveTooltip = ({
  content,
  children,
  className,
  contentClassName,
  align = 'center',
  side = 'top',
  sideOffset = 5
}: ResponsiveTooltipProps) => {
  const [open, setOpen] = useState(false)

  // Formats the content by splitting it into paragraphs
  const formattedContent =
    typeof content === 'string' ? (
      <div className="text-sm">
        {content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-1' : ''}>
            {line}
          </p>
        ))}
      </div>
    ) : (
      content
    )

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open}>
        <TooltipTrigger asChild>
          <div
            className={cn('cursor-pointer select-none', className)}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onTouchStart={() => setOpen(!open)}
            onTouchCancel={(e) => {
              e.preventDefault()
              setOpen(false)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              setOpen(false)
            }}
            onKeyDown={(e) => {
              e.preventDefault()
              e.key === 'Enter' && setOpen(!open)
            }}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent
          className={cn('max-w-[90vw] break-all pt-0', !content ? 'hidden' : '', contentClassName)}
          align={align}
          side={side}
          sideOffset={sideOffset}
          avoidCollisions={true}
          collisionPadding={10}
        >
          <div className="inline-block">{formattedContent}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
