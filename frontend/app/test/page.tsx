"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Users, Search, Clock, CheckCheck, Volume2, VolumeX, Menu, X, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/api"

interface User {
  id: string
  username: string
  email: string
  profile_photo?: string
  is_online: boolean
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  databaseId?: string
  isSending?: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Core state
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const currentStateRef = useRef({
    currentUserId: "",
    selectedUserId: "",
    messages: [] as Message[]
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Get selected user details
  const selectedUser = users.find(user => user.id === selectedUserId)

  // ✅ Check screen size and handle responsiveness
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // ✅ Initialize and validate URL query on first render
  useEffect(() => {
    const initializeFromURL = async () => {
      const urlUser = searchParams.get('user')
      
      if (urlUser) {
        // Validate that the user exists
        try {
          const usersResponse = await api.get("/chat/users")
          const userExists = usersResponse.data.users.some((user: User) => user.id === urlUser)
          
          if (userExists) {
            setSelectedUserId(urlUser)
          } else {
            // Invalid user in URL, remove it
            const params = new URLSearchParams(searchParams.toString())
            params.delete('user')
            router.replace(`?${params.toString()}`, { scroll: false })
          }
        } catch (error) {
          console.error("Failed to validate user from URL:", error)
        }
      }
    }

    initializeFromURL()
  }, [searchParams, router])

  // ✅ Auto-resize textarea for long messages
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [newMessage])

  // ✅ Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/sounds/message-notification.mp3')
    
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission === 'granted')
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // ✅ Play notification sound
  const playNotificationSound = () => {
    if (!soundEnabled) return
    
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          playFallbackSound()
        })
      } else {
        playFallbackSound()
      }
    } catch (error) {
      playFallbackSound()
    }
  }

  // ✅ Fallback notification sound
  const playFallbackSound = () => {
    if (!soundEnabled) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log("Could not play notification sound")
    }
  }

  // ✅ Show browser notification
  const showBrowserNotification = (message: string, sender: string) => {
    if (!notificationPermission || document.hasFocus()) return
    
    new Notification("New Message", {
      body: `${sender}: ${message}`,
      icon: "/favicon.ico",
      badge: "/favicon.ico"
    })
  }

  // ✅ Update URL when selected user changes
  const updateSelectedUser = (userId: string) => {
    setSelectedUserId(userId)
    
    const params = new URLSearchParams(searchParams.toString())
    if (userId) {
      params.set('user', userId)
    } else {
      params.delete('user')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  // ✅ Update ref on state changes
  useEffect(() => {
    currentStateRef.current = {
      currentUserId,
      selectedUserId,
      messages
    }
  }, [currentUserId, selectedUserId, messages])

  // ✅ Get current user ID only
  const initializeCurrentUser = async () => {
    try {
      const response = await api.get("/chat/me/current-user")
      const userData = response.data.user
      setCurrentUserId(userData.id.toString())
    } catch (error) {
      console.error("Failed to get current user:", error)
      try {
        const usersResponse = await api.get("/chat/users")
        if (usersResponse.data.currentUserId) {
          setCurrentUserId(usersResponse.data.currentUserId.toString())
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError)
      }
    }
  }

  // ✅ Get users list
  const fetchUsers = async () => {
    try {
      const response = await api.get("/chat/users")
      setUsers(response.data.users)
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Get messages for selected user
  const fetchMessages = async () => {
    if (!selectedUserId) return
    
    try {
      const response = await api.get(`/chat/${selectedUserId}`)
      setMessages(response.data.messages || [])
      
      if (response.data.messages?.length > 0) {
        await api.post(`/chat/${selectedUserId}/read`)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  // ✅ WebSocket connection
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`
    
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("✅ WebSocket connected")
      wsRef.current = ws
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error("Error parsing message:", error)
      }
    }

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected - reconnecting...")
      setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return ws
  }

  // ✅ Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    const { currentUserId, selectedUserId } = currentStateRef.current

    if (data.type === 'chat_message') {
      processIncomingMessage(data, currentUserId, selectedUserId)
    }
  }

  // ✅ Process incoming messages
  const processIncomingMessage = (data: any, currentUserId: string, selectedUserId: string) => {
    let messageData = data.data?.data || data.data || data

    if (!messageData.senderId || !messageData.content) return

    const senderId = messageData.senderId.toString()
    const receiverId = (messageData.receiverId || '').toString()

    const newMessage: Message = {
      id: messageData.messageId || `msg_${Date.now()}`,
      senderId: senderId,
      receiverId: receiverId,
      content: messageData.content,
      timestamp: messageData.timestamp || new Date().toISOString(),
      read: messageData.read || false,
      databaseId: messageData.databaseId
    }

    const isFromSelectedUser = Number(senderId) === Number(selectedUserId)
    const isToSelectedUser = Number(receiverId) === Number(selectedUserId)
    const involvesSelectedUser = isFromSelectedUser || isToSelectedUser

    if (involvesSelectedUser && selectedUserId) {
      setMessages(prev => {
        const isDuplicate = prev.some(msg => 
          msg.databaseId === newMessage.databaseId || 
          msg.id === newMessage.id
        )
        
        if (!isDuplicate) {
          if (senderId !== currentUserId) {
            playNotificationSound()
            const sender = users.find(u => u.id === senderId)
            showBrowserNotification(newMessage.content, sender?.username || 'Someone')
          }
          
          return [...prev, newMessage]
        }
        return prev
      })
    }
  }

  // ✅ Send message with better handling
  const sendMessage = async () => {
    const messageContent = newMessage.trim()
    if (!messageContent || !selectedUserId || sending || !currentUserId) return

    const tempId = `temp_${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      receiverId: selectedUserId,
      content: messageContent,
      timestamp: new Date().toISOString(),
      read: false,
      isSending: true
    }

    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")
    setSending(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await api.post(`/chat/${selectedUserId}`, {
        content: messageContent
      })

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, isSending: false } : msg
      ))

    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, isSending: false } : msg
      ))
    } finally {
      setSending(false)
    }
  }

  // ✅ Handle typing
  const handleTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !selectedUserId) return

    wsRef.current.send(JSON.stringify({
      type: isTyping ? 'typing_start' : 'typing_stop',
      receiverId: selectedUserId
    }))
  }

  // ✅ Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // ✅ Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ✅ Filter users
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ✅ Initialize everything
  useEffect(() => {
    const initializeApp = async () => {
      await initializeCurrentUser()
      await fetchUsers()
      connectWebSocket()
    }

    initializeApp()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // ✅ Fetch messages when user selected
  useEffect(() => {
    if (selectedUserId && currentUserId) {
      fetchMessages()
    }
  }, [selectedUserId, currentUserId])

  // ✅ Auto-scroll
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="container mx-auto h-screen max-w-7xl flex relative z-10">
        {/* Mobile Header */}
        {isMobile && selectedUser && (
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/20 z-50 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 flex-1 justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {selectedUser.profile_photo ? (
                    <img 
                      src={selectedUser.profile_photo} 
                      alt={selectedUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedUser.username.charAt(0).toUpperCase()
                  )}
                </div>
                <h2 className="text-white font-semibold text-sm truncate max-w-[120px]">
                  {selectedUser.username}
                </h2>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Overlay for Mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Users Sidebar */}
        <motion.div
          initial={false}
          animate={{ 
            x: isMobile && !sidebarOpen ? '-100%' : 0 
          }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className={`w-80 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col fixed md:relative z-40 h-full ${
            isMobile ? 'shadow-2xl' : ''
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={soundEnabled ? "Mute notifications" : "Enable notifications"}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="text-xs text-white/60 mb-2">
              User ID: {currentUserId || "Loading..."}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-200 ${
                  selectedUserId === user.id 
                    ? 'bg-purple-500/20 border-purple-400' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => updateSelectedUser(user.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {user.profile_photo ? (
                        <img 
                          src={user.profile_photo} 
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      user.is_online ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold truncate">{user.username}</h3>
                      {!user.is_online && (
                        <span className="text-xs text-white/60 flex items-center">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm truncate">{user.email}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-white/60">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white/5 backdrop-blur-lg ${
          isMobile ? 'pt-16' : ''
        }`}>
          {selectedUser ? (
            <>
              {/* Desktop Chat Header */}
              {!isMobile && (
                <div className="p-6 border-b border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                      {selectedUser.profile_photo ? (
                        <img 
                          src={selectedUser.profile_photo} 
                          alt={selectedUser.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        selectedUser.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">{selectedUser.username}</h2>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedUser.is_online 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-500 text-white'
                        }`}>
                          {selectedUser.is_online ? 'Online' : 'Offline'}
                        </span>
                        {typingUsers.has(selectedUser.id) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-purple-300 text-sm"
                          >
                            typing...
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages with FIXED BUBBLE SIZING */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
              >
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* FIXED: Properly constrained message bubble */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`max-w-[min(85%,_500px)] px-4 py-2 rounded-2xl relative ${
                          message.senderId === currentUserId
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/10 text-white backdrop-blur-lg shadow-lg'
                        } ${message.isSending ? 'opacity-70' : ''}`}
                        style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto'
                        }}
                      >
                        {/* Message bubble tail */}
                        {message.senderId === currentUserId ? (
                          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rotate-45 rounded-sm"></div>
                        ) : (
                          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white/10 backdrop-blur-lg rotate-45 rounded-sm"></div>
                        )}
                        
                        {/* Message content with proper text wrapping */}
                        <div className="relative z-10">
                          <p className="text-sm whitespace-pre-wrap break-words min-w-0">
                            {message.content}
                          </p>
                          
                          {/* Timestamp and status */}
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            message.senderId === currentUserId ? 'text-white/80' : 'text-white/60'
                          }`}>
                            <span className="text-xs whitespace-nowrap">
                              {new Date(message.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                              {message.isSending && ' (sending...)'}
                            </span>
                            {message.senderId === currentUserId && !message.isSending && (
                              <CheckCheck 
                                className={`w-3 h-3 flex-shrink-0 ${message.read ? 'text-blue-300' : 'text-white/60'}`} 
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input with Auto-resize Textarea */}
              <div className="p-4 md:p-6 border-t border-white/20">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping(true)
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleTyping(false)}
                    rows={1}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none min-h-[44px] max-h-[120px]"
                    style={{ height: 'auto' }}
                  />
                  
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending || !currentUserId}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg min-h-[44px]"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="text-xs text-white/40 mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
              <Users className="w-24 h-24 mb-6 opacity-50" />
              <h3 className="text-2xl font-bold mb-2 text-center">Select a conversation</h3>
              <p className="text-white/60 text-center mb-6">
                {isMobile ? 'Tap the menu icon to browse users' : 'Choose a user from the sidebar to start chatting'}
              </p>
              {isMobile && !sidebarOpen && (
                <motion.button
                  onClick={() => setSidebarOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Menu className="w-5 h-5" />
                  Browse Users
                </motion.button>
              )}
              <div className="mt-4 text-sm text-white/40 text-center">
                Current User ID: {currentUserId || "Loading..."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}