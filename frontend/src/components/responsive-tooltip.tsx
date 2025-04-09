import { ReactNode, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { cn } from '@/lib/utils'

interface ResponsiveTooltipProps {
  content: string | ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: string
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
  maxWidth = '200px',
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
          <button
            type="button"
            className={cn('cursor-pointer', className)}
            onClick={() => setOpen(!open)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onTouchStart={() => setOpen(!open)}
            onKeyDown={(e) => {
              e.preventDefault()
              e.key === 'Enter' && setOpen(!open)
            }}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent
          className={cn('!p-3', !content ? 'hidden' : '', contentClassName)}
          style={{ maxWidth }}
          align={align}
          side={side}
          sideOffset={sideOffset}
        >
          <div className="inline-block">{formattedContent}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
