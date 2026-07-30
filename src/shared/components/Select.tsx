import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
}

export function Select({ label, options, error, className, id, ...props }: SelectProps) {
  const selectId = id ?? props.name

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-forest-800">{label}</span> : null}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-lg border border-forest-200 bg-white px-3 py-2 text-ink',
          'focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200',
          error && 'border-missed-400 focus:ring-missed-200',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-missed-700">{error}</span> : null}
    </label>
  )
}
