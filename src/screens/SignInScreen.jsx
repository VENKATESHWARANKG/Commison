import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const COLORS = {
  navy: '#1B2559',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  blue: '#3B5BDB',
  bg: '#FFFFFF',
};

export default function SignInScreen({ navigation = null, onBack, onSendOtp, onGoogleSignIn, onSignUp }) {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const handleMobileChange = (text) => {
    // Strip anything that isn't a digit as the user types
    const digitsOnly = text.replace(/[^0-9]/g, '');
    setMobile(digitsOnly);
    if (error) setError('');
  };

  const handleSendOtp = () => {
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError('Enter 10 digit mobile number');
      return;
    }
    setError('');
    if (onSendOtp) onSendOtp(mobile);
    // navigation?.navigate('OtpScreen', { mobile });
  };

  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) onGoogleSignIn();
  };

  const handleSignUp = () => {
    if (onSignUp) onSignUp();
    // navigation?.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* Mobile number input */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
              <Text style={styles.chevron}>⌄</Text>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={handleMobileChange}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Send OTP button */}
          <TouchableOpacity
            style={styles.sendOtpButton}
            activeOpacity={0.85}
            onPress={handleSendOtp}
          >
            <Text style={styles.sendOtpText}>Send OTP</Text>
          </TouchableOpacity>

          {/* OR divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.7}
            onPress={handleGoogleSignIn}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* Sign up link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.navy,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 18,
  },
  inputRowError: {
    borderColor: '#DC2626',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
  },
  sendOtpButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  sendOtpText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  orText: {
    marginHorizontal: 12,
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 15,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 8,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  spacer: {
    flex: 1,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signUpText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  signUpLink: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '600',
  },
});