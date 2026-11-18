import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { dataStore } from '../app/utils/dataStore';
import { COLORS } from '../app/utils/theme';
import { validateAmount } from '../app/utils/validators';
import DateField, { formatDate } from './DateField';
import DropdownField from './DropdownField';
import RadioGroup from './RadioGroup';

const CONTRA_TYPES = [
  { key: 'Deposit', hint: 'Cash deposited into a bank account.' },
  { key: 'Withdrawal', hint: 'Cash withdrawn from a bank account.' },
  { key: 'Transfer', hint: 'Money moved from one bank account to another.' },
];

// What each type moves between: cash and bank, or bank and bank
const FROM_LABEL = { Deposit: 'From (Cash)', Withdrawal: 'From (Bank Account)', Transfer: 'From (Bank Account)' };
const TO_LABEL = { Deposit: 'To (Bank Account)', Withdrawal: 'To (Cash)', Transfer: 'To (Bank Account)' };

export default function ContraForm({ onSave }) {
  const [contraType, setContraType] = useState('Deposit');
  const [fromAccount, setFromAccount] = useState('Cash');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [cashAccounts, setCashAccounts] = useState(['Cash']);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const ledgers = await dataStore.ledgers.getAll();
      if (!isMounted) return;
      const cashLedgers = ledgers
        .filter((l) => l.ledgerGroup === 'Cash-in-Hand')
        .map((l) => l.ledgerName)
        .filter((name) => name.trim().toLowerCase() !== 'cash');
      setCashAccounts(['Cash', ...cashLedgers]);
      setBankAccounts(ledgers.filter((l) => l.ledgerGroup === 'Bank Accounts').map((l) => l.ledgerName));
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const changeType = (type) => {
    setContraType(type);
    // Cash side defaults to "Cash"; bank sides start empty so a bank is always picked on purpose
    setFromAccount(type === 'Deposit' ? 'Cash' : '');
    setToAccount(type === 'Withdrawal' ? 'Cash' : '');
    setErrors({});
  };

  const fromOptions = contraType === 'Deposit' ? cashAccounts : bankAccounts;
  const toOptions = contraType === 'Withdrawal' ? cashAccounts : bankAccounts;
  const hint = CONTRA_TYPES.find((c) => c.key === contraType).hint;

  const validate = () => {
    const next = {};
    next.fromAccount = fromAccount ? '' : contraType === 'Deposit' ? 'Select the cash account' : 'Select the bank account';
    next.toAccount = toAccount ? '' : contraType === 'Withdrawal' ? 'Select the cash account' : 'Select the bank account';
    if (!next.fromAccount && !next.toAccount && fromAccount === toAccount) {
      next.toAccount = 'From and To account must be different';
    }
    next.amount = validateAmount(amount);
    next.date = date ? '' : 'Date is required';
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) {
      onSave({
        entryType: 'contra',
        voucherType: 'Contra',
        contraType,
        fromAccount,
        toAccount,
        amount: Number(amount),
        reference: reference.trim(),
        date: formatDate(date),
        notes: notes.trim(),
      });
    }
  };

  const noBankYet = !loading && bankAccounts.length === 0;

  return (
    <View>
      <Text style={[styles.label, styles.labelSpacing]}>Contra Type</Text>
      <RadioGroup value={contraType} options={CONTRA_TYPES.map((c) => c.key)} onChange={changeType} />
      <Text style={styles.hintText}>{hint}</Text>

      {noBankYet ? (
        <Text style={styles.warnText}>
          No bank account yet — create one first (Create Ledger → Bank Accounts).
        </Text>
      ) : null}

      <Text style={[styles.label, styles.labelSpacing]}>{FROM_LABEL[contraType]}</Text>
      <DropdownField
        value={fromAccount}
        options={fromOptions}
        title={FROM_LABEL[contraType]}
        placeholder="Select account"
        error={errors.fromAccount}
        onSelect={(v) => { setFromAccount(v); clearError('fromAccount'); }}
      />
      {errors.fromAccount ? <Text style={styles.errorText}>{errors.fromAccount}</Text> : null}

      <Text style={[styles.label, styles.labelSpacing]}>{TO_LABEL[contraType]}</Text>
      <DropdownField
        value={toAccount}
        options={toOptions}
        title={TO_LABEL[contraType]}
        placeholder="Select account"
        error={errors.toAccount}
        onSelect={(v) => { setToAccount(v); clearError('toAccount'); }}
      />
      {errors.toAccount ? <Text style={styles.errorText}>{errors.toAccount}</Text> : null}

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

      <Text style={[styles.label, styles.labelSpacing]}>Reference (cheque / UTR no., optional)</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. cheque number or transaction id"
          placeholderTextColor={COLORS.lightGray}
          value={reference}
          onChangeText={setReference}
        />
      </View>

      <Text style={[styles.label, styles.labelSpacing]}>Date</Text>
      <DateField
        value={date}
        onChange={(d) => { setDate(d); clearError('date'); }}
        placeholder="Select date"
        error={errors.date}
        maximumDate={new Date()}
      />
      {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

      <Text style={[styles.label, styles.labelSpacing]}>Notes (optional)</Text>
      <View style={[styles.inputRow, styles.textArea]}>
        <TextInput
          style={[styles.input, styles.textAreaInput]}
          placeholder="Add a note"
          placeholderTextColor={COLORS.lightGray}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
        <Text style={styles.saveText}>Save Contra</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: COLORS.navy, marginBottom: 8 },
  labelSpacing: { marginTop: 18 },
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
  segmentText: { fontSize: 13, color: COLORS.navy, fontWeight: '600', textAlign: 'center' },
  segmentTextActive: { color: COLORS.white },
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
  hintText: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 8 },
  warnText: { fontSize: 12, color: COLORS.orange, fontWeight: '600', marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { borderColor: COLORS.blue, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 12, color: COLORS.navy },
  chipTextSelected: { color: COLORS.blue, fontWeight: '700' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});