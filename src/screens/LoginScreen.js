import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ChevronLeft,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  RotateCw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function LoginScreen({ navigation }) {
  const { login, verifyAdmin2FA } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeInput, setActiveInput] = useState(null); // 'user' | 'pass' | '2fa' | null

  // 2-Step Admin 2FA State
  const [step, setStep] = useState(1); // 1: credentials, 2: 2fa
  const [tempToken, setTempToken] = useState('');
  const [emailMasked, setEmailMasked] = useState('winpubgm8@gmail.com');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(username.trim(), password);
      if (res && res.ok) {
        // If Admin requires 2FA security code
        if (res.data?.requires_2fa) {
          setTempToken(res.data.temp_token || '');
          setEmailMasked(res.data.email_masked || 'pochtangiz');
          setStep(2);
          setResendTimer(60);
          return;
        }

        // Normal user login success
        if (navigation.canGoBack()) {
          navigation.popToTop();
        } else {
          navigation.navigate('Main');
        }
      } else {
        setError(res?.error || 'Login yoki parol noto\'g\'ri');
      }
    } catch (e) {
      setError('Ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode.trim()) {
      setError('Tasdiqlash kodini kiriting');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifyAdmin2FA(tempToken, twoFactorCode.trim());
      if (res && res.ok) {
        // Successfully verified as admin!
        navigation.replace('Admin');
      } else {
        setError(res?.error || 'Tasdiqlash kodi noto\'g\'ri');
      }
    } catch (e) {
      setError('Ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const res = await api.adminResend2fa(tempToken);
      if (res?.ok) {
        if (res.data?.temp_token) setTempToken(res.data.temp_token);
        setResendTimer(60);
      } else {
        setError(res?.error || 'Kodni qayta yuborib bo\'lmadi');
      }
    } catch (e) {
      setError('Xatolik yuz berdi');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 5-USLUB: CINEMATIC LIVE ANIME VIDEO BACKGROUND */}
      <Video
        source={require('../../assets/login_bg.mp4')}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />

      {/* Dark Vignette Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(7, 8, 12, 0.45)',
          'rgba(7, 8, 12, 0.70)',
          'rgba(7, 8, 12, 0.94)',
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 2) {
              setStep(1);
              setError('');
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Main');
            }
          }}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Anime Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.animeBadge, step === 2 && styles.animeBadgeAdmin]}>
              <Text style={styles.animeBadgeText}>
                {step === 2 ? 'ADMIN XAVFSIZLIK TIZIMI' : 'DARKMORA • ANIME HUB'}
              </Text>
            </View>
          </View>

          {/* Frosted Glassmorphism Card */}
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 30}
            tint="dark"
            style={styles.glassCard}
          >
            {/* Logo or Shield Icon */}
            <View style={styles.logoWrap}>
              <View style={[styles.logoGlowRing, step === 2 && styles.logoGlowRingGold]}>
                {step === 2 ? (
                  <ShieldCheck size={36} color="#fbbf24" />
                ) : (
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logoImg}
                  />
                )}
              </View>
            </View>

            <Text style={styles.title}>
              {step === 2 ? '2FA Tasdiqlash' : 'Xush kelibsiz!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 2
                ? `Tasdiqlash kodi ${emailMasked} pochtasiga yuborildi.`
                : 'DarkMora hisobingizga kiring'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ================= STEP 1: LOGIN & PASSWORD ================= */}
            {step === 1 ? (
              <>
                {/* Input 1: Username / Email */}
                <View
                  style={[
                    styles.inputBox,
                    activeInput === 'user' && styles.inputBoxActive,
                  ]}
                >
                  <User
                    size={18}
                    color={activeInput === 'user' ? colors.primaryGlow : colors.textDim}
                  />
                  <TextInput
                    placeholder="Foydalanuvchi nomi yoki email"
                    placeholderTextColor={colors.textDim}
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    onFocus={() => setActiveInput('user')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>

                {/* Input 2: Password */}
                <View
                  style={[
                    styles.inputBox,
                    activeInput === 'pass' && styles.inputBoxActive,
                  ]}
                >
                  <Lock
                    size={18}
                    color={activeInput === 'pass' ? colors.primaryGlow : colors.textDim}
                  />
                  <TextInput
                    placeholder="Parol"
                    placeholderTextColor={colors.textDim}
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setActiveInput('pass')}
                    onBlur={() => setActiveInput(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.textDim} />
                    ) : (
                      <Eye size={18} color={colors.textDim} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPassText}>Parolni unutdingizmi?</Text>
                </TouchableOpacity>

                {/* Submit Button with Gradient */}
                <TouchableOpacity
                  style={styles.submitBtnWrap}
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#1d68f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Kirish</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Bottom Register Switch */}
                <View style={styles.bottomLinkRow}>
                  <Text style={styles.bottomLinkText}>Hisobingiz yo'qmi? </Text>
                  <TouchableOpacity onPress={() => navigation.replace('Register')}>
                    <Text style={styles.linkHighlight}>Ro'yxatdan o'tish</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* ================= STEP 2: 2FA CODE VERIFICATION ================= */
              <>
                <View
                  style={[
                    styles.inputBox,
                    activeInput === '2fa' && styles.inputBoxActiveGold,
                  ]}
                >
                  <KeyRound
                    size={18}
                    color={activeInput === '2fa' ? '#fbbf24' : colors.textDim}
                  />
                  <TextInput
                    placeholder="6 xonali tasdiqlash kodi"
                    placeholderTextColor={colors.textDim}
                    style={[styles.input, styles.codeInput]}
                    value={twoFactorCode}
                    onChangeText={setTwoFactorCode}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus
                    onFocus={() => setActiveInput('2fa')}
                    onBlur={() => setActiveInput(null)}
                  />
                </View>

                {/* Resend Code Button */}
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleResend2FA}
                  disabled={resendTimer > 0}
                  activeOpacity={0.7}
                >
                  <RotateCw size={14} color={resendTimer > 0 ? colors.textDim : '#fbbf24'} />
                  <Text
                    style={[
                      styles.resendText,
                      resendTimer > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {resendTimer > 0
                      ? `Qayta yuborish (${resendTimer}s)`
                      : 'Kodni qayta yuborish'}
                  </Text>
                </TouchableOpacity>

                {/* Submit 2FA Button with Gold/Amber Gradient */}
                <TouchableOpacity
                  style={styles.submitBtnWrap}
                  activeOpacity={0.85}
                  onPress={handleVerify2FA}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#d97706', '#b45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Tasdiqlash va Kirish</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch back to credentials */}
                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => {
                    setStep(1);
                    setError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToLoginText}>Boshqa hisob bilan kirish</Text>
                </TouchableOpacity>
              </>
            )}
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080a',
  },
  keyboardWrap: {
    flex: 1,
  },
  backBtn: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48,
    left: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 20, 32, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 60 : 100,
    paddingBottom: 40,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  animeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  animeBadgeAdmin: {
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
  },
  animeBadgeText: {
    color: colors.primaryGlow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  glassCard: {
    backgroundColor: 'rgba(12, 17, 29, 0.78)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    shadowColor: '#1d68f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoGlowRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.65)',
    backgroundColor: 'rgba(29, 104, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlowRingGold: {
    borderColor: 'rgba(251, 191, 36, 0.75)',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  logoImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 8, 16, 0.65)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
    gap: 10,
  },
  inputBoxActive: {
    borderColor: colors.primaryGlow,
    backgroundColor: 'rgba(10, 18, 35, 0.85)',
  },
  inputBoxActiveGold: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(30, 20, 5, 0.85)',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    paddingVertical: 4,
  },
  forgotPassText: {
    color: colors.primaryGlow,
    fontSize: 12,
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
    paddingVertical: 6,
  },
  resendText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: colors.textDim,
  },
  submitBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1d68f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  bottomLinkText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  linkHighlight: {
    color: colors.primaryGlow,
    fontSize: 13,
    fontWeight: '700',
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  backToLoginText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
});
