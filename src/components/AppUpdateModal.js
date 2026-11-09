import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  DownloadCloud,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react-native';
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

  // In-App Download States
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [downloadStats, setDownloadStats] = useState({ downloadedMB: '0.0', totalMB: '0.0' });
  const [downloadedUri, setDownloadedUri] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const checkUpdates = async (isManual = false) => {
    try {
      const res = await api.getAppConfig();
      if (res && res.ok && res.config) {
        const cfg = res.config;

        if (cfg.maintenance_mode) {
          setMaintenance(cfg.maintenance_message || 'Serverda texnik ishlar olib borilmoqda');
          return;
        }

        const latest = cfg.latest_version;
        if (latest && isNewerVersion(latest, CURRENT_APP_VERSION)) {
          setUpdateInfo({
            latestVersion: latest,
            currentVersion: CURRENT_APP_VERSION,
            updateUrl: cfg.update_url || 'https://darkmora.uz/uploads/DarkMora.apk?v=' + latest,
            forceUpdate: !!cfg.force_update,
            changelog: [
              'Ilova ichida to\'g\'ridan-to\'g\'ri yuklab olish va o\'rnatish',
              'Jonli video fonli yangi zamonaviy Login sahifasi (5-uslub)',
              'Shaxsiy galereyadan profil rasmini yuklash',
              'Autentifikatsiya va navigatsiya xatoliklari to\'liq tuzatildi',
            ],
          });
          setVisible(true);
        } else if (isManual) {
          Alert.alert(
            'Eng so\'nggi versiya',
            `Sizda DarkMora ilovasining eng so'nggi v${CURRENT_APP_VERSION} versiyasi o'rnatilgan.`
          );
        }
      }
    } catch (e) {
      if (isManual) {
        Alert.alert('Xatolik', 'Yangilanishlarni tekshirishda serverga ulanib bo\'lmadi.');
      }
    }
  };

  useEffect(() => {
    checkUpdates(false);

    // Manual check listener from ProfileScreen
    const sub = DeviceEventEmitter.addListener('CHECK_FOR_UPDATES', () => {
      checkUpdates(true);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const handleStartDownload = async () => {
    if (downloadedUri) {
      await handleInstallApk(downloadedUri);
      return;
    }

    setDownloading(true);
    setDownloadError('');
    setProgress(0);
    setDownloadStats({ downloadedMB: '0.0', totalMB: '90.0' });

    const url = updateInfo?.updateUrl || 'https://darkmora.uz/uploads/DarkMora.apk';
    const targetFile = `${FileSystem.cacheDirectory}DarkMora_v${updateInfo?.latestVersion || 'new'}.apk`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(targetFile);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetFile, { idempotent: true });
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        targetFile,
        {},
        (downloadProgress) => {
          const rawTotal = downloadProgress.totalBytesExpectedToWrite;
          const written = downloadProgress.totalBytesWritten;
          const total = rawTotal > 0 ? rawTotal : 93741023; // 89.4 MB fallback
          if (written > 0) {
            const p = Math.min(1, Math.max(0, written / total));
            setProgress(p);
            setDownloadStats({
              downloadedMB: (written / (1024 * 1024)).toFixed(1),
              totalMB: (total / (1024 * 1024)).toFixed(1),
            });
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result && result.uri) {
        setDownloading(false);
        setDownloadedUri(result.uri);
        setProgress(1);

        // Auto trigger native installer
        await handleInstallApk(result.uri);
      } else {
        throw new Error('Fayl to\'liq yuklanmadi');
      }
    } catch (e) {
      console.warn('In-app download error:', e);
      setDownloading(false);
      setDownloadError('Ilova ichida yuklab olishda nosozlik bo\'ldi. Brauzer orqali yuklab olishingiz mumkin.');
    }
  };

  const handleInstallApk = async (fileUri) => {
    setInstalling(true);
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.android.package-archive',
        });
      } else {
        Linking.openURL(updateInfo?.updateUrl || 'https://darkmora.uz/uploads/DarkMora.apk');
      }
    } catch (e) {
      console.warn('Direct package install error:', e);
      setDownloadError('O\'rnatuvchi oynani ochib bo\'lmadi. Iltimos brauzer orqali yuklab oling.');
    } finally {
      setInstalling(false);
    }
  };

  const handleBrowserFallback = () => {
    const url = updateInfo?.updateUrl || 'https://darkmora.uz/uploads/DarkMora.apk';
    Linking.openURL(url).catch(() => {});
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

  const percentInt = Math.round(progress * 100);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {!updateInfo.forceUpdate && !downloading && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textDim} />
            </TouchableOpacity>
          )}

          <View style={styles.iconWrap}>
            {downloadedUri ? (
              <CheckCircle2 size={34} color="#34d399" />
            ) : (
              <DownloadCloud size={32} color={colors.primaryGlow} />
            )}
          </View>

          <View style={styles.badge}>
            <Sparkles size={12} color={colors.primaryGlow} />
            <Text style={styles.badgeText}>YANGILANISH KELDI</Text>
          </View>

          <Text style={styles.title}>
            {downloadedUri ? 'Yuklab olindi!' : 'Yangi versiya mavjud!'}
          </Text>
          <Text style={styles.versionSub}>
            v{updateInfo.latestVersion} (Sizda: v{updateInfo.currentVersion})
          </Text>

          {/* Changelog list (only when not downloading) */}
          {!downloading && !downloadedUri && (
            <View style={styles.changelogBox}>
              {updateInfo.changelog.map((item, idx) => (
                <View key={idx} style={styles.changeItem}>
                  <Text style={styles.changeDot}>•</Text>
                  <Text style={styles.changeText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Downloading Progress Bar View */}
          {downloading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTopRow}>
                <Text style={styles.progressLabel}>Ilova ichida yuklanmoqda...</Text>
                <Text style={styles.progressPercent}>{percentInt}%</Text>
              </View>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percentInt}%` }]} />
              </View>

              <View style={styles.progressBottomRow}>
                <Text style={styles.progressBytes}>
                  {downloadStats.downloadedMB} MB / {downloadStats.totalMB} MB
                </Text>
                <ActivityIndicator size="small" color={colors.primaryGlow} />
              </View>
            </View>
          )}

          {/* Error notice */}
          {downloadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{downloadError}</Text>
              <TouchableOpacity
                style={styles.fallbackBrowserBtn}
                onPress={handleBrowserFallback}
                activeOpacity={0.8}
              >
                <ExternalLink size={14} color={colors.primaryGlow} />
                <Text style={styles.fallbackBrowserText}>Brauzer orqali yuklab olish</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Main Action Button */}
          {!downloading && (
            <TouchableOpacity
              style={[
                styles.updateBtn,
                downloadedUri && styles.installBtn,
              ]}
              onPress={handleStartDownload}
              activeOpacity={0.85}
              disabled={installing}
            >
              {installing ? (
                <ActivityIndicator color="#fff" />
              ) : downloadedUri ? (
                <>
                  <CheckCircle2 size={18} color="#fff" />
                  <Text style={styles.updateBtnText}>Hozir o'rnatish (Install)</Text>
                </>
              ) : (
                <>
                  <DownloadCloud size={18} color="#fff" />
                  <Text style={styles.updateBtnText}>Ilova ichida yangilash</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {!updateInfo.forceUpdate && !downloading && (
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
  progressContainer: {
    width: '100%',
    backgroundColor: 'rgba(10, 14, 24, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    color: colors.primaryGlow,
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  progressBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBytes: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  fallbackBrowserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  fallbackBrowserText: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '700',
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
  installBtn: {
    backgroundColor: '#059669',
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
