import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
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

interface IndicatorBox {
  left: number
  top: number
  width: number
  height: number
  ready: boolean
}

export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const [indicator, setIndicator] = useState<IndicatorBox>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  })

  const setItemRef = useCallback((key: string, node: HTMLButtonElement | null) => {
    if (node) itemRefs.current.set(key, node)
    else itemRefs.current.delete(key)
  }, [])

  const updateIndicator = useCallback(() => {
    const list = listRef.current
    const item = itemRefs.current.get(value)
    if (!list || !item) return

    const listRect = list.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()

    setIndicator({
      left: itemRect.left - listRect.left,
      top: itemRect.top - listRect.top,
      width: itemRect.width,
      height: itemRect.height,
      ready: true,
    })
  }, [value])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator, options])

  useEffect(() => {
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [updateIndicator])

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        'relative inline-flex w-full flex-wrap gap-1 rounded-xl bg-forest-100/80 p-1 sm:w-auto',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-0 left-0 rounded-lg bg-white shadow-sm',
          'transition-[transform,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          indicator.ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          width: indicator.width,
          height: indicator.height,
          transform: `translate(${indicator.left}px, ${indicator.top}px)`,
        }}
      />
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(node) => setItemRef(option.value, node)}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 sm:flex-none',
              selected
                ? 'text-forest-900'
                : 'text-forest-700 hover:text-forest-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
