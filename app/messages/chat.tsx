import { useLocalSearchParams } from "expo-router"
import {
  View,
  TextInput,
  Pressable,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
  PanResponder,
  Animated,
} from "react-native"
import { useEffect, useRef, useState, useContext } from "react"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import * as SecureStore from "expo-secure-store"
import { Image } from "react-native"
import { getConversationMessages, markMessageAsRead } from "@/src/api/messageService"
import { getCurrentUser } from "@/src/api/authService"
import { MessageContext } from "@/src/context/MessageContext"
import { BASE_URL } from "@/src/utils/baseURL";


export default function ChatScreen() {
  const { conversationId, receiverId, itemId, receiverUsername } = useLocalSearchParams()
  const insets = useSafeAreaInsets()

  const receiver = receiverId ? String(receiverId) : null
  const item = itemId && itemId !== "SUPPORT" ? Number(itemId) : null
  const otherUsername = receiverUsername ? String(receiverUsername) : "Utilisateur"

  const [convId, setConvId] = useState<number | null>(
    conversationId ? Number(conversationId) : null
  )
  const convIdRef = useRef<number | null>(convId)

  const [messages, setMessages] = useState<any[]>([])
  const [content, setContent] = useState("")
  const [user, setUser] = useState<any>(null)
  const [pendingImage, setPendingImage] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const translateY = useRef(new Animated.Value(0)).current

  const { loadUnreadMessages } = useContext(MessageContext)
  const flatListRef = useRef<FlatList>(null)
   const isAtBottomRef = useRef(true);

  const panResponder = useRef(
  PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 10
    },

    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy)
      }
    },

