export type Day =
  | 'MON'
  | 'TUE'
  | 'WED'
  | 'THU'
  | 'FRI'
  | 'SAT'
  | 'SUN'

export type PeriodFilter = 'today' | 'week' | 'month'

export type DateString = string & { readonly __brand: 'DateString' }

export interface Identifiable {
  id: string
}
