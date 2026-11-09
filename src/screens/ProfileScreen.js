import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  LogIn,
  Send,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  X,
  Check,
  Lock,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { toAbsoluteUrl } from '../api/client';

const AVATAR_PRESETS = [
  { name: 'Luffy', url: 'https://darkmora.uz/uploads/avatars/presets/luffy.jpg' },
  { name: 'Zoro', url: 'https://darkmora.uz/uploads/avatars/presets/zoro.jpg' },
  { name: 'Gojo', url: 'https://darkmora.uz/uploads/avatars/presets/gojo.jpg' },
  { name: 'Naruto', url: 'https://darkmora.uz/uploads/avatars/presets/naruto.jpg' },
  { name: 'Tanjiro', url: 'https://darkmora.uz/uploads/avatars/presets/tanjiro.png' },
  { name: 'Sasuke', url: 'https://darkmora.uz/uploads/avatars/presets/sasuke.jpg' },
  { name: 'Killua', url: 'https://darkmora.uz/uploads/avatars/presets/killua.jpg' },
  { name: 'Sukuna', url: 'https://darkmora.uz/uploads/avatars/presets/sukuna.png' },
  { name: 'Anya', url: 'https://darkmora.uz/uploads/avatars/presets/anya.png' },
  { name: 'Nezuko', url: 'https://darkmora.uz/uploads/avatars/presets/nezuko.png' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [pickedImageBase64, setPickedImageBase64] = useState('');
  const [pickedImageUri, setPickedImageUri] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const openEditModal = () => {
    if (!user) return;
    setDisplayName(user.display_name || user.username || '');
    setSelectedAvatarUrl(user.photo_url ? toAbsoluteUrl(user.photo_url) : '');
    setCustomAvatarUrl('');
    setPickedImageBase64('');
    setPickedImageUri('');
    setNewPassword('');
    setEditError('');
    setEditSuccess('');
    setEditModalVisible(true);
  };

  const pickImageFromGallery = async () => {
    setEditError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setEditError('Galereyadan rasm tanlash uchun ruxsat berilmadi. Sozlamalardan ruxsat bering.');
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
        allowsEditing: false, // Android crop intent nosozliklarining oldini olish uchun
        quality: 0.7,
        base64: true,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedImageUri(asset.uri);
        setPickedImageBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : '');
        setSelectedAvatarUrl('');
        setCustomAvatarUrl('');
      }
    } catch (e) {
      console.warn('Gallery pick error:', e);
      setEditError(`Galereyadan tanlashda xatolik: ${e?.message || 'Qurilma rad etdi'}`);
    }
  };

  const handleSaveProfile = async () => {
    setEditError('');
    setEditSuccess('');
    setSaving(true);
    try {
      const finalAvatar = customAvatarUrl.trim() || selectedAvatarUrl || (user?.photo_url ? toAbsoluteUrl(user.photo_url) : '');
      const res = await updateProfile({
        displayName: displayName.trim(),
        photoUrl: pickedImageBase64 ? undefined : finalAvatar,
        photoBase64: pickedImageBase64 || undefined,
        password: newPassword ? newPassword.trim() : undefined,
      });

      if (res && res.ok) {
        setEditSuccess('Profil ma\'lumotlari muvaffaqiyatli saqlandi!');
        setTimeout(() => {
          setEditModalVisible(false);
        }, 800);
      } else {
        setEditError(res?.error || 'Saqlashda xatolik yuz berdi');
      }
    } catch (e) {
      setEditError('Server bilan aloqada xatolik');
    } finally {
      setSaving(false);
    }
  };

  const openTelegram = () => {
    Linking.openURL('https://t.me/anirateuzrobot').catch(() => {});
  };

  const openWebsite = () => {
    Linking.openURL('https://darkmora.uz').catch(() => {});
  };

  const userPhotoUri = user?.photo_url ? toAbsoluteUrl(user.photo_url) : null;
  const userInitial = user?.display_name
    ? user.display_name.charAt(0).toUpperCase()
    : (user?.username?.charAt(0).toUpperCase() || 'U');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mening profilim</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            {userPhotoUri ? (
              <Image source={{ uri: userPhotoUri }} style={styles.avatarImage} />
            ) : user ? (
              <View style={styles.initialFallback}>
                <Text style={styles.initialText}>{userInitial}</Text>
              </View>
            ) : (
              <User size={32} color={colors.primaryGlow} />
            )}
          </View>

          <View style={{ flex: 1 }}>
            {user ? (
              <>
                <Text style={styles.userName}>{user.display_name || user.username || 'Foydalanuvchi'}</Text>
                <Text style={styles.userEmail}>{user.email || user.phone || 'DarkMora a\'zosi'}</Text>
              </>
            ) : (
              <>
                <Text style={styles.userName}>Mehmon</Text>
                <Text style={styles.userEmail}>Barcha imkoniyatlar uchun kiring</Text>
              </>
            )}
          </View>

          {user ? (
            <TouchableOpacity
              style={styles.editBtnSmall}
              onPress={openEditModal}
            >
              <Edit3 size={14} color="#fff" />
              <Text style={styles.editBtnText}>Tahrirlash</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginBtnSmall}
              onPress={() => navigation.navigate('Login')}
            >
              <LogIn size={14} color="#fff" />
              <Text style={styles.loginBtnText}>Kirish</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Aloqa va Tarmoqlar</Text>

          <TouchableOpacity style={styles.menuItem} onPress={openTelegram}>
            <View style={[styles.menuIconBg, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Send size={18} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Telegram Bot</Text>
              <Text style={styles.menuItemSub}>@anirateuzrobot orqali yuklab olish</Text>
            </View>
            <ChevronRight size={16} color={colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={openWebsite}>
            <View style={[styles.menuIconBg, { backgroundColor: 'rgba(29, 104, 246, 0.15)' }]}>
              <Globe size={18} color={colors.primaryGlow} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Veb-sayt</Text>
              <Text style={styles.menuItemSub}>darkmora.uz rasmiy portali</Text>
            </View>
            <ChevronRight size={16} color={colors.textDim} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Ilova haqida</Text>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <HelpCircle size={18} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>Versiya</Text>
              <Text style={styles.menuItemSub}>1.0.0 (Native Release)</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconBg, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Shield size={18} color={colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuItemTitle}>DarkMora Studio</Text>
              <Text style={styles.menuItemSub}>O'zbek dublyaj studiyasi & platformasi</Text>
            </View>
          </View>
        </View>

        {user && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={16} color={colors.error} />
            <Text style={styles.logoutText}>Hisobdan chiqish</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profilni tahrirlash</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {editError ? <Text style={styles.modalError}>{editError}</Text> : null}
              {editSuccess ? <Text style={styles.modalSuccess}>{editSuccess}</Text> : null}

              {/* Avatar Preview */}
              <View style={styles.avatarPreviewWrap}>
                <View style={styles.modalAvatarCircle}>
                  {pickedImageUri ? (
                    <Image
                      source={{ uri: pickedImageUri }}
                      style={styles.modalAvatarImg}
                    />
                  ) : customAvatarUrl.trim() || selectedAvatarUrl ? (
                    <Image
                      source={{ uri: toAbsoluteUrl(customAvatarUrl.trim() || selectedAvatarUrl) }}
                      style={styles.modalAvatarImg}
                    />
                  ) : (
                    <User size={40} color={colors.primaryGlow} />
                  )}
                </View>
                <Text style={styles.avatarPreviewLabel}>Profil rasmini o'zgartiring</Text>

                {/* Gallery Picker Button */}
                <TouchableOpacity
                  style={styles.galleryPickBtn}
                  onPress={pickImageFromGallery}
                  activeOpacity={0.85}
                >
                  <UploadCloud size={18} color="#fff" />
                  <Text style={styles.galleryPickBtnText}>📁 Shaxsiy galereyadan rasm tanlash</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Yoki anime qahramonlari avatari:</Text>

              {/* Avatar Presets Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsList}
              >
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatarUrl === preset.url && !customAvatarUrl && !pickedImageUri;
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetItem, isSelected && styles.presetItemActive]}
                      onPress={() => {
                        setSelectedAvatarUrl(preset.url);
                        setCustomAvatarUrl('');
                        setPickedImageUri('');
                        setPickedImageBase64('');
                      }}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImg} />
                      {isSelected && (
                        <View style={styles.presetCheck}>
                          <Check size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Custom Photo URL Input */}
              <Text style={styles.inputLabel}>Yoki rasm havolasini kiriting (URL)</Text>
              <View style={styles.modalInputBox}>
                <ImageIcon size={16} color={colors.textDim} />
                <TextInput
                  placeholder="https://... rasm havolasi"
                  placeholderTextColor={colors.textDim}
                  style={styles.modalInput}
                  value={customAvatarUrl}
                  onChangeText={(val) => {
                    setCustomAvatarUrl(val);
                    if (val) setSelectedAvatarUrl('');
                  }}
                  autoCapitalize="none"
                />
              </View>

              {/* Display Name */}
              <Text style={styles.inputLabel}>Ism (Taxallus)</Text>
              <View style={styles.modalInputBox}>
                <User size={16} color={colors.textDim} />
                <TextInput
                  placeholder="Ismingizni kiriting"
                  placeholderTextColor={colors.textDim}
                  style={styles.modalInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>

              {/* Password */}
              <Text style={styles.inputLabel}>Yangi parol (o'zgartirish ixtiyoriy)</Text>
              <View style={styles.modalInputBox}>
                <Lock size={16} color={colors.textDim} />
                <TextInput
                  placeholder="Bo'sh qoldirilsa o'zgarmaydi"
                  placeholderTextColor={colors.textDim}
                  style={styles.modalInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.modalSaveBtn}
                activeOpacity={0.85}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveText}>Saqlash</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(29, 104, 246, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  initialFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  editBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29, 104, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '700',
  },
  loginBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    marginBottom: 8,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemSub: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f1118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '90%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalError: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 12,
  },
  modalSuccess: {
    color: '#34d399',
    fontSize: 13,
    marginBottom: 12,
  },
  avatarPreviewWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primaryGlow,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    marginBottom: 8,
  },
  modalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPreviewLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  galleryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(29, 104, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  galleryPickBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  presetsList: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 16,
  },
  presetItem: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  presetItemActive: {
    borderColor: colors.primaryGlow,
    transform: [{ scale: 1.05 }],
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
    gap: 10,
  },
  modalInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
