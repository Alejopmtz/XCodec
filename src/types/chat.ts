import type { MessagePage } from './database.types'

// Mensaje enriquecido con datos del sender
export type MessageWithSender = MessagePage

// Usuario presente en el canal Realtime
export type OnlineUser = {
  userId: string
  username: string
  displayName: string
}

// Payload que se envía al rastrear presencia
export type PresencePayload = OnlineUser
