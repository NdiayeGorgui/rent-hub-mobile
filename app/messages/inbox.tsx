import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native"
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"

import { getUserConversations } from "@/src/api/messageService"
import { getCurrentUser } from "@/src/api/authService"

import { Conversation, User } from "@/src/types/message"
import { useContext } from "react"
import { MessageContext } from "@/src/context/MessageContext"

export default function InboxScreen() {

  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const { loadUnreadMessages } = useContext(MessageContext)

  const loadData = async () => {
await loadUnreadMessages()
    try {

      const user = await getCurrentUser()

      setCurrentUser(user)

      const data = await getUserConversations()

      setConversations(data)

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)

    }

  }

  useEffect(() => {

    loadData()

  }, [])

const openChat = (conversation: Conversation) => {

  const isSupport = conversation.itemId === null

  const otherUserId =
    conversation.user1Id === currentUser?.userId
      ? conversation.user2Id
      : conversation.user1Id

  const otherUsername =
    conversation.user1Id === currentUser?.userId
      ? conversation.user2Username
      : conversation.user1Username

  router.push({
    pathname: "/messages/chat",
    params: {
      conversationId: String(conversation.id),
      receiverId: String(otherUserId),
      itemId: isSupport ? "SUPPORT" : String(conversation.itemId), // ✅ "SUPPORT" au lieu de null
      receiverUsername: isSupport ? "Support" : otherUsername
    }
  })
}
  const renderItem = ({ item }: { item: Conversation }) => {

    const isMe = item.lastSenderId === currentUser?.userId

    return (

      <Pressable
        onPress={() => openChat(item)}
        style={{
          padding: 15,
          borderBottomWidth: 1,
          borderBottomColor: "#eee"
        }}
      >

        <Text style={{ fontSize: 12, color: "gray" }}>
  {item.itemId === null
    ? "Support"
    : (item.user1Id === currentUser?.userId
        ? item.user2Username
        : item.user1Username)}
</Text>

        <Text numberOfLines={1}>
          {isMe ? "Vous : " : ""}{item.lastMessage}
        </Text>

        {item.unreadCount > 0 && (
          <Text style={{ color: "red", marginTop: 5 }}>
            {item.unreadCount} nouveau(x)
          </Text>
        )}

      </Pressable>

    )

  }

  if (loading) {

    return (

      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>

    )

  }

  return (

    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
    />

  )

}