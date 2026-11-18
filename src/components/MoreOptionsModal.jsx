import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { COLORS } from '../app/utils/theme';

const OPTIONS = [
  { key: 'addTransporter', label: 'Add Transporter', emoji: '🚛' },
  { key: 'viewLRs', label: "View LR's", emoji: '📋' },
  { key: 'reports', label: 'Reports', emoji: '📊' },
  { key: 'recordExpense', label: 'Record Expense', emoji: '🧾' },
  { key: 'createOrder', label: 'Create Order', emoji: '📝' },
  { key: 'viewOrders', label: 'View Orders', emoji: '📦' },
];

export default function MoreOptionsModal({ visible, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>More Options</Text>

          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => onSelect && onSelect(option.key)}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.iconEmoji}>{option.emoji}</Text>
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 18,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.lightGray,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
});