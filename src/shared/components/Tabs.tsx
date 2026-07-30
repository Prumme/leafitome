import { cn } from '@/shared/utils/cn'

export interface TabOption<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex w-full flex-wrap gap-1 rounded-xl bg-forest-100/80 p-1 sm:w-auto',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none',
              selected
                ? 'bg-white text-forest-900 shadow-sm'
                : 'text-forest-700 hover:bg-white/60 hover:text-forest-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
