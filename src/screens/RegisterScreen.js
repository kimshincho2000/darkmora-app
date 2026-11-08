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
} from 'react-native';
import { ChevronLeft, Lock, Mail, User } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Barcha maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await register(username.trim(), email.trim(), password);
      if (res && res.ok) {
        navigation.popToTop();
      } else {
        setError(res?.error || 'Ro\'yxatdan o\'tishda xatolik');
      }
    } catch (e) {
      setError('Ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
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

      <View style={styles.content}>
        <Text style={styles.title}>Ro'yxatdan o'tish</Text>
        <Text style={styles.subtitle}>DarkMora oilasiga qo'shiling</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.inputBox}>
          <User size={18} color={colors.textDim} />
          <TextInput
            placeholder="Foydalanuvchi nomi"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputBox}>
          <Mail size={18} color={colors.textDim} />
          <TextInput
            placeholder="Email manzili"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputBox}>
          <Lock size={18} color={colors.textDim} />
          <TextInput
            placeholder="Parol"
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
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Akkaunt ochish</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomLinkRow}>
          <Text style={styles.bottomLinkText}>Akkauntingiz bormi? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkHighlight}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
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
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: 14,
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
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
