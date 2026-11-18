import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { getSide, isReturn, nextDocNumber, sameName } from '../app/utils/invoiceHelpers';
import { COLORS } from '../app/utils/theme';
import { validateAmount, validateRequired } from '../app/utils/validators';
import DateField, { formatDate } from '../components/DateField';
import DropdownField from '../components/DropdownField';
import ItemsEditor, {
  createEmptyItem,
  itemsTax,
  itemsTotal,
  serializeItems,
  validateItems,
} from '../components/ItemsEditor';
import RadioGroup from '../components/RadioGroup';

const INVOICE_TYPE_OPTIONS = [
  { value: 'Sales', label: 'Sales', description: 'Sell goods to a buyer' },
  { value: 'Purchase', label: 'Purchase', description: 'Buy goods from a seller' },
  { value: 'Return', label: 'Return', description: 'Sales return or purchase return' },
  { value: 'Transfer Goods', label: 'Transfer Goods', description: 'Goods go directly from seller to buyer' },
];
const RETURN_TYPES = ['Sales Return', 'Purchase Return'];
const RETURN_KINDS = [
  { value: 'normal', label: 'Normal Return' },
  { value: 'transfer', label: 'Transfer Goods Return' },
];
const PAYMENT_TYPES = ['Credit', 'Cash'];
const CASH_BANK_GROUPS = ['Cash-in-Hand', 'Bank Accounts'];
const TAX_KINDS = [
  { value: 'tax', label: 'Tax Invoice' },
  { value: 'nontax', label: 'Non-Taxable' },
];
const SUPPLY_TYPES = [
  { value: 'intra', label: 'Within State' },
  { value: 'inter', label: 'Other State' },
];
const ITEM_MODE_OPTIONS = [
  { value: true, label: 'With Item Breakup' },
  { value: false, label: 'Without Item Breakup' },
];
const MODE_OPTIONS = [
  { value: true, label: 'With Invoice' },
  { value: false, label: 'Without Invoice' },
];
const LUMP_GST_RATES = ['0', '5', '12', '18', '28'];

