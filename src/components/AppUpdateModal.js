import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { DownloadCloud, Sparkles, X, AlertTriangle } from 'lucide-react-native';
import { api } from '../api/client';
import { colors } from '../theme/colors';

export const CURRENT_APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export const isNewerVersion = (latest, current) => {
  if (!latest || !current) return false;
  const lParts = String(latest).split('.').map((n) => parseInt(n, 10) || 0);
  const cParts = String(current).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

export default function AppUpdateModal() {
  const [visible, setVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [maintenance, setMaintenance] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkUpdates = async () => {
      try {
        const res = await api.getAppConfig();
        if (!isMounted) return;

        if (res && res.ok && res.config) {
          const cfg = res.config;

          // Check maintenance mode
          if (cfg.maintenance_mode) {
            setMaintenance(cfg.maintenance_message || 'Serverda texnik ishlar olib borilmoqda');
            return;
          }

          // Check version
          const latest = cfg.latest_version;
          if (latest && isNewerVersion(latest, CURRENT_APP_VERSION)) {
            setUpdateInfo({
              latestVersion: latest,
              currentVersion: CURRENT_APP_VERSION,
              updateUrl: cfg.update_url || 'https://darkmora.uz/uploads/DarkMora.apk',
              forceUpdate: !!cfg.force_update,
              changelog: [
                'Jonli video fonli yangi zamonaviy Login sahifasi (5-uslub)',
                'Shaxsiy galereyadan profil rasmini yuklash',
                'Autentifikatsiya va navigatsiya xatoliklari tuzatildi',
                'Ilova tezligi va barqarorligi oshirildi',
              ],
            });
            setVisible(true);
          }
        }
      } catch (e) {
        console.warn('App update check failed:', e);
      }
    };

    checkUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = () => {
    const url = updateInfo?.updateUrl || 'https://darkmora.uz/uploads/DarkMora.apk';
    Linking.openURL(url).catch((err) => {
      console.warn('Could not open update URL:', err);
    });
  };

  if (maintenance) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <AlertTriangle size={32} color={colors.rating} />
            </View>
            <Text style={styles.title}>Texnik ishlar</Text>
            <Text style={styles.desc}>{maintenance}</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible || !updateInfo) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {!updateInfo.forceUpdate && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textDim} />
            </TouchableOpacity>
          )}

          <View style={styles.iconWrap}>
            <DownloadCloud size={32} color={colors.primaryGlow} />
          </View>

          <View style={styles.badge}>
            <Sparkles size={12} color={colors.primaryGlow} />
            <Text style={styles.badgeText}>YANGILANISH KELDI</Text>
          </View>

          <Text style={styles.title}>Yangi versiya mavjud!</Text>
          <Text style={styles.versionSub}>
            v{updateInfo.latestVersion} (Sizda: v{updateInfo.currentVersion})
          </Text>

          <Text style={styles.desc}>
            Ilovaning yangi imkoniyatlaridan to'liq foydalanish uchun so'nggi versiyaga yangilang:
          </Text>

          {/* Changelog list */}
          <View style={styles.changelogBox}>
            {updateInfo.changelog.map((item, idx) => (
              <View key={idx} style={styles.changeItem}>
                <Text style={styles.changeDot}>•</Text>
                <Text style={styles.changeText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Update Action Button */}
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={handleUpdate}
            activeOpacity={0.85}
          >
            <DownloadCloud size={18} color="#fff" />
            <Text style={styles.updateBtnText}>Hozir yangilash (APK)</Text>
          </TouchableOpacity>

          {!updateInfo.forceUpdate && (
            <TouchableOpacity
              style={styles.laterBtn}
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.laterBtnText}>Keyinroq</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    shadowColor: '#1d68f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 104, 246, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29, 104, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.primaryGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  versionSub: {
    fontSize: 13,
    color: colors.textDim,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  changelogBox: {
    width: '100%',
    backgroundColor: 'rgba(10, 14, 24, 0.7)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
    gap: 6,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  changeDot: {
    color: colors.primaryGlow,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  changeText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 12,
    lineHeight: 18,
  },
  updateBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1d68f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  laterBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  laterBtnText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