onPanResponderRelease: (_, gestureState) => {
  if (gestureState.dy > 100) {
    Animated.timing(translateY, {
      toValue: 500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setFullscreenImage(null);
      translateY.setValue(0); // ← reset pour la prochaine ouverture
    });
  } else {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }
},
  })
).current

  useEffect(() => { convIdRef.current = convId }, [convId])

 

  // ── Init ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser()
      setUser(u)
      if (convIdRef.current) await loadMessages(u)
    }
    init()
  }, [])

  // ── Refresh auto ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (convIdRef.current) loadMessages()
    }, 5000)
    return () => clearInterval(interval)
  }, [convId])

  // ── Load messages ─────────────────────────────────────
  const loadMessages = async (currentUser?: any) => {
    if (!convIdRef.current) return
    try {
      const data = await getConversationMessages(convIdRef.current)
      setMessages(data)
      for (const msg of data) {
        if (msg.receiverId === currentUser?.userId && !msg.read) {
          await markMessageAsRead(msg.id)
        }
      }
      await loadUnreadMessages()
    } catch (err) {
      console.log("loadMessages error:", err)
    }
  }

  // ── Sélection image ───────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Accès aux images refusé")
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    })
    if (!result.canceled) {
      setPendingImage(result.assets[0])
    }
  }

  // ── Envoi unifié texte + image ────────────────────────
  const handleSend = async () => {
    if (!content.trim() && !pendingImage) return

    try {
      setSending(true)
      const token = await SecureStore.getItemAsync("token")

      // CAS 1 — pas encore de conversation (premier message, texte seulement)
      if (!convIdRef.current) {
        if (!receiver) return
        const formData = new FormData()
        // On crée d'abord la conversation via le endpoint classique
        const res = await fetch(`${BASE_URL}/api/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiverId: receiver,
            itemId: item,
            content: content.trim() || "👋",
          }),
        })
        const msg = await res.json()
        if (msg?.conversationId) {
          convIdRef.current = msg.conversationId
          setConvId(msg.conversationId)
        }
        setMessages(prev => [...prev, msg])
        setContent("")
        setPendingImage(null)
        return
      }

      // CAS 2 — conversation existe → send-with-image
      const formData = new FormData()
      formData.append("conversationId", String(convIdRef.current))
      if (content.trim()) formData.append("content", content.trim())
      if (pendingImage) {
        formData.append("image", {
          uri: pendingImage.uri,
          type: pendingImage.mimeType ?? "image/jpeg",
          name: "chat_image.jpg",
        } as any)
      }

      console.log("📦 Envoi formData:")
      console.log("conversationId:", convIdRef.current)
      console.log("content:", content.trim())
      console.log("image:", pendingImage?.uri)

      const response = await fetch(`${BASE_URL}/api/messages/send-with-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      console.log("📡 STATUS:", response.status)
      const msg = await response.json()
      console.log("✅ MSG:", JSON.stringify(msg))

      setMessages(prev => [...prev, msg])
      setContent("")
      setPendingImage(null)

    } catch (err) {
      console.log("❌ Send error:", err)
      Alert.alert("Erreur", "Impossible d'envoyer")
    } finally {
      setSending(false)
    }
  }

  // ── Render message ────────────────────────────────────
  const renderItem = ({ item }: any) => {
    const isMe = item.senderId === user?.userId
    return (
      <View style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        backgroundColor: isMe ? "#2563eb" : "#e5e7eb",
        padding: item.imageUrl && !item.content ? 4 : 10,
        borderRadius: 12,
        marginVertical: 4,
        maxWidth: "75%",
      }}>
        <Text style={{
          fontWeight: "bold", marginBottom: 4, fontSize: 11,
          color: isMe ? "#dbeafe" : "#6b7280",
          paddingHorizontal: item.imageUrl && !item.content ? 6 : 0,
          paddingTop: item.imageUrl && !item.content ? 4 : 0,
        }}>
          {isMe ? "Vous" : otherUsername}
        </Text>


        {/* Image */}
        {item.imageUrl && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              setFullscreenImage(`${BASE_URL}${item.imageUrl}`)
            }
          >
            <Image
              source={{ uri: `${BASE_URL}${item.imageUrl}` }}
              style={{
                width: 200,
                aspectRatio: 1,
                borderRadius: 8,
                marginBottom: item.content ? 6 : 0,
              }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Texte */}
        {item.content && (
          <Text style={{ color: isMe ? "#fff" : "#000" }}>
            {item.content}
          </Text>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 10}
      >
        <View style={{ flex: 1 }}>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 15, paddingBottom: 10 }}
          

// Ajoute dans FlatList :
onScroll={(e) => {
  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
  const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
  isAtBottomRef.current = distanceFromBottom < 50;
}}
scrollEventThrottle={100}
onContentSizeChange={() => {
  if (isAtBottomRef.current) {
    flatListRef.current?.scrollToEnd({ animated: true });
  }
}}
            
            keyboardShouldPersistTaps="handled"
          />

          {/* Preview image en attente */}
          {pendingImage && (
            <View style={{
              marginHorizontal: 12, marginBottom: 6,
              alignSelf: "flex-start", position: "relative",
            }}>
              <Image
                source={{ uri: pendingImage.uri }}
                style={{ width: 70, height: 70, borderRadius: 8 }}
                resizeMode="contain"
              />
              <Pressable
                onPress={() => setPendingImage(null)}
                style={{
                  position: "absolute", top: -6, right: -6,
                  backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10,
                  width: 20, height: 20,
                  justifyContent: "center", alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>×</Text>
              </Pressable>
            </View>
          )}

          {/* Zone saisie */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            paddingHorizontal: 10, paddingTop: 8,
            paddingBottom: insets.bottom + 10,
            backgroundColor: "#f4f6f9", gap: 8,
          }}>

            {/* Bouton spirale */}
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: pendingImage ? "#10b981" : "#e5e7eb",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>
                {pendingImage ? "🖼️" : "📎"}
              </Text>
            </TouchableOpacity>

            {/* Input */}
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Votre message..."
              multiline
              style={{
                flex: 1,
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 20,
                maxHeight: 100,
              }}
            />

            {/* Envoyer */}
            <Pressable
              onPress={handleSend}
              disabled={(!content.trim() && !pendingImage) || sending}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: (!content.trim() && !pendingImage) || sending
                  ? "#9ca3af" : "#2563eb",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16 }}>➤</Text>
            </Pressable>

          </View>
        </View>
      </KeyboardAvoidingView>
      {/* Fullscreen image viewer */}
// Remplace tout le Modal par :
<Modal
  visible={!!fullscreenImage}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setFullscreenImage(null)}
>
  <Animated.View
    style={{
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
      transform: [{ translateY }],
    }}
    {...panResponder.panHandlers}
  >
    {/* Fermer */}
    <TouchableOpacity
      onPress={() => {
        translateY.setValue(0);
        setFullscreenImage(null);
      }}
      style={{ position: "absolute", top: 60, right: 25, zIndex: 10 }}
    >
      <Text style={{ color: "#fff", fontSize: 34, fontWeight: "bold" }}>×</Text>
    </TouchableOpacity>

    {fullscreenImage && (
      <Image
        source={{ uri: fullscreenImage }}
        style={{ width: "100%", height: "80%" }}
        resizeMode="contain"
      />
    )}

    {/* Indicateur swipe */}
    <Text style={{ color: "#ffffff80", fontSize: 12, position: "absolute", bottom: 40 }}>
      ↓ Glissez vers le bas pour fermer
    </Text>
  </Animated.View>
</Modal>
    </SafeAreaView>
  )
}