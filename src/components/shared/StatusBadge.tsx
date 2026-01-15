import { cn } from '@/lib/utils'

export type UserStatus = 'active' | 'inactive' | 'disabled' | 'locked'
export type MFAStatus = 'enabled' | 'disabled'

interface StatusBadgeProps {
  status: UserStatus
  className?: string
}

interface MFABadgeProps {
  enabled: boolean
  className?: string
}

/**
 * User status badge matching Figma design
 * - Active: Green background (#0F5729), green text (#D3F8E1), green border (#51E186)
 * - Inactive/Disabled: Gray background (#3A445D), gray text (#A5AEC2)
 * - Locked: Red background (#8D0C0C), red text (#FDE8E8), red border (#F7A1A1)
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<UserStatus, { label: string; className: string }> = {
    active: {
      label: 'Active',
      className: 'status-active border',
    },
    inactive: {
      label: 'Inactive',
      className: 'status-inactive border',
    },
    disabled: {
      label: 'Disabled',
      className: 'status-disabled border',
    },
    locked: {
      label: 'Locked',
      className: 'status-locked border',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-4 py-1 rounded-full text-sm capitalize',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

/**
 * MFA status badge matching Figma design
 * - Enabled: Green border (#51E186), green text (#22C55E), transparent background
 * - Disabled: Gray border (#A5AEC2), gray text (#A5AEC2), transparent background
 */
export function MFABadge({ enabled, className }: MFABadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm border',
        enabled ? 'mfa-enabled' : 'mfa-disabled',
        className
      )}
    >
      <span className={cn(
        'w-2 h-2 rounded-full',
        enabled ? 'bg-green-500' : 'bg-muted-foreground'
      )} />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

/**
 * Generic status dot indicator
 */
interface StatusDotProps {
  color: 'green' | 'gray' | 'red' | 'yellow' | 'blue'
  label: string
  className?: string
}

export function StatusDot({ color, label, className }: StatusDotProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-400',
    gray: 'bg-gray-400',
    red: 'bg-red-400',
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400',
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('w-3 h-3 rounded-full', colorClasses[color])} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  )
}
