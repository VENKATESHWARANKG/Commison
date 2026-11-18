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
  ScrollView,
} from 'react-native';

const COLORS = {
  navy: '#1B2559',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  blue: '#3B5BDB',
  bg: '#FFFFFF',
  error: '#DC2626',
};

// Letters (incl. accented) and spaces only — no digits or special characters
const NAME_REGEX = /^[A-Za-z\u00C0-\u024F]+(?:[ ][A-Za-z\u00C0-\u024F]+)*$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateAccountScreen({ navigation = null, onBack, onContinue, onLoginPress }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', mobile: '', email: '' });

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const handleNameChange = (text) => {
    setName(text);
    if (errors.name) setErrors((e) => ({ ...e, name: '' }));
  };

  const handleMobileChange = (text) => {
    const digitsOnly = text.replace(/[^0-9]/g, '');
    setMobile(digitsOnly);
    if (errors.mobile) setErrors((e) => ({ ...e, mobile: '' }));
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (errors.email) setErrors((e) => ({ ...e, email: '' }));
  };

  const validate = () => {
    const next = { name: '', mobile: '', email: '' };

    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = 'Full name is required';
    } else if (!NAME_REGEX.test(trimmedName)) {
      next.name = 'Name should not contain numbers or special characters';
    }

    if (!mobile) {
      next.mobile = 'Mobile number is required';
    } else if (!MOBILE_REGEX.test(mobile)) {
      next.mobile = 'Enter 10 digit mobile number';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      next.email = 'Email address is required';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = 'Enter a valid email address';
    }

    setErrors(next);
    return !next.name && !next.mobile && !next.email;
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (onContinue) onContinue({ name: name.trim(), mobile, email: email.trim() });
    // navigation?.navigate('Home');
  };

  const handleLogin = () => {
    if (onLoginPress) return onLoginPress();
    if (navigation) navigation.navigate('Welcome');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Let's get started with your details.</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputRow, errors.name ? styles.inputRowError : null]}>
            <Text style={styles.iconText}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.lightGray}
              value={name}
              onChangeText={handleNameChange}
              autoCapitalize="words"
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          {/* Mobile Number */}
          <Text style={[styles.label, styles.labelSpacing]}>Mobile Number</Text>
          <View style={[styles.inputRow, errors.mobile ? styles.inputRowError : null]}>
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
          {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

          {/* Email Address */}
          <Text style={[styles.label, styles.labelSpacing]}>Email Address</Text>
          <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
            <Text style={styles.iconText}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={handleEmailChange}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Continue button */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
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
  labelSpacing: {
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowError: {
    borderColor: COLORS.error,
  },
  iconText: {
    fontSize: 16,
    marginRight: 10,
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
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
  continueButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  continueText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '600',
  },
});