const round2 = (n) => Math.round(n * 100) / 100;
const money = (n) =>
  `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

let entryCounter = 0;
const newEntry = () => {
  entryCounter += 1;
  return {
    key: `entry-${Date.now()}-${entryCounter}`,
    number: '',
    numberEdited: false, // true once the person typed their own number
    originalInvoice: '', // returns only
    items: [createEmptyItem()],
    itemErrors: [],
    lumpAmount: '',
    lumpDescription: '',
    lumpTaxRate: '18',
    date: new Date(),
    errors: {},
  };
};

// Fills in a suggested number for every entry the person hasn't typed one for,
// continuing from the highest existing number and skipping any number they typed themselves.
function applySuggestions(list, records, prefix, start) {
  const editedNumbers = new Set(
    list.filter((e) => e.numberEdited).map((e) => e.number.trim().toLowerCase())
  );
  const used = [...records];
  return list.map((e) => {
    if (e.numberEdited) return e;
    let num = nextDocNumber(used, prefix, start);
    while (editedNumbers.has(num.toLowerCase())) {
      used.push({ id: num });
      num = nextDocNumber(used, prefix, start);
    }
    used.push({ id: num });
    return { ...e, number: num };
  });
}

export default function CreateInvoiceScreen({ navigation = null, onBack, onSave }) {
  const [invoiceType, setInvoiceType] = useState('Sales');
  const [returnType, setReturnType] = useState('Sales Return');
  const [returnKind, setReturnKind] = useState('normal'); // 'normal' | 'transfer'
  const [paymentType, setPaymentType] = useState('Credit');
  const [withInvoice, setWithInvoice] = useState(true); // false = unbilled entries (no invoice issued)
  const [withItems, setWithItems] = useState(true); // false = one lump-sum amount per invoice
  const [taxKind, setTaxKind] = useState('tax'); // 'tax' | 'nontax'
  const [supplyType, setSupplyType] = useState('intra'); // 'intra' (CGST+SGST) | 'inter' (IGST)
  const [party, setParty] = useState('');
  const [account, setAccount] = useState('');
  const [seller, setSeller] = useState(''); // Transfer Goods: who the goods come from
  const [buyer, setBuyer] = useState(''); // Transfer Goods: who the goods go to
  const [errors, setErrors] = useState({});
  const [entries, setEntries] = useState(() => [newEntry()]);

  const [buyerNames, setBuyerNames] = useState([]);
  const [sellerNames, setSellerNames] = useState([]);
  const [invoiceRecords, setInvoiceRecords] = useState([]);
  const [accountNames, setAccountNames] = useState(['Cash']);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [buyers, sellers, invoices, ledgers] = await Promise.all([
        dataStore.buyers.getAll(),
        dataStore.sellers.getAll(),
        dataStore.invoices.getAll(),
        dataStore.ledgers.getAll(),
      ]);
      if (!isMounted) return;
      setBuyerNames(buyers.map((b) => b.name));
      setSellerNames(sellers.map((s) => s.name));
      setInvoiceRecords(invoices);
      // "Cash" is always available, followed by any bank / cash-in-hand ledgers you've created
      const ledgerNames = ledgers
        .filter((l) => CASH_BANK_GROUPS.includes(l.ledgerGroup))
        .map((l) => l.ledgerName)
        .filter((name) => name.trim().toLowerCase() !== 'cash');
      setAccountNames(['Cash', ...ledgerNames]);
    })();
    return () => { isMounted = false; };
  }, []);

  const isReturnType = invoiceType === 'Return';
  const isTransfer = invoiceType === 'Transfer Goods';
  const isTransferReturn = isReturnType && returnKind === 'transfer'; // goods sent back against a transfer-goods invoice
  const showTransferParties = isTransfer || isTransferReturn; // seller + buyer instead of a single party
  const returnLabel = isTransferReturn ? 'Transfer Goods Return' : returnType;
  const isSalesSide = invoiceType === 'Sales' || (isReturnType && returnType === 'Sales Return');
  const partyLabel = isSalesSide ? 'Buyer' : 'Seller';
  const partyOptions = isSalesSide ? buyerNames : sellerNames;
  const isTaxable = withInvoice && taxKind === 'tax';

  // Number series: INV- / RET- for real invoices, NB- / NBR- for unbilled entries
  const numberPrefix = isReturnType ? (withInvoice ? 'RET' : 'NBR') : withInvoice ? 'INV' : 'NB';
  const numberStart = isReturnType ? 1001 : withInvoice ? 10024 : 1001;
  const numberLabel = isReturnType ? 'Return Number' : withInvoice ? 'Invoice Number' : 'Entry Number';
  const docWord = isReturnType ? 'Return' : 'Invoice';

  // Keep suggested numbers up to date as records load or the number series changes
  useEffect(() => {
    setEntries((prev) => applySuggestions(prev, invoiceRecords, numberPrefix, numberStart));
  }, [invoiceRecords, numberPrefix, numberStart]);

  const accountLabel = !isReturnType
    ? (isSalesSide ? 'Received In' : 'Paid From')
    : (isSalesSide ? 'Refunded From' : 'Refund Received In');

  let paymentHint = 'Settled immediately — nothing stays outstanding.';
  if (paymentType === 'Credit') {
    if (isReturnType) paymentHint = "Adjusts the party's outstanding balance (credit note).";
    else if (isSalesSide) paymentHint = 'The buyer owes this amount until you record a payment.';
    else paymentHint = 'You owe the seller this amount until you record a payment.';
  }

  const originalOptions = useMemo(
    () =>
      invoiceRecords
        .filter(
          (r) =>
            !isReturn(r) &&
            getSide(r) === (isTransferReturn ? 'transfer' : isSalesSide ? 'sales' : 'purchase') &&
            (r.withInvoice !== false) === withInvoice &&
            // a transfer return can be narrowed to the seller and buyer already chosen
            (!isTransferReturn ||
              ((!seller.trim() || sameName(r.seller, seller)) && (!buyer.trim() || sameName(r.buyer, buyer))))
        )
        .map((r) => ({
          value: r.id,
          label: r.id,
          description: `${r.party || [r.seller, r.buyer].filter(Boolean).join(' → ') || r.account || ''} · ₹ ${(Number(r.amount) || 0).toLocaleString('en-IN')}`,
        })),
    [invoiceRecords, isSalesSide, withInvoice, isTransferReturn, seller, buyer]
  );

  // Subtotal / GST / total for each entry
  const entryTotals = useMemo(
    () =>
      entries.map((e) => {
        const subtotal = withItems ? itemsTotal(e.items) : parseFloat(e.lumpAmount) || 0;
        let tax = 0;
        if (isTaxable) {
          tax = withItems ? itemsTax(e.items) : (subtotal * (Number(e.lumpTaxRate) || 0)) / 100;
        }
        return { subtotal, tax, total: subtotal + tax };
      }),
    [entries, withItems, isTaxable]
  );
  const grandTotal = entryTotals.reduce((sum, t) => sum + t.total, 0);
  const first = entryTotals[0] || { subtotal: 0, tax: 0, total: 0 };
  const cgst = isTaxable && supplyType === 'intra' ? first.tax / 2 : 0;
  const sgst = cgst;
  const igst = isTaxable && supplyType === 'inter' ? first.tax : 0;

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  // ---- entry helpers ----
  const updateEntry = (key, patch) =>
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, ...(typeof patch === 'function' ? patch(e) : patch) } : e))
    );

  const clearEntryError = (key, field) =>
    updateEntry(key, (e) => ({ errors: { ...e.errors, [field]: '' } }));

  const addEntry = () =>
    setEntries((prev) => applySuggestions([...prev, newEntry()], invoiceRecords, numberPrefix, numberStart));

  const removeEntry = (key) =>
    setEntries((prev) =>
      applySuggestions(prev.filter((e) => e.key !== key), invoiceRecords, numberPrefix, numberStart)
    );

  const applySuggestedNumber = (key) =>
    setEntries((prev) =>
      applySuggestions(
        prev.map((e) => (e.key === key ? { ...e, numberEdited: false } : e)),
        invoiceRecords,
        numberPrefix,
        numberStart
      )
    );

  const resetPartyFields = () => {
    setParty('');
    setSeller('');
    setBuyer('');
    clearError('party');
    clearError('seller');
    clearError('buyer');
    setEntries((prev) =>
      prev.map((e) => ({ ...e, originalInvoice: '', errors: { ...e.errors, originalInvoice: '' } }))
    );
  };

  // Several unbilled entries can be added at once, but a real invoice is created one at a time.
  const changeInvoiceMode = (value) => {
    if (value === withInvoice) return;
    const apply = (keepFirstOnly) => {
      setWithInvoice(value);
      setEntries((prev) =>
        (keepFirstOnly ? prev.slice(0, 1) : prev).map((e) => ({
          ...e,
          numberEdited: false,
          originalInvoice: '',
          errors: { ...e.errors, originalInvoice: '' },
        }))
      );
    };
    if (value && entries.length > 1) {
      Alert.alert(
        'One invoice at a time',
        `A real invoice is created one at a time. Keep the first and remove the other ${entries.length - 1}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Keep first', style: 'destructive', onPress: () => apply(true) },
        ]
      );
      return;
    }
    apply(false);
  };

  const changeItemMode = (value) => {
    setWithItems(value);
    setEntries((prev) =>
      prev.map((e) => ({ ...e, itemErrors: [], errors: { ...e.errors, lumpAmount: '' } }))
    );
  };

  // Picking/typing an original invoice makes a single return follow that invoice's mode and tax treatment.
  const applyOriginal = (key, id) => {
    updateEntry(key, (e) => ({ originalInvoice: id, errors: { ...e.errors, originalInvoice: '' } }));
    if (entries.length !== 1) return;
    const match = invoiceRecords.find((r) => r.id === id.trim());
    if (match) {
      setWithInvoice(match.withInvoice !== false);
      setTaxKind(match.taxType === 'Taxable' ? 'tax' : 'nontax');
      if (match.supplyType) setSupplyType(match.supplyType);
      if (isTransferReturn && getSide(match) === 'transfer') {
        setSeller(match.seller || '');
        setBuyer(match.buyer || '');
        clearError('seller');
        clearError('buyer');
      }
    }
  };

  const validate = () => {
    const next = {};
    if (showTransferParties) {
      next.seller = validateRequired(seller, 'Seller');
      next.buyer = validateRequired(buyer, 'Buyer');
      if (!next.seller && !next.buyer && seller.trim().toLowerCase() === buyer.trim().toLowerCase()) {
        next.buyer = 'Buyer and seller must be different';
      }
    } else if (paymentType === 'Credit') {
      next.party = validateRequired(party, partyLabel);
    } else {
      next.account = account ? '' : 'Select an account';
    }
    setErrors(next);

    const existingIds = new Set(invoiceRecords.map((r) => String(r.id).toLowerCase()));
    const seen = new Set();
    let entriesValid = true;

    const checked = entries.map((e) => {
      const entryErrors = {};
      const num = e.number.trim();
      if (!num) {
        entryErrors.number = `${numberLabel} is required`;
      } else if (existingIds.has(num.toLowerCase())) {
        entryErrors.number = 'This number is already used';
      } else if (seen.has(num.toLowerCase())) {
        entryErrors.number = 'Duplicate number in this batch';
      }
      seen.add(num.toLowerCase());
      if (!e.date) entryErrors.date = 'Date is required';

      if (isReturnType) entryErrors.originalInvoice = validateRequired(e.originalInvoice, 'Original invoice');

      let itemErrors = [];
      if (withItems) {
        const result = validateItems(e.items);
        itemErrors = result.errors;
        if (!result.valid) entriesValid = false;
      } else {
        entryErrors.lumpAmount = validateAmount(e.lumpAmount);
      }
      if (Object.values(entryErrors).some((v) => v)) entriesValid = false;
      return { entryErrors, itemErrors };
    });

    setEntries((prev) =>
      prev.map((e, i) => ({ ...e, errors: checked[i].entryErrors, itemErrors: checked[i].itemErrors }))
    );

    return entriesValid && Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    const intra = isTaxable && supplyType === 'intra';
    const inter = isTaxable && supplyType === 'inter';

    const records = entries.map((e, i) => {
      const t = entryTotals[i];
      return {
        id: e.number.trim(),
        invoiceType: isReturnType ? returnLabel : invoiceType,
        side: showTransferParties ? 'transfer' : isSalesSide ? 'sales' : 'purchase',
        paymentType: showTransferParties ? 'Transfer' : paymentType,
        party: !showTransferParties && paymentType === 'Credit' ? party.trim() : '',
        account: !showTransferParties && paymentType === 'Cash' ? account : '',
        seller: showTransferParties ? seller.trim() : '',
        buyer: showTransferParties ? buyer.trim() : '',
        originalInvoice: isReturnType ? e.originalInvoice.trim() : '',
        withInvoice,
        taxType: isTaxable ? 'Taxable' : 'Non-Taxable',
        supplyType: isTaxable ? supplyType : '',
        hasItems: withItems,
        items: withItems ? serializeItems(e.items, isTaxable) : [],
        description: withItems ? '' : e.lumpDescription.trim(),
        taxRate: !withItems && isTaxable ? Number(e.lumpTaxRate) || 0 : 0,
        subtotal: round2(t.subtotal),
        taxAmount: round2(t.tax),
        cgst: round2(intra ? t.tax / 2 : 0),
        sgst: round2(intra ? t.tax / 2 : 0),
        igst: round2(inter ? t.tax : 0),
        amount: round2(t.total),
        date: formatDate(e.date),
      };
    });

    if (onSave) onSave(records);
  };

  let saveLabel;
  if (entries.length > 1) saveLabel = `Save ${entries.length} ${isReturnType ? 'Returns' : 'Entries'}`;
  else if (isReturnType) saveLabel = `Save ${returnLabel}`;
  else if (isTransfer) saveLabel = 'Save Transfer Goods';
  else saveLabel = `Save ${invoiceType} ${withInvoice ? 'Invoice' : 'Entry'}`;

  const totalLabel = isReturnType
    ? 'Return Total'
    : isTransfer
      ? 'Transfer Total'
      : withInvoice
        ? 'Invoice Total'
        : 'Total';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Invoice</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Invoice type */}
          <Text style={styles.label}>Invoice Type</Text>
          <DropdownField
            value={invoiceType}
            options={INVOICE_TYPE_OPTIONS}
            title="Select Invoice Type"
            onSelect={(type) => { setInvoiceType(type); resetPartyFields(); }}
          />

          {/* With / without invoice */}
          <Text style={[styles.label, styles.labelSpacing]}>Invoice Mode</Text>
          <RadioGroup value={withInvoice} options={MODE_OPTIONS} onChange={changeInvoiceMode} />
          <Text style={styles.hintText}>
            {withInvoice
              ? 'A formal numbered invoice (INV-…). GST can be applied.'
              : 'Recorded as an unbilled entry (NB-…) — no tax is charged. It still counts toward balances and payments. You can add several at once.'}
          </Text>

          {/* With / without item breakup */}
          <Text style={[styles.label, styles.labelSpacing]}>Item Breakup</Text>
          <RadioGroup value={withItems} options={ITEM_MODE_OPTIONS} onChange={changeItemMode} />
          <Text style={styles.hintText}>
            {withItems
              ? 'List each item with its quantity and rate.'
              : 'Enter one lump-sum amount instead of an item breakup (e.g. commission, freight, adjustment).'}
          </Text>

          {isReturnType ? (
            <>
              <Text style={[styles.label, styles.labelSpacing]}>Return Kind</Text>
              <RadioGroup value={returnKind} options={RETURN_KINDS} onChange={(v) => { setReturnKind(v); resetPartyFields(); }} />
              <Text style={styles.hintText}>
                {isTransferReturn
                  ? 'The buyer sends goods back to the seller, against a transfer-goods invoice. It reduces what the buyer owes you and what you owe the seller.'
                  : 'Goods come back against a sales or purchase invoice.'}
              </Text>

              {!isTransferReturn ? (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>Return Type</Text>
                  <RadioGroup value={returnType} options={RETURN_TYPES} onChange={(v) => { setReturnType(v); resetPartyFields(); }} />
                </>
              ) : null}
            </>
          ) : null}

          {/* Tax / Non-taxable — only when a real invoice is issued */}
          {withInvoice ? (
            <>
              <Text style={[styles.label, styles.labelSpacing]}>Tax Type</Text>
              <RadioGroup value={taxKind} options={TAX_KINDS} onChange={setTaxKind} />
              <Text style={styles.hintText}>
                {isTaxable
                  ? withItems
                    ? 'GST is added on each item — pick a rate per item below.'
                    : 'GST is added on the amount — pick a rate below.'
                  : 'No tax is charged (bill of supply).'}
              </Text>

              {isTaxable ? (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>Place of Supply</Text>
                  <RadioGroup value={supplyType} options={SUPPLY_TYPES} onChange={setSupplyType} />
                  <Text style={styles.hintText}>
                    {supplyType === 'intra' ? 'Tax splits into CGST + SGST (half each).' : 'Tax is charged as IGST (full rate).'}
                  </Text>
                </>
              ) : null}
            </>
          ) : null}

          {/* Parties / payment */}
          {showTransferParties ? (
            <>
              <Text style={styles.hintText}>
                {isTransferReturn
                  ? 'Goods go back from the buyer to the seller. Choose the original transfer invoice below and the parties fill in.'
                  : 'Goods go directly from the seller to the buyer. The buyer pays you; you pay the seller.'}
              </Text>

              <Text style={[styles.label, styles.labelSpacing]}>{isTransferReturn ? 'Seller (receiving the goods back)' : 'From (Seller)'}</Text>
              <DropdownField
                value={seller}
                options={sellerNames}
                allowCustom
                title="Select Seller"
                placeholder="Select or search a seller"
                error={errors.seller}
                onSelect={(v) => { setSeller(v); clearError('seller'); }}
              />
              {errors.seller ? <Text style={styles.errorText}>{errors.seller}</Text> : null}

              <Text style={[styles.label, styles.labelSpacing]}>{isTransferReturn ? 'Buyer (returning the goods)' : 'To (Buyer)'}</Text>
              <DropdownField
                value={buyer}
                options={buyerNames}
                allowCustom
                title="Select Buyer"
                placeholder="Select or search a buyer"
                error={errors.buyer}
                onSelect={(v) => { setBuyer(v); clearError('buyer'); }}
              />
              {errors.buyer ? <Text style={styles.errorText}>{errors.buyer}</Text> : null}
            </>
          ) : (
            <>
              <Text style={[styles.label, styles.labelSpacing]}>Payment Type</Text>
              <RadioGroup value={paymentType} options={PAYMENT_TYPES} onChange={setPaymentType} />
              <Text style={styles.hintText}>{paymentHint}</Text>

              {paymentType === 'Credit' ? (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>{partyLabel}</Text>
                  <DropdownField
                    value={party}
                    options={partyOptions}
                    allowCustom
                    title={`Select ${partyLabel}`}
                    placeholder={`Select or search a ${partyLabel.toLowerCase()}`}
                    error={errors.party}
                    onSelect={(v) => { setParty(v); clearError('party'); }}
                  />
                  {errors.party ? <Text style={styles.errorText}>{errors.party}</Text> : null}
                </>
              ) : (
                <>
                  <Text style={[styles.label, styles.labelSpacing]}>{accountLabel}</Text>
                  <DropdownField
                    value={account}
                    options={accountNames}
                    title={accountLabel}
                    placeholder="Select cash or bank account"
                    error={errors.account}
                    onSelect={(v) => { setAccount(v); clearError('account'); }}
                  />
                  {errors.account ? <Text style={styles.errorText}>{errors.account}</Text> : null}
                </>
              )}
            </>
          )}

          {/* Invoice entries */}
          <Text style={[styles.label, styles.labelSpacing]}>
            {entries.length > 1 ? `${docWord}s (${entries.length})` : `${docWord} Details`}
          </Text>

          {entries.map((entry, index) => {
            const entryErrors = entry.errors || {};
            const entryTotal = entryTotals[index] || { total: 0 };
            return (
              <View key={entry.key} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {entries.length > 1
                      ? `${docWord} ${index + 1}${entry.date ? ` · ${formatDate(entry.date)}` : ''}`
                      : docWord}
                  </Text>
                  {entries.length > 1 ? (
                    <TouchableOpacity onPress={() => removeEntry(entry.key)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Invoice number */}
                <View style={styles.numberLabelRow}>
                  <Text style={styles.smallLabel}>{numberLabel}</Text>
                  {entry.numberEdited ? (
                    <TouchableOpacity onPress={() => applySuggestedNumber(entry.key)}>
                      <Text style={styles.linkText}>Use suggested</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={[styles.inputRow, entryErrors.number ? styles.inputRowError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder={`e.g. ${numberPrefix}-${numberStart}`}
                    placeholderTextColor={COLORS.lightGray}
                    autoCapitalize="characters"
                    value={entry.number}
                    onChangeText={(t) =>
                      updateEntry(entry.key, (e) => ({
                        number: t,
                        numberEdited: true,
                        errors: { ...e.errors, number: '' },
                      }))
                    }
                  />
                </View>
                {entryErrors.number ? <Text style={styles.errorText}>{entryErrors.number}</Text> : null}

                {/* Each invoice has its own date */}
                <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>
                  {entries.length > 1 ? `Date for ${docWord} ${index + 1}` : `${docWord} Date`}
                </Text>
                <DateField
                  value={entry.date}
                  onChange={(d) =>
                    updateEntry(entry.key, (e) => ({ date: d, errors: { ...e.errors, date: '' } }))
                  }
                  placeholder={`Select ${docWord.toLowerCase()} date`}
                  error={entryErrors.date}
                />
                {entryErrors.date ? <Text style={styles.errorText}>{entryErrors.date}</Text> : null}

                {/* Original invoice (returns) */}
                {isReturnType ? (
                  <>
                    <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>Original Invoice</Text>
                    <DropdownField
                      value={entry.originalInvoice}
                      options={originalOptions}
                      allowCustom
                      title="Select Original Invoice"
                      placeholder="Select or search an invoice"
                      error={entryErrors.originalInvoice}
                      onSelect={(v) => applyOriginal(entry.key, v)}
                    />
                    {entryErrors.originalInvoice ? <Text style={styles.errorText}>{entryErrors.originalInvoice}</Text> : null}
                  </>
                ) : null}

                {/* Items, or one lump-sum amount */}
                {withItems ? (
                  <>
                    <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>Items</Text>
                    <ItemsEditor
                      items={entry.items}
                      onChange={(items) => updateEntry(entry.key, { items })}
                      errors={entry.itemErrors}
                      onErrorsChange={(itemErrors) => updateEntry(entry.key, { itemErrors })}
                      taxable={isTaxable}
                    />
                  </>
                ) : (
                  <>
                    <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>Description (optional)</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Commission, freight, lump-sum goods"
                        placeholderTextColor={COLORS.lightGray}
                        value={entry.lumpDescription}
                        onChangeText={(t) => updateEntry(entry.key, { lumpDescription: t })}
                      />
                    </View>

                    <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>Amount (₹)</Text>
                    <View style={[styles.inputRow, entryErrors.lumpAmount ? styles.inputRowError : null]}>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.lightGray}
                        keyboardType="decimal-pad"
                        value={entry.lumpAmount}
                        onChangeText={(t) =>
                          updateEntry(entry.key, (e) => ({
                            lumpAmount: t.replace(/[^0-9.]/g, ''),
                            errors: { ...e.errors, lumpAmount: '' },
                          }))
                        }
                      />
                    </View>
                    {entryErrors.lumpAmount ? <Text style={styles.errorText}>{entryErrors.lumpAmount}</Text> : null}

                    {isTaxable ? (
                      <>
                        <Text style={[styles.smallLabel, styles.smallLabelSpacing]}>GST Rate</Text>
                        <RadioGroup
                          value={entry.lumpTaxRate}
                          options={LUMP_GST_RATES.map((rate) => ({ value: rate, label: `${rate}%` }))}
                          onChange={(rate) => updateEntry(entry.key, { lumpTaxRate: rate })}
                        />
                      </>
                    ) : null}
                  </>
                )}

                {entries.length > 1 ? (
                  <Text style={styles.entryTotalText}>
                    {docWord} total: {money(entryTotal.total)}
                  </Text>
                ) : null}
              </View>
            );
          })}

          {!withInvoice ? (
            <>
              <TouchableOpacity style={styles.addEntryButton} onPress={addEntry} activeOpacity={0.7}>
                <Text style={styles.addEntryText}>＋ Add Another {docWord}</Text>
              </TouchableOpacity>
              <Text style={styles.hintText}>
                Every entry shares the type and party/account above, and has its own number and date.
              </Text>
            </>
          ) : null}

          {/* Totals */}
          <View style={styles.totalBox}>
            {isTaxable ? (
              <View style={styles.breakup}>
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Subtotal (taxable value)</Text>
                  <Text style={styles.breakValue}>{money(first.subtotal)}</Text>
                </View>
                {supplyType === 'intra' ? (
                  <>
                    <View style={styles.breakRow}>
                      <Text style={styles.breakLabel}>CGST</Text>
                      <Text style={styles.breakValue}>{money(cgst)}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={styles.breakLabel}>SGST</Text>
                      <Text style={styles.breakValue}>{money(sgst)}</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.breakRow}>
                    <Text style={styles.breakLabel}>IGST</Text>
                    <Text style={styles.breakValue}>{money(igst)}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {entries.length > 1 ? (
              <View style={styles.breakup}>
                {entries.map((entry, index) => (
                  <View key={entry.key} style={styles.breakRow}>
                    <Text style={styles.breakLabel}>{entry.number || `${docWord} ${index + 1}`}</Text>
                    <Text style={styles.breakValue}>{money(entryTotals[index].total)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.totalMain}>
              <View>
                <Text style={styles.totalLabel}>
                  {totalLabel}{isTaxable ? ' (incl. GST)' : ''}
                </Text>
                <Text style={styles.totalSub}>
                  {entries.length > 1
                    ? `${entries.length} ${isReturnType ? 'returns' : 'invoices'}`
                    : withItems
                      ? `${entries[0].items.length} item${entries[0].items.length === 1 ? '' : 's'}`
                      : 'Amount only'}
                </Text>
              </View>
              <Text style={styles.totalValue}>{money(grandTotal)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>{saveLabel}</Text>
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
  labelSpacing: { marginTop: 18 },
  smallLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 6 },
  smallLabelSpacing: { marginTop: 14 },
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
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 6 },
  hintText: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 8 },
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
  entryCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  entryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  removeText: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  numberLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { fontSize: 12, fontWeight: '600', color: COLORS.blue, marginBottom: 6 },
  entryTotalText: { fontSize: 13, fontWeight: '700', color: COLORS.navy, textAlign: 'right', marginTop: 12 },
  addEntryButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addEntryText: { fontSize: 14, fontWeight: '700', color: COLORS.blue },
  totalBox: { backgroundColor: COLORS.greenBg, borderRadius: 12, padding: 16, marginTop: 16 },
  totalMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakup: {
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,197,94,0.25)',
  },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakLabel: { fontSize: 12, color: COLORS.gray },
  breakValue: { fontSize: 12, color: COLORS.navy, fontWeight: '600' },
  totalLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  totalSub: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  totalValue: { fontSize: 18, color: COLORS.green, fontWeight: '700' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});