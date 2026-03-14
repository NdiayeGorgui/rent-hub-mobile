import { useLocalSearchParams } from "expo-router"
import { View, TextInput, Pressable, Text, FlatList } from "react-native"
import { useEffect, useRef, useState } from "react"

import {
  sendMessage,
  getConversationMessages,
  markMessageAsRead
} from "@/src/api/messageService"

import { getCurrentUser } from "@/src/api/authService"
import { useContext } from "react"
import { MessageContext } from "@/src/context/MessageContext"

export default function ChatScreen() {

const { conversationId, receiverId, itemId, receiverUsername } = useLocalSearchParams()
const otherUsername = receiverUsername ? String(receiverUsername) : "Utilisateur"
const [hasMarkedRead, setHasMarkedRead] = useState(false)

const [convId, setConvId] = useState<number | null>(
  conversationId ? Number(conversationId) : null
)


const receiver = receiverId ? String(receiverId) : null
const item = itemId ? Number(itemId) : null

const [messages, setMessages] = useState<any[]>([])
const [content, setContent] = useState("")
const [user, setUser] = useState<any>(null)
const { loadUnreadMessages } = useContext(MessageContext)


const loadMessages = async (currentUser?: any) => {

  if (!convId) return

  const data = await getConversationMessages(convId)

  setMessages(data)

  for (const msg of data) {

    if (msg.receiverId === currentUser?.userId && !msg.read) {
      await markMessageAsRead(msg.id)
    }

  }

  await loadUnreadMessages()

}

const flatListRef = useRef<FlatList>(null)

useEffect(() => {
  flatListRef.current?.scrollToEnd({ animated: true })
}, [messages])

useEffect(() => {
const init = async () => {

  const u = await getCurrentUser()

  setUser(u)

  if (convId) {
    await loadMessages(u)
  }

}

  init()

}, [])


// ⭐ refresh automatique du chat
useEffect(() => {

  const interval = setInterval(() => {

    if (convId) {
      loadMessages()
    }

  }, 5000)

  return () => clearInterval(interval)

}, [convId])

const handleSend = async () => {

  if (!content || !receiver || !item) return

  try {

    const msg = await sendMessage({
      receiverId: receiver,
      itemId: item,
      content
    })

    setContent("")

    // ⭐ récupérer conversationId directement
    if (!convId) {
      setConvId(msg.conversationId)
    }

    // ⭐ ajouter message instantanément
    setMessages(prev => [...prev, msg])

  } catch (error) {

    console.log("Send message error:", error)

  }

}

const renderItem = ({ item }: any) => {

  const isMe = item.senderId === user?.userId

  return (

    <View
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        backgroundColor: isMe ? "#2563eb" : "#e5e7eb",
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        maxWidth: "70%"
      }}
    >

      <Text style={{ fontWeight:"bold", marginBottom:2 }}>
        {isMe ? "Vous" : otherUsername}
      </Text>

      <Text style={{ color: isMe ? "#fff" : "#000" }}>
        {item.content}
      </Text>

    </View>

  )

}

return (

<View style={{ flex: 1, padding: 15 }}>

<FlatList
  ref={flatListRef}
  data={messages}
  keyExtractor={(item) => item.id.toString()}
  renderItem={renderItem}
/>

<TextInput
  value={content}
  onChangeText={setContent}
  placeholder="Votre message..."
  style={{
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginTop: 10
  }}
/>

<Pressable
  onPress={handleSend}
  style={{
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  }}
>
  <Text style={{ color: "#fff", textAlign: "center" }}>
    Envoyer
  </Text>
</Pressable>

</View>

)

}