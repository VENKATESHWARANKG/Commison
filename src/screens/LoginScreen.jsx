import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
// If you use expo, you can swap the emoji-based badge below for a real icon:
// import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  navy: '#1B2559',
  navyDark: '#141B3C',
  blue: '#3B5BDB',
  white: '#FFFFFF',
  gray: '#6B7280',
  border: '#1B2559',
  bg: '#F5F6FA',
};

export default function LoginScreen({ navigation = null, onLoginPress }) {
  const handleLogin = () => {
  if (onLoginPress) return onLoginPress();
  if (navigation) navigation.navigate('SignIn');
};

  const handleCreateAccount = () => {
    if (onLoginPress) return onLoginPress();
    if (navigation) navigation.navigate('SignIn');
  };

  const handleTermsPress = () => {
    // Linking.openURL('https://yourapp.com/terms');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        {/* Logo badge */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🤝</Text>
        </View>

        {/* Title & subtitle */}
        <Text style={styles.title}>Commission Agent</Text>
        <Text style={styles.subtitle}>
          Manage Business. Track Commissions.{'\n'}Grow Together.
        </Text>

        {/* Illustration placeholder — replace with your own image/Lottie */}
        <View style={styles.illustrationBox}>
          <Text style={styles.illustrationEmoji}>🚚  🤝  🏭</Text>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountButton}
          activeOpacity={0.7}
          onPress={handleCreateAccount}
        >
          <Text style={styles.createAccountButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.termsLink} onPress={handleTermsPress}>
            Terms & Privacy Policy
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  illustrationBox: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#EDEFF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 34,
  },
  spacer: {
    flex: 1,
  },
  loginButton: {
    width: '100%',
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    marginBottom: 20,
  },
  createAccountButtonText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  termsLink: {
    color: COLORS.blue,
    fontWeight: '600',
  },
});