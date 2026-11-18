import React, { useState, useRef, useEffect } from 'react';
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
  border: '#E5E7EB',
  blue: '#3B5BDB',
  bg: '#FFFFFF',
  shieldBg: '#E8EBFA',
  shieldMid: '#B9C2F0',
  shieldDark: '#3B4A9C',
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 25;

export default function OtpScreen({ navigation = null, mobile = '9876543210', onBack, onVerify, onResend }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formattedMobile = mobile.length === 10
    ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
    : `+91 ${mobile}`;

  const formattedTimer = `00:${timer.toString().padStart(2, '0')}`;

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (error) setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify once all boxes are filled
    const joined = next.join('');
    if (joined.length === OTP_LENGTH && next.every((d) => d !== '')) {
      handleVerify(joined);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (code) => {
    const joined = code ?? otp.join('');
    if (joined.length !== OTP_LENGTH) {
      setError('Enter the 6-digit OTP');
      return;
    }
    if (onVerify) onVerify(joined);
    // navigation?.navigate('Home');
  };

  const handleResend = () => {
    if (timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setTimer(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
    if (onResend) onResend();
  };

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
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
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>We have sent a 6-digit OTP to</Text>
          <Text style={styles.mobileText}>{formattedMobile}</Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null, error ? styles.otpBoxError : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                textAlign="center"
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Resend timer */}
          <TouchableOpacity
            style={styles.resendRow}
            onPress={handleResend}
            disabled={timer > 0}
            activeOpacity={timer > 0 ? 1 : 0.6}
          >
            {timer > 0 ? (
              <Text style={styles.resendText}>
                Resend OTP in <Text style={styles.resendTimer}>{formattedTimer}</Text>
              </Text>
            ) : (
              <Text style={styles.resendLink}>Resend OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* Shield illustration */}
          <View style={styles.shieldWrap}>
            <View style={styles.shieldOuter}>
              <View style={styles.shieldInner}>
                <Text style={styles.lockEmoji}>🔒</Text>
              </View>
            </View>
          </View>

          <Text style={styles.secureText}>Your data is 100% secure with us</Text>

          <View style={styles.spacer} />
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  mobileText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.navy,
  },
  otpBoxFilled: {
    borderColor: COLORS.navy,
  },
  otpBoxError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  resendTimer: {
    color: COLORS.blue,
    fontWeight: '700',
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '700',
  },
  spacer: {
    flex: 1,
  },
  shieldWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shieldOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.shieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.shieldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockEmoji: {
    fontSize: 40,
  },
  secureText: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
  },
});