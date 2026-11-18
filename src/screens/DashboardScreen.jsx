import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';

const COLORS = {
  navy: '#1B2559',
  navyDark: '#141B3C',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  blue: '#3B5BDB',
  bg: '#F5F6FA',
  green: '#22C55E',
  greenBg: '#E9F9EF',
  orange: '#F97316',
  orangeBg: '#FFF3E8',
  purpleBg: '#F1EEFB',
  purple: '#7C5CFC',
};

const SUMMARY_CARDS = [
  { key: 'sales', label: 'Total Sales', value: '₹ 1,25,000', emoji: '💰', bg: COLORS.greenBg, tint: COLORS.green },
  { key: 'commission', label: 'Commission', value: '₹ 8,500', emoji: '🎯', bg: COLORS.purpleBg, tint: COLORS.purple },
  { key: 'pending', label: 'Pending Payments', value: '₹ 45,000', emoji: '⏳', bg: COLORS.orangeBg, tint: COLORS.orange },
];

const QUICK_ACTIONS = [
  { key: 'createInvoice', label: 'Create Invoice', emoji: '🧾', bg: COLORS.greenBg, tint: COLORS.green },
  { key: 'createLedger', label: 'Create Ledger', emoji: '📒', bg: COLORS.purpleBg, tint: COLORS.purple },
  { key: 'createPayment', label: 'Create Payment', emoji: '💳', bg: COLORS.orangeBg, tint: COLORS.orange },
  { key: 'viewPayments', label: 'View Payment', emoji: '📥', bg: COLORS.purpleBg, tint: COLORS.purple },
  { key: 'viewInvoices', label: 'View Invoice', emoji: '📄', bg: '#E8EEFB', tint: COLORS.blue },
  { key: 'viewReturns', label: 'View Return', emoji: '↩️', bg: COLORS.greenBg, tint: COLORS.green },
];

const RECENT_INVOICES = [
  { id: 'INV-10023', name: 'Ravi Traders', status: 'Paid', amount: '₹ 25,000', date: '23 May 2024' },
  { id: 'INV-10022', name: 'S.K. Enterprises', status: 'Pending', amount: '₹ 18,750', date: '23 May 2024' },
];

function StatusBadge({ status }) {
  const isPaid = status === 'Paid';
  return (
    <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
      <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>
        {status}
      </Text>
    </View>
  );
}

export default function DashboardScreen({
  navigation = null,
  userName = 'Venkatesh',
  onMenuPress,
  onNotificationPress,
  onQuickAction,
  onViewAllInvoices,
  onInvoicePress,
  onTabPress,
}) {

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuPress} style={styles.headerIconButton}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>

        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>Good Morning,</Text>
          <Text style={styles.userName}>{userName} 👋</Text>
        </View>

        <TouchableOpacity onPress={onNotificationPress} style={styles.headerIconButton}>
          <Text style={styles.headerIcon}>🔔</Text>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Business Summary */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Business Summary</Text>
          <TouchableOpacity style={styles.todayPill}>
            <Text style={styles.todayText}>Today ⌄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          {SUMMARY_CARDS.map((card) => (
            <View key={card.key} style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: card.bg }]}>
                <Text style={styles.summaryIconEmoji}>{card.emoji}</Text>
              </View>
              <Text style={styles.summaryValue}>{card.value}</Text>
              <Text style={styles.summaryLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={() => onQuickAction && onQuickAction(action.key)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.bg }]}>
                <Text style={styles.actionIconEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Invoices */}
        <View style={[styles.sectionRow, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity onPress={onViewAllInvoices}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {RECENT_INVOICES.map((invoice) => (
          <TouchableOpacity
            key={invoice.id}
            style={styles.invoiceRow}
            activeOpacity={0.7}
            onPress={() => onInvoicePress && onInvoicePress(invoice)}
          >
            <View style={styles.invoiceLeft}>
              <Text style={styles.invoiceId}>{invoice.id}</Text>
              <Text style={styles.invoiceName}>{invoice.name}</Text>
            </View>
            <StatusBadge status={invoice.status} />
            <View style={styles.invoiceRight}>
              <Text style={styles.invoiceAmount}>{invoice.amount}</Text>
              <Text style={styles.invoiceDate}>{invoice.date}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Bottom tab bar */}
      <BottomTabBar activeTab="home" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 4,
    paddingBottom: 20,
    backgroundColor: COLORS.navy,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: COLORS.white,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  greetingWrap: {
    flex: 1,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: '#C6CBEA',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  todayPill: {
    paddingHorizontal: 4,
  },
  todayText: {
    fontSize: 13,
    color: COLORS.lightGray,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryIconEmoji: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '31.5%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  invoiceLeft: {
    flex: 1.3,
  },
  invoiceId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  invoiceName: {
    fontSize: 12,
    color: COLORS.gray,
  },
  invoiceRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  invoiceDate: {
    fontSize: 11,
    color: COLORS.lightGray,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  badgePaid: {
    backgroundColor: COLORS.greenBg,
  },
  badgePending: {
    backgroundColor: COLORS.orangeBg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextPaid: {
    color: COLORS.green,
  },
  badgeTextPending: {
    color: COLORS.orange,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabEmoji: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.lightGray,
  },
  tabLabelActive: {
    color: COLORS.blue,
    fontWeight: '700',
  },
});