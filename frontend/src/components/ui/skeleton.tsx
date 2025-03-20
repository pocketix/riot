import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  disableAnimation?: boolean
}

function Skeleton({ className, disableAnimation, ...props }: SkeletonProps) {
  return <div className={cn('rounded-md bg-muted', !disableAnimation && 'animate-pulse', className)} {...props} />
}

export { Skeleton }
