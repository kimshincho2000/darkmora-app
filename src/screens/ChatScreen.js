import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  ChevronLeft,
  Send,
  MessageCircle,
  Tv,
  Users,
  Mic,
  MicOff,
  Plus,
  Play,
  Pause,
  Clock,
  Sparkles,
  Lock,
  Radio,
  ArrowRight,
  LogIn,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api, toAbsoluteUrl } from '../api/client';

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'party'
  const [chatEnabled, setChatEnabled] = useState(true);
  const [partyEnabled, setPartyEnabled] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Watch Party State
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Create Room Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomAnimeNom, setRoomAnimeNom] = useState('');
  const [roomQism, setRoomQism] = useState('1');
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Active Joined Room State (Watch Party Room)
  const [activeRoom, setActiveRoom] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [roomChatMessages, setRoomChatMessages] = useState([]);
  const [roomInputText, setRoomInputText] = useState('');

  // 1. Check feature flags from config
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAppConfig();
        if (res?.ok && res?.config) {
          if (res.config.chat_enabled !== undefined) setChatEnabled(Boolean(res.config.chat_enabled));
          if (res.config.watch_party_enabled !== undefined) setPartyEnabled(Boolean(res.config.watch_party_enabled));
        }
      } catch (e) {
        console.warn('config load error:', e);
      }
    })();
  }, []);

  // 2. Fetch Chat Messages
  const loadMessages = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoadingMessages(true);
      const res = await api.chatGetMessages('global', 60);
      if (res?.ok && res?.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (e) {
      console.warn('loadMessages error:', e);
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  }, []);

  // 3. Fetch Watch Party Rooms
  const loadRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await api.watchPartyList();
      if (res?.ok && res?.data?.rooms) {
        setRooms(res.data.rooms);
      }
    } catch (e) {
      console.warn('loadRooms error:', e);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Real-time polling
  useEffect(() => {
    if (activeTab === 'chat' && chatEnabled) {
      loadMessages();
      pollTimerRef.current = setInterval(() => {
        loadMessages(true);
      }, 3000);
    } else if (activeTab === 'party' && partyEnabled) {
      loadRooms();
      pollTimerRef.current = setInterval(() => {
        loadRooms();
      }, 5000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeTab, chatEnabled, partyEnabled, loadMessages, loadRooms]);

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!user) {
      Alert.alert('Kirish talab etiladi', 'Xabar yozish uchun avval hisobingizga kiring.', [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Kirish', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInputText('');
    try {
      const res = await api.chatSendMessage(trimmed, 'global');
      if (res?.ok && res?.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Xato', res?.error || 'Xabarni yuborib bo\'lmadi');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setSending(false);
    }
  };

  // Handle Create Watch Party Room
  const handleCreateRoom = async () => {
    if (!user) {
      Alert.alert('Kirish talab etiladi', 'Xona ochish uchun hisobingizga kiring.', [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Kirish', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (!roomAnimeNom.trim()) {
      Alert.alert('Xato', 'Anime nomini kiriting');
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await api.watchPartyCreate({
        anime_id: 1,
        anime_nom: roomAnimeNom.trim(),
        title: roomTitle.trim() || `${user.display_name || user.username} xonasi`,
        qism: parseInt(roomQism, 10) || 1,
        voice_enabled: true,
      });

      if (res?.ok && res?.data) {
        setCreateModalVisible(false);
        setRoomAnimeNom('');
        setRoomTitle('');
        Alert.alert('Muvaffaqiyatli', `Xona ochildi! Xona kodi: ${res.data.room_code}`);
        loadRooms();
      } else {
        Alert.alert('Xato', res?.error || 'Xona ochishda xato');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  // Handle Join Watch Party
  const handleJoinByCode = async (codeToJoin) => {
    const code = (codeToJoin || joinCode).trim().toUpperCase();
    if (!code) {
      Alert.alert('Xato', 'Xona kodini kiriting (masalan: DM1234)');
      return;
    }

    setJoining(true);
    try {
      const res = await api.watchPartyJoin(code);
      if (res?.ok && res?.data) {
        setActiveRoom(res.data);
        setJoinCode('');
      } else {
        Alert.alert('Xato', res?.error || 'Xonaga ulanib bo\'lmadi');
      }
    } catch (e) {
      Alert.alert('Xato', e.message);
    } finally {
      setJoining(false);
    }
  };

  // ================= RENDER CHAT ITEM (TELEGRAM STYLE) =================
  const renderMessageItem = ({ item }) => {
    const isMe = item.is_me;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <Image
            source={{
              uri: item.sender_photo || 'https://darkmora.uz/uploads/avatars/presets/luffy.jpg',
            }}
            style={styles.msgAvatar}
          />
        )}
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          {!isMe && (
            <Text style={styles.msgSenderName} numberOfLines={1}>
              {item.sender_name || 'Foydalanuvchi'}
            </Text>
          )}
          <Text style={styles.msgText}>{item.message}</Text>
          <View style={styles.msgMetaRow}>
            <Text style={styles.msgTime}>{item.created_at || '18:00'}</Text>
            {isMe && <CheckCheck size={13} color="#38bdf8" style={{ marginLeft: 3 }} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0e14" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>DarkMora Hamjamiyat</Text>
            <View style={styles.betaTag}>
              <Text style={styles.betaTagText}>BETA</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            {activeTab === 'chat' ? '💬 Umumiy Jonli Suhbat' : '🍿 Do\'stlar bilan birga ko\'rish'}
          </Text>
        </View>
      </View>

      {/* Segmented Top Switcher */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'chat' && styles.tabBtnActive]}
          onPress={() => setActiveTab('chat')}
        >
          <MessageCircle size={16} color={activeTab === 'chat' ? colors.primaryGlow : colors.textDim} />
          <Text style={[styles.tabBtnText, activeTab === 'chat' && styles.tabBtnTextActive]}>
            Jonli Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'party' && styles.tabBtnActive]}
          onPress={() => setActiveTab('party')}
        >
          <Tv size={16} color={activeTab === 'party' ? '#fbbf24' : colors.textDim} />
          <Text style={[styles.tabBtnText, activeTab === 'party' && { color: '#fbbf24', fontWeight: '800' }]}>
            Watch Party
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= TAB 1: JONLI CHAT (TELEGRAM USLUBIDA) ================= */}
      {activeTab === 'chat' && (
        !chatEnabled ? (
          <View style={styles.disabledBox}>
            <Lock size={36} color="#ef4444" />
            <Text style={styles.disabledTitle}>Jonli Chat Vaqtincha O'chirilgan</Text>
            <Text style={styles.disabledSub}>Admin tomonidan test rejimi to'xtatildi.</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {loadingMessages ? (
              <ActivityIndicator size="large" color={colors.primaryGlow} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messagesListContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={() => (
                  <View style={styles.emptyWrap}>
                    <MessageCircle size={40} color={colors.textDim} />
                    <Text style={styles.emptyText}>Hozircha xabarlar yo'q.</Text>
                    <Text style={styles.emptySub}>Birinchi bo'lib suhbatni boshlang!</Text>
                  </View>
                )}
              />
            )}

            {/* Bottom Message Input Bar */}
            {user ? (
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.chatInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Xabar yozing..."
                  placeholderTextColor={colors.textDim}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.guestBar}>
                <Text style={styles.guestBarText}>Suhbatda qatnashish uchun kiring</Text>
                <TouchableOpacity
                  style={styles.guestLoginBtn}
                  onPress={() => navigation.navigate('Login')}
                >
                  <LogIn size={14} color="#fff" />
                  <Text style={styles.guestLoginText}>Kirish</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        )
      )}

      {/* ================= TAB 2: WATCH PARTY (DISCORD USLUBIDA) ================= */}
      {activeTab === 'party' && (
        !partyEnabled ? (
          <View style={styles.disabledBox}>
            <Lock size={36} color="#fbbf24" />
            <Text style={styles.disabledTitle}>Watch Party Vaqtincha O'chirilgan</Text>
            <Text style={styles.disabledSub}>Admin tomonidan test rejimi to'xtatildi.</Text>
          </View>
        ) : (
          <ScrollView style={styles.partyContainer} showsVerticalScrollIndicator={false}>
            {/* Action Banner */}
            <View style={styles.partyBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partyBannerTitle}>🍿 Birga Tomosha Qilish</Text>
                <Text style={styles.partyBannerSub}>
                  Do'stlaringiz bilan bitta xonada animeni sinxron ko'ring va ovozli suhbatlashing!
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createRoomBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={16} color="#000" />
                <Text style={styles.createRoomBtnText}>Xona Ochish</Text>
              </TouchableOpacity>
            </View>

            {/* Join with Code Card */}
            <View style={styles.joinCard}>
              <Text style={styles.joinCardLabel}>Xona kodi bilan ulanish:</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Masalan: DM7890"
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.joinSubmitBtn}
                  onPress={() => handleJoinByCode()}
                  disabled={joining}
                >
                  {joining ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.joinSubmitText}>Ulanish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Active Rooms Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Faol Xonalar ({rooms.length})</Text>
              <TouchableOpacity onPress={loadRooms}>
                <Text style={styles.refreshLink}>Yangilash</Text>
              </TouchableOpacity>
            </View>

            {loadingRooms ? (
              <ActivityIndicator size="small" color={colors.primaryGlow} style={{ marginTop: 20 }} />
            ) : rooms.length === 0 ? (
              <View style={styles.emptyRoomsBox}>
                <Tv size={36} color={colors.textDim} />
                <Text style={styles.emptyRoomsText}>Hozirda ochiq xonalar mavjud emas</Text>
                <Text style={styles.emptyRoomsSub}>Birinchi bo'lib do'stlaringiz uchun xona oching!</Text>
              </View>
            ) : (
              rooms.map((room) => (
                <View key={String(room.id)} style={styles.roomCard}>
                  <View style={styles.roomIconWrap}>
                    <Radio size={22} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.roomTitle} numberOfLines={1}>{room.title}</Text>
                    <Text style={styles.roomAnime} numberOfLines={1}>
                      🎬 {room.anime_nom} • {room.qism}-qism
                    </Text>
                    <View style={styles.roomBadgeRow}>
                      <View style={styles.roomBadge}>
                        <Users size={12} color={colors.primaryGlow} />
                        <Text style={styles.roomBadgeText}>{room.members_count} a'zo</Text>
                      </View>
                      {room.voice_enabled && (
                        <View style={[styles.roomBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                          <Mic size={12} color="#4ade80" />
                          <Text style={[styles.roomBadgeText, { color: '#4ade80' }]}>Ovozli</Text>
                        </View>
                      )}
                      <Text style={styles.roomCodeBadge}>Kod: {room.room_code}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.roomJoinBtn}
                    onPress={() => handleJoinByCode(room.room_code)}
                  >
                    <Text style={styles.roomJoinBtnText}>Kirish</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        )
      )}

      {/* ================= MODAL: CREATE ROOM ================= */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yangi Watch Party Ochish</Text>
            <Text style={styles.modalSub}>Do'stlaringiz bilan birga tomosha qiling</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Anime nomi *</Text>
              <TextInput
                style={styles.textInput}
                value={roomAnimeNom}
                onChangeText={setRoomAnimeNom}
                placeholder="Masalan: Solo Leveling"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Qism raqami</Text>
                <TextInput
                  style={styles.textInput}
                  value={roomQism}
                  onChangeText={setRoomQism}
                  placeholder="1"
                  placeholderTextColor={colors.textDim}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 2, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Xona sarlavhasi (ixtiyoriy)</Text>
                <TextInput
                  style={styles.textInput}
                  value={roomTitle}
                  onChangeText={setRoomTitle}
                  placeholder="Birga ko'ramiz"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateRoom}
                disabled={creatingRoom}
              >
                {creatingRoom ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.modalSaveText}>Xona Ochish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: INSIDE ACTIVE WATCH PARTY ROOM ================= */}
      <Modal visible={!!activeRoom} animationType="fade" transparent={false}>
        <SafeAreaView style={styles.activeRoomContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#07090e" />

          {/* Active Room Header */}
          <View style={styles.activeRoomHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveRoom(null)}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.activeRoomAnimeTitle} numberOfLines={1}>
                {activeRoom?.anime_nom} • {activeRoom?.qism}-qism
              </Text>
              <Text style={styles.activeRoomKod}>
                Xona Kodi: <Text style={{ color: '#fbbf24', fontWeight: '800' }}>{activeRoom?.room_code}</Text> • {activeRoom?.members_count} kishi
              </Text>
            </View>

            {/* Microphone Toggle (Discord style) */}
            <TouchableOpacity
              style={[styles.micBtn, isMicOn ? styles.micBtnOn : styles.micBtnOff]}
              onPress={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic size={18} color="#fff" /> : <MicOff size={18} color="#ef4444" />}
            </TouchableOpacity>
          </View>

          {/* Video Placeholder Player Box */}
          <View style={styles.syncPlayerBox}>
            <Tv size={48} color={colors.primaryGlow} />
            <Text style={styles.syncPlayerText}>Sinxron Video Oqimi Faol</Text>
            <View style={styles.syncBadge}>
              <Radio size={12} color="#4ade80" />
              <Text style={styles.syncBadgeText}>Jonli Do'stlar Oqimi (P2P)</Text>
            </View>
          </View>

          {/* Inside Room Chat */}
          <View style={styles.roomChatWrap}>
            <Text style={styles.roomChatHeader}>Xona Suhbatlari (Live Chat)</Text>
            <FlatList
              data={roomChatMessages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <View style={styles.roomChatItem}>
                  <Text style={styles.roomChatUser}>{item.user}: </Text>
                  <Text style={styles.roomChatMsg}>{item.text}</Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.roomChatEmpty}>Hali xabar yo'q. Birinchi bo'lib yozing!</Text>
              )}
            />
            <View style={styles.roomChatInputRow}>
              <TextInput
                style={styles.roomChatInput}
                value={roomInputText}
                onChangeText={setRoomInputText}
                placeholder="Fikr qoldiring..."
                placeholderTextColor={colors.textDim}
              />
              <TouchableOpacity
                style={styles.roomChatSendBtn}
                onPress={() => {
                  if (!roomInputText.trim()) return;
                  setRoomChatMessages((prev) => [
                    ...prev,
                    { user: user?.display_name || user?.username || 'Men', text: roomInputText.trim() },
                  ]);
                  setRoomInputText('');
                }}
              >
                <Send size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0e14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0b0e14',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  betaTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  betaTagText: {
    fontSize: 9,
    color: '#fbbf24',
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primaryGlow,
    backgroundColor: 'rgba(29, 104, 246, 0.1)',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
  },
  tabBtnTextActive: {
    color: colors.primaryGlow,
    fontWeight: '800',
  },

  // Telegram Style Messages
  messagesListContent: {
    padding: 14,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 2,
    backgroundColor: '#1e293b',
  },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  msgBubbleMe: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  msgSenderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 3,
  },
  msgText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 19,
  },
  msgMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  msgTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0f172a',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  guestBarText: {
    fontSize: 12,
    color: colors.textDim,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guestLoginText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },

  // Watch Party
  partyContainer: {
    flex: 1,
    padding: 16,
  },
  partyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  partyBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fbbf24',
  },
  partyBannerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    lineHeight: 16,
  },
  createRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createRoomBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  joinCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 20,
  },
  joinCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    marginBottom: 8,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    color: '#fff',
    fontWeight: '700',
  },
  joinSubmitBtn: {
    backgroundColor: colors.primaryGlow,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  refreshLink: {
    fontSize: 12,
    color: colors.primaryGlow,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginBottom: 10,
  },
  roomIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  roomAnime: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  roomCodeBadge: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: '700',
    marginLeft: 4,
  },
  roomJoinBtn: {
    backgroundColor: 'rgba(29, 104, 246, 0.2)',
    borderColor: colors.primaryGlow,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomJoinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryGlow,
  },
  emptyRoomsBox: {
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  emptyRoomsText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  emptyRoomsSub: {
    fontSize: 11,
    color: colors.textDim,
  },
  disabledBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  disabledTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  disabledSub: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    color: colors.textDim,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#121824',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 16,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },

  // Active Room Screen (Discord Style)
  activeRoomContainer: {
    flex: 1,
    backgroundColor: '#07090e',
  },
  activeRoomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeRoomAnimeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  activeRoomKod: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnOn: {
    backgroundColor: '#22c55e',
  },
  micBtnOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  syncPlayerBox: {
    height: 200,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  syncPlayerText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  syncBadgeText: {
    fontSize: 11,
    color: '#4ade80',
    fontWeight: '600',
  },
  roomChatWrap: {
    flex: 1,
    padding: 12,
  },
  roomChatHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
    marginBottom: 8,
  },
  roomChatItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  roomChatUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  roomChatMsg: {
    fontSize: 12,
    color: '#fff',
    flex: 1,
  },
  roomChatEmpty: {
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 20,
  },
  roomChatInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  roomChatInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 13,
  },
  roomChatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
