export interface AppMessage {
  id: string
  type: string
  title: string
  body: string
  meta: Record<string, unknown>
  readAt: string | null
  createdAt: string
}
