import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const COLORS = {
  navy: '#1B2559',
  white: '#FFFFFF',
  gray: '#6B7280',
  green: '#22C55E',
  bg: '#FFFFFF',
  illustrationBg: '#EEF1FA',
};

export default function SetupCompleteScreen({ navigation = null, onGoToDashboard }) {
  const handleGoToDashboard = () => {
    if (onGoToDashboard) return onGoToDashboard();
    // navigation?.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.container}>
        <View style={styles.spacer} />

        {/* Confetti + check */}
        <View style={styles.checkWrap}>
          <Text style={[styles.confetti, styles.confettiTopLeft]}>🎉</Text>
          <Text style={[styles.confetti, styles.confettiTopRight]}>✨</Text>
          <Text style={[styles.confetti, styles.confettiBottomLeft]}>🎊</Text>
          <Text style={[styles.confetti, styles.confettiBottomRight]}>⭐</Text>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>All Set! 🎉</Text>
        <Text style={styles.subtitle}>
          Your account is ready to go.{'\n'}Start managing your business{'\n'}like a pro.
        </Text>

        {/* Illustration placeholder */}
        <View style={styles.illustrationBox}>
          <Text style={styles.illustrationEmoji}>📋  📦  🧮</Text>
        </View>

        <View style={styles.spacer} />

        {/* Go to Dashboard button */}
        <TouchableOpacity
          style={styles.dashboardButton}
          activeOpacity={0.85}
          onPress={handleGoToDashboard}
        >
          <Text style={styles.dashboardText}>Go to Dashboard</Text>
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 24,
  },
  spacer: {
    flex: 1,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 42,
    fontWeight: '700',
  },
  confetti: {
    position: 'absolute',
    fontSize: 20,
  },
  confettiTopLeft: {
    top: -6,
    left: 24,
  },
  confettiTopRight: {
    top: -6,
    right: 24,
  },
  confettiBottomLeft: {
    bottom: -4,
    left: 8,
  },
  confettiBottomRight: {
    bottom: -4,
    right: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  illustrationBox: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: COLORS.illustrationBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 32,
  },
  dashboardButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  dashboardText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});