import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/utils/theme';

const TABS = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'invoices', label: 'Invoices', emoji: '📄' },
  { key: 'parties', label: 'Parties', emoji: '👥' },
  { key: 'payments', label: 'Payments', emoji: '💳' },
  { key: 'profile', label: 'Profile', emoji: '👤' },
];

export default function BottomTabBar({ activeTab, onTabPress }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => onTabPress && onTabPress(tab.key)}
          >
            <Text style={[styles.tabEmoji, isActive ? styles.tabEmojiActive : null]}>
              {tab.emoji}
            </Text>
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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