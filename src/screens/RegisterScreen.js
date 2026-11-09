import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import {
  ChevronLeft,
  Lock,
  Mail,
  User,
  Phone,
  KeyRound,
  Send,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function RegisterScreen({ navigation }) {
  const { refreshUser } = useAuth();

  // Mode: 'email' | 'phone'
  const [mode, setMode] = useState('email');

  // Steps: 1 (input info), 2 (verify code)
  const [step, setStep] = useState(1);

  // Common inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Email mode inputs
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');

  // Phone mode inputs
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [botUrl, setBotUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pollIntervalRef = useRef(null);

  // Auto-polling for phone verification status from Telegram bot
  useEffect(() => {
    if (mode === 'phone' && step === 2 && phoneToken) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await api.checkPhoneStatus(phoneToken);
          if (res?.ok && res.code_sent) {
            setSuccess('✅ Bot sizga kodni yubordi!');
            if (res.code) {
              setPhoneCode(String(res.code));
            }
          }
        } catch (e) {}
      }, 3000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [mode, step, phoneToken]);

  // ================= EMAIL FLOW =================
  const handleEmailStep1 = async () => {
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('Foydalanuvchi nomini kiriting');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('To\'g\'ri email manzilini kiriting');
      return;
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendEmailCode(email.trim());
      if (res && res.ok) {
        setStep(2);
        setSuccess(`Tasdiqlash kodi ${email.trim()} manziliga yuborildi`);
      } else {
        setError(res?.error || 'Kodni yuborishda xatolik');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailStep2 = async () => {
    setError('');
    setSuccess('');
    if (!emailCode.trim()) {
      setError('Tasdiqlash kodini kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await api.emailRegister({
        email: email.trim(),
        code: emailCode.trim(),
        password,
        displayName: username.trim(),
        username: username.trim(),
      });
      if (res && res.ok) {
        setSuccess('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!');
        await refreshUser();
        setTimeout(() => {
          navigation.popToTop();
        }, 1000);
      } else {
        setError(res?.error || 'Tasdiqlashda xatolik yuz berdi');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  // ================= PHONE FLOW =================
  const handlePhoneStep1 = async () => {
    setError('');
    setSuccess('');
    if (!username.trim()) {
      setError('Foydalanuvchi nomini kiriting');
      return;
    }
    if (!phone.trim()) {
      setError('Telefon raqamingizni kiriting');
      return;
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const res = await api.initPhoneRegister({
        phone: phone.trim(),
        username: username.trim(),
        password,
      });
      if (res && res.ok) {
        setPhoneToken(res.token);
        if (res.bot_url) setBotUrl(res.bot_url);
        setStep(2);
        setSuccess('Kodni olish uchun botga o\'tib kontaktni yuboring');
      } else {
        setError(res?.error || 'Xatolik yuz berdi');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneStep2 = async () => {
    setError('');
    setSuccess('');
    if (!phoneCode.trim()) {
      setError('Bot yuborgan tasdiqlash kodini kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyPhoneRegister({
        token: phoneToken,
        code: phoneCode.trim(),
      });
      if (res && res.ok) {
        setSuccess('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!');
        await refreshUser();
        setTimeout(() => {
          navigation.popToTop();
        }, 1000);
      } else {
        setError(res?.error || 'Kod noto\'g\'ri yoki eskirgan');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramVerifyBot = () => {
    const url = botUrl || 'https://t.me/morawerifybot';
    Linking.openURL(url).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft size={22} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ro'yxatdan o'tish</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'DarkMora hisobingizni oching (Saytdagi kabi Email yoki Telefon)'
            : 'Tasdiqlash kodini kiriting va hisobingizni faollashtiring'}
        </Text>

        {/* Mode switcher tabs (Step 1) */}
        {step === 1 && (
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'email' && styles.modeTabActive]}
              onPress={() => { setMode('email'); setError(''); setSuccess(''); }}
            >
              <Mail size={16} color={mode === 'email' ? '#fff' : colors.textDim} />
              <Text style={[styles.modeTabText, mode === 'email' && styles.modeTabTextActive]}>
                Email (Gmail)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'phone' && styles.modeTabActive]}
              onPress={() => { setMode('phone'); setError(''); setSuccess(''); }}
            >
              <Phone size={16} color={mode === 'phone' ? '#fff' : colors.textDim} />
              <Text style={[styles.modeTabText, mode === 'phone' && styles.modeTabTextActive]}>
                Telefon raqam
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={16} color={colors.success || '#10b981'} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {/* STEP 1: INITIAL DETAILS */}
        {step === 1 ? (
          <>
            <View style={styles.inputBox}>
              <User size={18} color={colors.textDim} />
              <TextInput
                placeholder="Foydalanuvchi nomi (Login)"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            {mode === 'email' ? (
              <View style={styles.inputBox}>
                <Mail size={18} color={colors.textDim} />
                <TextInput
                  placeholder="Email manzili (masalan: email@gmail.com)"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.inputBox}>
                <Phone size={18} color={colors.textDim} />
                <TextInput
                  placeholder="Telefon raqami (masalan: +998901234567)"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            <View style={styles.inputBox}>
              <Lock size={18} color={colors.textDim} />
              <TextInput
                placeholder="Parol yarating (kamida 6 ta belgi)"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={mode === 'email' ? handleEmailStep1 : handlePhoneStep1}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'email' ? 'Kodni emailga olish' : 'Bot orqali davom etish'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* STEP 2: VERIFICATION CODE */
          <>
            {mode === 'phone' && (
              <TouchableOpacity style={styles.botBanner} onPress={openTelegramVerifyBot}>
                <View style={styles.botIconWrap}>
                  <Send size={18} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.botBannerTitle}>Telegram botda tasdiqlash</Text>
                  <Text style={styles.botBannerSub}>
                    @morawerifybot botiga o'tib «📱 Raqamni yuborish» tugmasini bosing
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.inputBox}>
              <KeyRound size={18} color={colors.textDim} />
              <TextInput
                placeholder="6 xonali tasdiqlash kodi"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={mode === 'email' ? emailCode : phoneCode}
                onChangeText={mode === 'email' ? setEmailCode : setPhoneCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={mode === 'email' ? handleEmailStep2 : handlePhoneStep2}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Akkauntni faollashtirish</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setStep(1);
                setEmailCode('');
                setPhoneCode('');
                setError('');
                setSuccess('');
              }}
            >
              <Text style={styles.retryText}>Ma'lumotlarni o'zgartirish / Qayta yuborish</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomLinkRow}>
          <Text style={styles.bottomLinkText}>Akkauntingiz bormi? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkHighlight}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  backBtn: {
    marginTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 14,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    color: '#34d399',
    fontSize: 13,
    flex: 1,
  },
  botBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  botIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botBannerTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  botBannerSub: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  retryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  retryText: {
    color: colors.textDim,
    fontSize: 13,
  },
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  bottomLinkText: {
    color: colors.textDim,
    fontSize: 13,
  },
  linkHighlight: {
    color: colors.primaryGlow,
    fontSize: 13,
    fontWeight: '700',
  },
});
