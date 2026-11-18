import { useEffect, useState } from 'react';
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
import { dataStore } from '../app/utils/dataStore';
import { COLORS } from '../app/utils/theme';
import { validateAmount, validateRequired } from '../app/utils/validators';
import DropdownField from '../components/DropdownField';
import RadioGroup from '../components/RadioGroup';

const CATEGORIES = ['Fuel', 'Office', 'Salary', 'Transport', 'Maintenance', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
const CASH_BANK_GROUPS = ['Cash-in-Hand', 'Bank Accounts'];

export default function RecordExpenseScreen({ navigation = null, onBack, onSave }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paidFrom, setPaidFrom] = useState('');
  const [mode, setMode] = useState('Cash');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [sourceAccounts, setSourceAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Re-load every time this screen mounts, so a ledger created moments ago already shows up here.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ledgers = await dataStore.ledgers.getAll();
      const cashAndBankLedgers = ledgers
        .filter((l) => CASH_BANK_GROUPS.includes(l.ledgerGroup))
        .map((l) => l.ledgerName);
      if (isMounted) {
        setSourceAccounts(cashAndBankLedgers);
        setLoadingAccounts(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      category: validateRequired(category, 'Category'),
      amount: validateAmount(amount),
      paidFrom: validateRequired(paidFrom, 'Paid From account'),
      date: validateRequired(date, 'Date'),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) onSave({ category, amount, paidFrom, mode, date, notes: notes.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Expense</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Expense Category</Text>
          <DropdownField
            value={category}
            options={CATEGORIES}
            allowCustom
            title="Select Expense Category"
            placeholder="Select or search a category"
            error={errors.category}
            onSelect={(v) => { setCategory(v); clearError('category'); }}
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Amount (₹)</Text>
          <View style={[styles.inputRow, errors.amount ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => { setAmount(t.replace(/[^0-9.]/g, '')); clearError('amount'); }}
            />
          </View>
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Paid From</Text>
          {loadingAccounts ? (
            <Text style={styles.hintText}>Loading accounts…</Text>
          ) : sourceAccounts.length === 0 ? (
            <Text style={styles.hintText}>
              No Cash or Bank ledgers yet — create one under "Create Ledger" first.
            </Text>
          ) : (
            <DropdownField
              value={paidFrom}
              options={sourceAccounts}
              title="Paid From"
              placeholder="Select cash or bank account"
              error={errors.paidFrom}
              onSelect={(v) => { setPaidFrom(v); clearError('paidFrom'); }}
            />
          )}
          {errors.paidFrom ? <Text style={styles.errorText}>{errors.paidFrom}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Payment Mode</Text>
          <RadioGroup value={mode} options={PAYMENT_MODES} onChange={setMode} />

          <Text style={[styles.label, styles.labelSpacing]}>Expense Date</Text>
          <View style={[styles.inputRow, errors.date ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.lightGray}
              value={date}
              onChangeText={(t) => { setDate(t); clearError('date'); }}
            />
          </View>
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Notes (optional)</Text>
          <View style={[styles.inputRow, styles.textArea]}>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="What was this expense for?"
              placeholderTextColor={COLORS.lightGray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save Expense</Text>
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
  hintText: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});