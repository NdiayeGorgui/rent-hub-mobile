export type Message = {
  id: number
  senderId: string
  receiverId: string
  itemId: number | null
  content: string
  timestamp: string
  read: boolean
}

export type Conversation = {
  id: number
  user1Id: string
  user2Id: string
  user1Username: string
  user2Username: string

  itemId: number | null
  lastMessage: string
  lastMessageAt: string
  lastSenderId: string
  unreadCount: number
}

export type User = {
  userId: string
}