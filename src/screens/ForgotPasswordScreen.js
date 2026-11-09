import React, { useState } from 'react';
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
import { ChevronLeft, Lock, Mail, Phone, KeyRound, Send, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { api } from '../api/client';

export default function ForgotPasswordScreen({ navigation }) {
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [step, setStep] = useState(1); // 1: request code, 2: verify & change

  // Inputs
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [botUrl, setBotUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Request reset code
  const handleRequestCode = async () => {
    setError('');
    setSuccess('');
    const target = method === 'email' ? email.trim() : phone.trim();
    if (!target) {
      setError(method === 'email' ? 'Email manzilingizni kiriting' : 'Telefon raqamingizni kiriting');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendResetCode(target);
      if (res && res.ok) {
        setStep(2);
        if (res.data?.type === 'phone' && res.data?.token) {
          setPhoneToken(res.data.token);
          if (res.data.bot_url) setBotUrl(res.data.bot_url);
        }
        setSuccess(res.data?.message || 'Tasdiqlash kodi muvaffaqiyatli yuborildi!');
      } else {
        setError(res?.error || 'Kod yuborishda xatolik yuz berdi');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    const target = method === 'email' ? email.trim() : phone.trim();

    if (!code.trim()) {
      setError('Tasdiqlash kodini kiriting');
      return;
    }
    if (newPassword.length < 6) {
      setError('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        identifier: target,
        code: code.trim(),
        newPassword,
        token: phoneToken,
      });
      if (res && res.ok) {
        setSuccess('Parolingiz muvaffaqiyatli yangilandi!');
        setTimeout(() => {
          navigation.replace('Login');
        }, 1500);
      } else {
        setError(res?.error || 'Parolni yangilashda xatolik');
      }
    } catch (e) {
      setError('Server bilan aloqada xatolik');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = () => {
    if (botUrl) {
      Linking.openURL(botUrl).catch(() => {});
    } else {
      Linking.openURL('https://t.me/morawerifybot').catch(() => {});
    }
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
        <Text style={styles.title}>Parolni tiklash</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Akkauntingizga ulangan email yoki telefon raqamingiz orqali parolingizni tiklang'
            : 'Tasdiqlash kodini va yangi parolni kiriting'}
        </Text>

        {/* Method Switcher Tabs (Only on step 1) */}
        {step === 1 && (
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[styles.methodTab, method === 'email' && styles.methodTabActive]}
              onPress={() => { setMethod('email'); setError(''); setSuccess(''); }}
            >
              <Mail size={16} color={method === 'email' ? '#fff' : colors.textDim} />
              <Text style={[styles.methodTabText, method === 'email' && styles.methodTabTextActive]}>
                Email (Gmail)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodTab, method === 'phone' && styles.methodTabActive]}
              onPress={() => { setMethod('phone'); setError(''); setSuccess(''); }}
            >
              <Phone size={16} color={method === 'phone' ? '#fff' : colors.textDim} />
              <Text style={[styles.methodTabText, method === 'phone' && styles.methodTabTextActive]}>
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

        {step === 1 ? (
          <>
            {method === 'email' ? (
              <View style={styles.inputBox}>
                <Mail size={18} color={colors.textDim} />
                <TextInput
                  placeholder="Email manzili (masalan: winpubgm8@gmail.com)"
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

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleRequestCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Tasdiqlash kodini olish</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {method === 'phone' && botUrl ? (
              <TouchableOpacity style={styles.botBanner} onPress={openTelegramBot}>
                <View style={styles.botIconWrap}>
                  <Send size={18} color="#38bdf8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.botBannerTitle}>Telegram bot orqali kod olish</Text>
                  <Text style={styles.botBannerSub}>@morawerifybot botiga o'tib kodni tasdiqlang</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.inputBox}>
              <KeyRound size={18} color={colors.textDim} />
              <TextInput
                placeholder="6 xonali tasdiqlash kodi"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputBox}>
              <Lock size={18} color={colors.textDim} />
              <TextInput
                placeholder="Yangi parol (kamida 6 ta belgi)"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Parolni yangilash</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setStep(1); setCode(''); setNewPassword(''); }}
            >
              <Text style={styles.retryText}>Boshqa manzil kiritish / Qayta yuborish</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomLinkRow}>
          <Text style={styles.bottomLinkText}>Parolingiz esingizdami? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
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
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  methodTabActive: {
    backgroundColor: colors.primary,
  },
  methodTabText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  methodTabTextActive: {
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
