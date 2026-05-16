import { clsx } from 'clsx'

interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

export function Badge({ children, variant = 'default' }: Props) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      {
        'bg-slate-100 text-slate-600': variant === 'default',
        'bg-green-100 text-green-700': variant === 'success',
        'bg-yellow-100 text-yellow-700': variant === 'warning',
        'bg-red-100 text-red-700': variant === 'error',
        'bg-blue-100 text-blue-700': variant === 'info',
      }
    )}>
      {children}
    </span>
  )
}
