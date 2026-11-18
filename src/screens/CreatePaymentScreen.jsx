import { useEffect, useMemo, useState } from 'react';
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
import { getSide, journalLegsFor, sameName, summarizeInvoices } from '../app/utils/invoiceHelpers';
import { COLORS } from '../app/utils/theme';
import { validateAmount, validateRequired } from '../app/utils/validators';
import ContraForm from '../components/ContraForm';
import DateField, { formatDate } from '../components/DateField';
import DropdownField from '../components/DropdownField';
import RadioGroup from '../components/RadioGroup';

const CASH_BANK_GROUPS = ['Cash-in-Hand', 'Bank Accounts'];

const VOUCHER_OPTIONS = [
  { value: 'payment', label: 'Payment', description: 'You paid someone, by cash or bank' },
  { value: 'receipt', label: 'Receipt', description: 'You received money from someone, by cash or bank' },
  { value: 'contra', label: 'Contra', description: 'Cash deposit, cash withdrawal, or bank-to-bank transfer' },
  { value: 'settlement', label: 'Settlement', description: 'The buyer paid the seller directly' },
];
const VOUCHER_WORD = { payment: 'Payment', receipt: 'Receipt', settlement: 'Settlement' };
const VOUCHER_HINT = {
  payment: 'You paid someone — by cash or bank — against one invoice or several.',
  receipt: 'You received money from someone — by cash or bank — against one invoice or several.',
  contra: 'Move money between cash and bank, or between two of your bank accounts.',
  settlement: 'The buyer paid the seller directly — against one invoice or several. It settles both sides.',
};

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) => `₹ ${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function CreatePaymentScreen({ navigation = null, onBack, onSave }) {
  const [voucherType, setVoucherType] = useState('payment'); // 'payment' | 'receipt' | 'contra' | 'settlement'
  const [party, setParty] = useState(''); // payment / receipt
  const [fromParty, setFromParty] = useState(''); // settlement: the buyer who paid
  const [toParty, setToParty] = useState(''); // settlement: the seller who was paid
  const [account, setAccount] = useState(''); // payment: paid from, receipt: received in
  const [invoiceMode, setInvoiceMode] = useState('single'); // 'single' | 'multiple'
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [amount, setAmount] = useState(''); // single-invoice amount
  const [allocations, setAllocations] = useState({}); // multiple: { [invoiceId]: 'amountString' }
  const [allocationDates, setAllocationDates] = useState({}); // multiple: { [invoiceId]: Date }
  const [date, setDate] = useState(null); // single-invoice date
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const [buyerNames, setBuyerNames] = useState([]);
  const [sellerNames, setSellerNames] = useState([]);
  const [accountNames, setAccountNames] = useState(['Cash']);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [allJournals, setAllJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-load every time this screen mounts, so a party/invoice/payment created moments ago is reflected here.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [buyers, sellers, invoices, payments, journals, ledgers] = await Promise.all([
        dataStore.buyers.getAll(),
        dataStore.sellers.getAll(),
        dataStore.invoices.getAll(),
        dataStore.payments.getAll(),
        dataStore.journals.getAll(),
        dataStore.ledgers.getAll(),
      ]);
      if (!isMounted) return;
      setBuyerNames(buyers.map((b) => b.name));
      setSellerNames(sellers.map((s) => s.name));
      setAllInvoices(invoices);
      setAllPayments(payments);
      setAllJournals(journals);
      // "Cash" is always available, followed by any bank / cash-in-hand ledgers you've created
      const ledgerNames = ledgers
        .filter((l) => CASH_BANK_GROUPS.includes(l.ledgerGroup))
        .map((l) => l.ledgerName)
        .filter((name) => name.trim().toLowerCase() !== 'cash');
      setAccountNames(['Cash', ...ledgerNames]);
      setLoading(false);
    })();
    return () => { isMounted = false; };
  }, []);

  const isSettlement = voucherType === 'settlement';
  const isReceipt = voucherType === 'receipt';
  const direction = isReceipt ? 'in' : 'out'; // payment / receipt only
  const word = VOUCHER_WORD[voucherType] || '';
  const parties = isReceipt ? buyerNames : sellerNames;
  // 'sales' invoices are paid by buyers (receipt); 'purchase' invoices are paid to sellers (payment)
  const relevantSide = isReceipt ? 'sales' : 'purchase';

  // The open invoices this entry can be applied against, each with its outstanding balance
  const partyInvoices = useMemo(() => {
    if (voucherType === 'contra') return [];
    const summaries = summarizeInvoices(allInvoices, allPayments, allJournals);

    if (isSettlement) {
      if (!fromParty.trim() || !toParty.trim()) return [];
      return summaries.flatMap((inv) => {
        // A settlement from the buyer to the seller clears whichever sides of the invoice they're on
        const legs = journalLegsFor(inv, fromParty, toParty);
        const open = [];
        if (legs.in) open.push(inv.balanceIn ?? inv.balance);
        if (legs.out) open.push(inv.balanceOut ?? inv.balance);
        if (open.length === 0) return [];
        const balance = Math.min(...open);
        if (balance <= 0) return [];
        const side = getSide(inv);
        const detail =
          side === 'transfer'
            ? `Buyer owes ${money(inv.balanceIn)} · You owe seller ${money(inv.balanceOut)}`
            : side === 'sales'
              ? `Buyer owes ${money(inv.balance)}`
              : `You owe seller ${money(inv.balance)}`;
        return [{ id: inv.id, balance, detail }];
      });
    }

    const target = party.trim().toLowerCase();
    return summaries.flatMap((inv) => {
      const side = getSide(inv);
      if (side === 'transfer') {
        // Direct transfer: the buyer owes you (receipt), you owe the seller (payment)
        const name = isReceipt ? inv.buyer : inv.seller;
        const balance = isReceipt ? inv.balanceIn : inv.balanceOut;
        return name && name.trim().toLowerCase() === target && balance > 0 ? [{ id: inv.id, balance }] : [];
      }
      const matches = side === relevantSide && inv.party && inv.party.trim().toLowerCase() === target;
      return matches && inv.balance > 0 ? [{ id: inv.id, balance: inv.balance }] : [];
    });
  }, [voucherType, isSettlement, isReceipt, allInvoices, allPayments, allJournals, party, fromParty, toParty, relevantSide]);

  const selectedInvoices = Object.keys(allocations);
  const allocatedTotal = useMemo(
    () => Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
    [allocations]
  );

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const resetSelection = () => {
    setSelectedInvoice('');
    setAllocations({});
    setAllocationDates({});
    setAmount('');
  };

  const changeVoucherType = (value) => {
    setVoucherType(value);
    setParty('');
    setFromParty('');
    setToParty('');
    setAccount('');
    resetSelection();
    setErrors({});
  };

  const handlePartySelect = (p) => {
    setParty(p);
    resetSelection();
    clearError('party');
  };

  // Ticking an invoice in "multiple" mode defaults its amount to the full balance (a full payment) —
  // it can then be edited down for a partial one. Each ticked invoice also gets its own date.
  const toggleInvoiceSelection = (inv) => {
    const isOn = allocations[inv.id] !== undefined;
    setAllocationDates((prev) => {
      const next = { ...prev };
      if (isOn) {
        delete next[inv.id];
      } else {
        const used = Object.values(next);
        next[inv.id] = used.length ? used[used.length - 1] : new Date();
      }
      return next;
    });
    setAllocations((prev) => {
      const next = { ...prev };
      if (next[inv.id] !== undefined) delete next[inv.id];
      else next[inv.id] = String(inv.balance);
      return next;
    });
    clearError('invoices');
    clearError('allocations');
  };

  const updateAllocation = (id, value) => {
    setAllocations((prev) => ({ ...prev, [id]: value.replace(/[^0-9.]/g, '') }));
    clearError('allocations');
  };

  const updateAllocationDate = (id, d) => {
    setAllocationDates((prev) => ({ ...prev, [id]: d }));
    clearError('allocations');
  };

  const handleSelectSingleInvoice = (inv) => {
    setSelectedInvoice(inv.id);
    setAmount(String(inv.balance));
    clearError('invoices');
  };

  const validate = () => {
    const next = {};
    if (isSettlement) {
      next.fromParty = validateRequired(fromParty, 'Buyer');
      next.toParty = validateRequired(toParty, 'Seller');
      if (!next.fromParty && !next.toParty && sameName(fromParty, toParty)) {
        next.toParty = 'Buyer and seller must be different';
      }
    } else {
      next.party = validateRequired(party, 'Party');
      next.account = account ? '' : 'Select an account';
    }
    next.date = invoiceMode === 'single' ? validateRequired(date, 'Date') : '';

    if (invoiceMode === 'single') {
      const stillValid = partyInvoices.find((i) => i.id === selectedInvoice);
      if (!selectedInvoice || !stillValid) {
        next.invoices = 'Select an invoice';
      } else {
        next.amount = validateAmount(amount);
        if (!next.amount && Number(amount) > stillValid.balance) {
          next.amount = `More than the ${money(stillValid.balance)} outstanding on this invoice`;
        }
      }
    } else {
      const chosen = partyInvoices.filter((inv) => allocations[inv.id] !== undefined);
      if (chosen.length === 0) {
        next.invoices = 'Select at least one invoice';
      } else {
        // Each amount must be a valid number and not exceed that invoice's balance
        const overLimit = chosen.find((inv) => Number(allocations[inv.id]) <= 0 || Number(allocations[inv.id]) > inv.balance);
        if (overLimit) {
          next.allocations = `Amount for ${overLimit.id} must be between ₹1 and its balance`;
        } else {
          const noDate = chosen.find((inv) => !allocationDates[inv.id]);
          if (noDate) next.allocations = `Choose a ${word.toLowerCase()} date for ${noDate.id}`;
        }
      }
    }

    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const buildBase = () =>
    isSettlement
      ? { entryType: 'settlement', voucherType: 'Settlement', fromParty: fromParty.trim(), toParty: toParty.trim() }
      : { voucherType: word, direction, party: party.trim(), account, mode: account };

  const handleSave = () => {
    if (!validate()) return;

    if (invoiceMode === 'single') {
      if (onSave) {
        onSave({
          ...buildBase(),
          invoiceMode,
          invoices: [{ id: selectedInvoice, amount }],
          amount,
          date: formatDate(date),
          notes: notes.trim(),
        });
      }
      return;
    }

    // Each invoice has its own date. Invoices on the same date stay together in one record;
    // invoices on different dates are saved as separate records.
    const groups = {};
    partyInvoices
      .filter((inv) => allocations[inv.id] !== undefined)
      .forEach((inv) => {
        const dateText = formatDate(allocationDates[inv.id] || new Date());
        if (!groups[dateText]) groups[dateText] = [];
        groups[dateText].push({ id: inv.id, amount: allocations[inv.id], balance: inv.balance });
      });

    const records = Object.keys(groups).map((dateText) => {
      const sum = groups[dateText].reduce((total, i) => total + (Number(i.amount) || 0), 0);
      return {
        ...buildBase(),
        invoiceMode,
        invoices: groups[dateText],
        amount: String(round2(sum)),
        date: dateText,
        notes: notes.trim(),
      };
    });

    if (onSave) onSave(records);
  };

  const hasParties = isSettlement ? fromParty.trim() && toParty.trim() : party.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Payment</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Payment direction */}
          <Text style={styles.label}>Payment Direction</Text>
          <DropdownField
            value={voucherType}
            options={VOUCHER_OPTIONS}
            title="Select Payment Direction"
            onSelect={changeVoucherType}
          />
          <Text style={styles.hintText}>{VOUCHER_HINT[voucherType]}</Text>

          {voucherType === 'contra' ? (
            <ContraForm onSave={onSave} />
          ) : (
            <>
              {/* Parties */}
              {isSettlement ? (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>From (Buyer who paid)</Text>
                  <DropdownField
                    value={fromParty}
                    options={buyerNames}
                    allowCustom
                    title="Select Buyer"
                    placeholder="Select or search the buyer"
                    error={errors.fromParty}
                    onSelect={(v) => { setFromParty(v); resetSelection(); clearError('fromParty'); }}
                  />
                  {errors.fromParty ? <Text style={styles.errorText}>{errors.fromParty}</Text> : null}

                  <Text style={[styles.label, styles.labelSpacing]}>To (Seller who was paid)</Text>
                  <DropdownField
                    value={toParty}
                    options={sellerNames}
                    allowCustom
                    title="Select Seller"
                    placeholder="Select or search the seller"
                    error={errors.toParty}
                    onSelect={(v) => { setToParty(v); resetSelection(); clearError('toParty'); }}
                  />
                  {errors.toParty ? <Text style={styles.errorText}>{errors.toParty}</Text> : null}
                </>
              ) : (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>{isReceipt ? 'Received From' : 'Paid To'}</Text>
                  <DropdownField
                    value={party}
                    options={parties}
                    allowCustom
                    title="Select Party"
                    placeholder="Select or search a party"
                    error={errors.party}
                    onSelect={handlePartySelect}
                  />
                  {errors.party ? <Text style={styles.errorText}>{errors.party}</Text> : null}

                  {/* Cash or bank */}
                  <Text style={[styles.label, styles.labelSpacing]}>{isReceipt ? 'Received In' : 'Paid From'}</Text>
                  <DropdownField
                    value={account}
                    options={accountNames}
                    title="Select Account"
                    placeholder="Select cash or bank account"
                    error={errors.account}
                    onSelect={(v) => { setAccount(v); clearError('account'); }}
                  />
                  {errors.account ? <Text style={styles.errorText}>{errors.account}</Text> : null}
                </>
              )}

              {/* Invoice mode */}
              <Text style={[styles.label, styles.labelSpacing]}>Apply Against</Text>
              <RadioGroup
                value={invoiceMode}
                options={[{ value: 'single', label: 'Single Invoice' }, { value: 'multiple', label: 'Multiple Invoices' }]}
                onChange={(v) => {
                  if (v === 'single') { setInvoiceMode('single'); setAllocations({}); setAllocationDates({}); setAmount(''); }
                  else { setInvoiceMode('multiple'); setSelectedInvoice(''); setAmount(''); }
                }}
              />

              {!hasParties ? (
                <Text style={styles.hintText}>
                  {isSettlement
                    ? 'Select the buyer and the seller above to see the invoices they share'
                    : 'Select a party above to see their open invoices'}
                </Text>
              ) : partyInvoices.length === 0 ? (
                <Text style={styles.hintText}>
                  {isSettlement ? 'No open invoices link these two parties' : 'No open invoices for this party'}
                </Text>
              ) : invoiceMode === 'single' ? (
                <View style={styles.invoiceList}>
                  {partyInvoices.map((inv) => (
                    <TouchableOpacity
                      key={inv.id}
                      style={[styles.invoiceOption, selectedInvoice === inv.id ? styles.invoiceOptionSelected : null]}
                      onPress={() => handleSelectSingleInvoice(inv)}
                    >
                      <View style={styles.invoiceOptionTopRow}>
                        <View style={styles.radioOuter}>
                          {selectedInvoice === inv.id ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text style={styles.invoiceIdText}>{inv.id}</Text>
                        <Text style={styles.invoiceBalanceText}>{money(inv.balance)}</Text>
                      </View>
                      {inv.detail ? <Text style={styles.invoiceDetailText}>{inv.detail}</Text> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.invoiceList}>
                  {partyInvoices.map((inv) => {
                    const isSelected = allocations[inv.id] !== undefined;
                    const allocValue = allocations[inv.id] || '';
                    const allocNum = Number(allocValue) || 0;
                    const isFull = isSelected && allocNum === inv.balance;
                    const isOver = isSelected && allocNum > inv.balance;
                    return (
                      <View key={inv.id} style={[styles.invoiceOption, isSelected ? styles.invoiceOptionSelected : null]}>
                        <TouchableOpacity style={styles.invoiceOptionTopRow} onPress={() => toggleInvoiceSelection(inv)} activeOpacity={0.7}>
                          <View style={[styles.checkboxOuter, isSelected ? styles.checkboxOuterChecked : null]}>
                            {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                          </View>
                          <Text style={styles.invoiceIdText}>{inv.id}</Text>
                          <Text style={styles.invoiceBalanceText}>{money(inv.balance)}</Text>
                        </TouchableOpacity>
                        {inv.detail ? <Text style={styles.invoiceDetailText}>{inv.detail}</Text> : null}

                        {isSelected ? (
                          <>
                            <View style={styles.allocationRow}>
                              <Text style={styles.allocationLabel}>Amount</Text>
                              <View style={[styles.allocationInputWrap, isOver ? styles.inputRowError : null]}>
                                <Text style={styles.rupeeSign}>₹</Text>
                                <TextInput
                                  style={styles.allocationInput}
                                  keyboardType="decimal-pad"
                                  value={allocValue}
                                  onChangeText={(t) => updateAllocation(inv.id, t)}
                                />
                              </View>
                              <View style={[styles.statusPill, isFull ? styles.statusPillFull : styles.statusPillPartial]}>
                                <Text style={[styles.statusPillText, isFull ? styles.statusPillTextFull : styles.statusPillTextPartial]}>
                                  {isFull ? 'Full' : 'Partial'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.allocationDateWrap}>
                              <Text style={styles.allocationDateLabel}>{word} Date</Text>
                              <DateField
                                value={allocationDates[inv.id]}
                                onChange={(d) => updateAllocationDate(inv.id, d)}
                                placeholder={`Select ${word.toLowerCase()} date`}
                                maximumDate={new Date()}
                              />
                            </View>
                          </>
                        ) : null}
                      </View>
                    );
                  })}
                  {selectedInvoices.length > 0 ? (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total {word} Amount</Text>
                      <Text style={styles.totalValue}>{money(allocatedTotal)}</Text>
                    </View>
                  ) : null}
                  {errors.allocations ? <Text style={styles.errorText}>{errors.allocations}</Text> : null}
                </View>
              )}
              {errors.invoices ? <Text style={styles.errorText}>{errors.invoices}</Text> : null}

              {invoiceMode === 'single' && selectedInvoice ? (
                <View style={styles.againstBox}>
                  <Text style={styles.againstLabel}>Against</Text>
                  <Text style={styles.againstValue}>{selectedInvoice}</Text>
                </View>
              ) : null}

              {invoiceMode === 'multiple' && selectedInvoices.length > 0 ? (
                <View style={styles.againstBox}>
                  <Text style={styles.againstLabel}>Against</Text>
                  {partyInvoices
                    .filter((inv) => allocations[inv.id] !== undefined)
                    .map((inv) => {
                      const allocNum = Number(allocations[inv.id]) || 0;
                      return (
                        <Text key={inv.id} style={styles.againstLine}>
                          {inv.id} — {money(allocNum)} ({allocNum === inv.balance ? 'Full' : 'Partial'})
                        </Text>
                      );
                    })}
                </View>
              ) : null}

              {/* Amount and date — single-invoice entries; multiple-invoice entries take them per invoice */}
              {invoiceMode === 'single' ? (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>{word} Amount (₹)</Text>
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

                  <Text style={[styles.label, styles.labelSpacing]}>{word} Date</Text>
                  <DateField
                    value={date}
                    onChange={(d) => { setDate(d); clearError('date'); }}
                    placeholder={`Select ${word.toLowerCase()} date`}
                    error={errors.date}
                    maximumDate={new Date()}
                  />
                  {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
                </>
              ) : null}

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
                <Text style={styles.saveText}>Save {word}</Text>
              </TouchableOpacity>
            </>
          )}
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
  segmentRow: { flexDirection: 'row' },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  segmentText: { fontSize: 12.5, color: COLORS.navy, fontWeight: '600', textAlign: 'center' },
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
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
  hintText: { fontSize: 12, color: COLORS.gray, marginTop: 10, fontStyle: 'italic' },
  invoiceList: { marginTop: 10 },
  invoiceOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  invoiceOptionTopRow: { flexDirection: 'row', alignItems: 'center' },
  invoiceOptionSelected: { borderColor: COLORS.blue, backgroundColor: '#EEF2FF' },
  invoiceDetailText: { fontSize: 11, color: COLORS.gray, marginTop: 6, marginLeft: 32 },
  allocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  allocationDateWrap: { marginTop: 10 },
  allocationDateLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 6 },
  allocationLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginRight: 10 },
  allocationInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: COLORS.white,
  },
  rupeeSign: { fontSize: 13, color: COLORS.navy, marginRight: 4 },
  allocationInput: { flex: 1, fontSize: 13, color: COLORS.navy, padding: 0 },
  statusPill: { marginLeft: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusPillFull: { backgroundColor: COLORS.greenBg },
  statusPillPartial: { backgroundColor: COLORS.orangeBg },
  statusPillText: { fontSize: 10.5, fontWeight: '700' },
  statusPillTextFull: { color: COLORS.green },
  statusPillTextPartial: { color: COLORS.orange },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.blue },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOuterChecked: { backgroundColor: COLORS.blue },
  checkmark: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  invoiceIdText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.navy },
  invoiceBalanceText: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  totalValue: { fontSize: 14, color: COLORS.navy, fontWeight: '700' },
  againstBox: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, marginTop: 14 },
  againstLabel: { fontSize: 12, color: COLORS.blue, fontWeight: '700', marginBottom: 4 },
  againstValue: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  againstLine: { fontSize: 13, color: COLORS.navy, fontWeight: '500', marginTop: 2 },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});