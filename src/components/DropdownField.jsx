import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../app/utils/theme';

// options: ['Cash', 'HDFC Bank'] or [{ value, label, description? }]
// allowCustom: lets the person use a typed value that isn't in the list (shown as: Use "typed text")
const normalize = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

export default function DropdownField({
  value,
  options = [],
  onSelect,
  placeholder = 'Select',
  title = 'Select',
  error,
  allowCustom = false,
  searchPlaceholder = 'Search…',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const items = useMemo(() => options.map(normalize), [options]);
  const selected = items.find((o) => o.value === value);
  // A typed value that isn't in the list still shows in the field
  const shownLabel = selected ? selected.label : allowCustom && value ? String(value) : '';

  const q = query.trim().toLowerCase();
  // Matches in the name come first; matches only in the description (e.g. a party name on an invoice) follow
  const inLabel = (o) => String(o.label).toLowerCase().includes(q);
  const filtered = q
    ? items
        .filter((o) => `${o.label} ${o.description || ''}`.toLowerCase().includes(q))
        .sort((a, b) => Number(inLabel(b)) - Number(inLabel(a)))
    : items;
  const showCustom =
    allowCustom && q.length > 0 && !items.some((o) => String(o.label).toLowerCase() === q || String(o.value).toLowerCase() === q);

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const choose = (v) => {
    close();
    if (onSelect) onSelect(v);
  };

  const Radio = ({ on }) => (
    <View style={[styles.radioOuter, on ? styles.radioOuterOn : null]}>
      {on ? <View style={styles.radioInner} /> : null}
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={shownLabel ? styles.valueText : styles.placeholderText} numberOfLines={1}>
          {shownLabel || placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{title}</Text>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.lightGray}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected ? styles.optionSelected : null]}
                    onPress={() => choose(item.value)}
                    activeOpacity={0.7}
                  >
                    <Radio on={isSelected} />
                    <View style={styles.optionTextWrap}>
                      <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
                        {item.label}
                      </Text>
                      {item.description ? <Text style={styles.optionDescription}>{item.description}</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListHeaderComponent={
                showCustom ? (
                  <TouchableOpacity style={[styles.option, styles.customOption]} onPress={() => choose(query.trim())} activeOpacity={0.7}>
                    <Radio on={false} />
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.customLabel}>Use "{query.trim()}"</Text>
                      <Text style={styles.optionDescription}>Not in the list</Text>
                    </View>
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                showCustom ? null : <Text style={styles.emptyText}>{items.length === 0 ? 'Nothing to choose from yet' : 'No matches'}</Text>
              }
            />

            <TouchableOpacity style={styles.cancelButton} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldError: { borderColor: COLORS.red },
  placeholderText: { flex: 1, fontSize: 15, color: COLORS.lightGray },
  valueText: { flex: 1, fontSize: 15, color: COLORS.navy, fontWeight: '600' },
  chevron: { fontSize: 14, color: COLORS.gray, marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 8,
    backgroundColor: COLORS.bg,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.navy, padding: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 8,
  },
  optionSelected: { backgroundColor: '#EEF2FF' },
  customOption: { backgroundColor: '#F8F9FF' },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 15, color: COLORS.navy, fontWeight: '600' },
  optionLabelSelected: { color: COLORS.blue },
  customLabel: { fontSize: 15, color: COLORS.blue, fontWeight: '700' },
  optionDescription: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterOn: { borderColor: COLORS.blue },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.blue },
  emptyText: { textAlign: 'center', color: COLORS.gray, paddingVertical: 24 },
  cancelButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.gray },
});