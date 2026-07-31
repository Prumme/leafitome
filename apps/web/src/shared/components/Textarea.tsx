import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-forest-800">{label}</span> : null}
      <textarea
        id={textareaId}
        className={cn(
          'min-h-24 w-full resize-y rounded-lg border border-forest-200 bg-white px-3 py-2 text-ink',
          'placeholder:text-bark-400',
          'focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200',
          error && 'border-missed-400 focus:ring-missed-200',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-missed-700">{error}</span> : null}
    </label>
  )
}
