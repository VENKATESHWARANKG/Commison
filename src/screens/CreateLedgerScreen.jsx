import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../app/utils/theme';
import { validateRequired } from '../app/utils/validators';
import DropdownField from '../components/DropdownField';
import RadioGroup from '../components/RadioGroup';

// Tally-style ledger groups
const LEDGER_GROUPS = [
  'Bank Accounts',
  'Cash-in-Hand',
  'Sundry Debtors',
  'Sundry Creditors',
  'Capital Account',
  'Loans (Liability)',
  'Current Assets',
  'Current Liabilities',
  'Fixed Assets',
  'Purchase Accounts',
  'Sales Accounts',
  'Direct Expenses',
  'Indirect Expenses',
  'Direct Income',
  'Indirect Income',
  'Duties & Taxes',
  'Investments',
];
const BALANCE_TYPES = ['Debit', 'Credit'];

export default function CreateLedgerScreen({ navigation = null, onBack, onSave }) {
  const [ledgerName, setLedgerName] = useState('');
  const [ledgerGroup, setLedgerGroup] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState('Debit');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      ledgerName: validateRequired(ledgerName, 'Ledger name'),
      ledgerGroup: validateRequired(ledgerGroup, 'Ledger group'),
    };
    if (openingBalance && !/^\d+(\.\d{1,2})?$/.test(openingBalance)) {
      next.openingBalance = 'Enter a valid amount';
    }
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) {
      onSave({
        ledgerName: ledgerName.trim(),
        ledgerGroup,
        openingBalance: openingBalance || '0',
        balanceType,
        notes: notes.trim(),
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Ledger</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Ledger Name</Text>
          <View style={[styles.inputRow, errors.ledgerName ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ravi Traders / HDFC Bank"
              placeholderTextColor={COLORS.lightGray}
              value={ledgerName}
              onChangeText={(t) => { setLedgerName(t); clearError('ledgerName'); }}
            />
          </View>
          {errors.ledgerName ? <Text style={styles.errorText}>{errors.ledgerName}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Ledger Group (Under)</Text>
          <DropdownField
            value={ledgerGroup}
            options={LEDGER_GROUPS}
            title="Select Ledger Group"
            placeholder="Select or search a ledger group"
            error={errors.ledgerGroup}
            onSelect={(v) => { setLedgerGroup(v); clearError('ledgerGroup'); }}
          />
          {errors.ledgerGroup ? <Text style={styles.errorText}>{errors.ledgerGroup}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Opening Balance (₹, optional)</Text>
          <View style={[styles.inputRow, errors.openingBalance ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="decimal-pad"
              value={openingBalance}
              onChangeText={(t) => { setOpeningBalance(t.replace(/[^0-9.]/g, '')); clearError('openingBalance'); }}
            />
          </View>
          {errors.openingBalance ? <Text style={styles.errorText}>{errors.openingBalance}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Balance Type</Text>
          <RadioGroup value={balanceType} options={BALANCE_TYPES} onChange={setBalanceType} />

          <Text style={[styles.label, styles.labelSpacing]}>Notes (optional)</Text>
          <View style={[styles.inputRow, styles.textArea]}>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Add a note about this ledger"
              placeholderTextColor={COLORS.lightGray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save Ledger</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
  label: { fontSize: 13, fontWeight: '600', color: COLORS.navy, marginBottom: 8 },
  labelSpacing: { marginTop: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.navy },
  textArea: { height: 90, alignItems: 'flex-start', paddingTop: 12 },
  textAreaInput: { height: '100%', textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 6 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: { borderColor: COLORS.blue, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 13, color: COLORS.navy, fontWeight: '500' },
  chipTextSelected: { color: COLORS.blue, fontWeight: '700' },
  segmentRow: { flexDirection: 'row' },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  segmentText: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  segmentTextActive: { color: COLORS.white },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  selectPlaceholderText: { fontSize: 14, color: COLORS.lightGray },
  selectValueText: { fontSize: 14, color: COLORS.navy, fontWeight: '500' },
  chevron: { fontSize: 14, color: COLORS.gray },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { fontSize: 15, color: COLORS.navy },
  modalCancel: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: COLORS.gray },
});