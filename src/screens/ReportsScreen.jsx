import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { COLORS } from '../app/utils/theme';

const PERIODS = ['Today', 'Week', 'Month', 'Year'];

const SUMMARY = [
  { key: 'sales', label: 'Total Sales', value: '₹ 1,25,000', pct: 100, tint: COLORS.green, bg: COLORS.greenBg },
  { key: 'commission', label: 'Commission Earned', value: '₹ 8,500', pct: 7, tint: COLORS.purple, bg: COLORS.purpleBg },
  { key: 'pending', label: 'Pending Payments', value: '₹ 45,000', pct: 36, tint: COLORS.orange, bg: COLORS.orangeBg },
];

const TOP_PARTIES = [
  { name: 'Ravi Traders', amount: '₹ 42,000' },
  { name: 'Global Foods Co.', amount: '₹ 38,500' },
  { name: 'Metro Distributors', amount: '₹ 21,300' },
];

export default function ReportsScreen({ navigation = null, onBack }) {
  const [period, setPeriod] = useState('Month');

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, period === p ? styles.periodChipActive : null]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p ? styles.periodTextActive : null]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {SUMMARY.map((item) => (
          <View key={item.key} style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={[styles.summaryValue, { color: item.tint }]}>{item.value}</Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: item.bg }]}>
              <View style={[styles.barFill, { width: `${item.pct}%`, backgroundColor: item.tint }]} />
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Top Parties by Volume</Text>
        {TOP_PARTIES.map((party, index) => (
          <View key={party.name} style={styles.partyRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.partyName}>{party.name}</Text>
            <Text style={styles.partyAmount}>{party.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: COLORS.navy },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  periodRow: { flexDirection: 'row', marginBottom: 20 },
  periodChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  periodChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  periodText: { fontSize: 13, color: COLORS.navy, fontWeight: '500' },
  periodTextActive: { color: COLORS.white },
  summaryCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.navy, marginTop: 12, marginBottom: 12 },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: '700', color: COLORS.navy },
  partyName: { flex: 1, fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  partyAmount: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
});