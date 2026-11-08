import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
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
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const openTelegram = () => {
    Linking.openURL('https://t.me/anirateuzrobot').catch(() => {});
  };

  const openWebsite = () => {
    Linking.openURL('https://darkmora.uz').catch(() => {});
  };

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
            <User size={32} color={colors.primaryGlow} />
          </View>
          <View style={{ flex: 1 }}>
            {user ? (
              <>
                <Text style={styles.userName}>{user.username || user.name || 'Foydalanuvchi'}</Text>
                <Text style={styles.userEmail}>{user.email || 'DarkMora a\'zosi'}</Text>
              </>
            ) : (
              <>
                <Text style={styles.userName}>Mehmon</Text>
                <Text style={styles.userEmail}>Barcha imkoniyatlar uchun kiring</Text>
              </>
            )}
          </View>

          {!user && (
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 104, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
