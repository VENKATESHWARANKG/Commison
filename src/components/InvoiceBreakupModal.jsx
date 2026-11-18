import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/utils/theme';

export default function InvoiceBreakupModal({ visible, invoice, onClose }) {
  if (!invoice) return null;

  const isSales = invoice.side === 'sales';
  const grossLabel = isSales ? 'Sales Amount' : 'Purchase Amount';
  const returnLabel = isSales ? 'Sales Return' : 'Purchase Return';
  const paymentLabel = isSales ? 'Payment Received' : 'Payment Made';

  const gross = invoice.gross ?? 0;
  const returned = invoice.returned ?? 0;
  const paid = invoice.paid ?? 0;
  const netAfterReturn = gross - returned;
  const balance = netAfterReturn - paid;

  const items = invoice.items || [];
  const noBreakup = invoice.hasItems === false;
  const showItemBreakup = noBreakup || items.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{invoice.id}</Text>
          <Text style={styles.subtitle}>{invoice.name}</Text>

          {showItemBreakup ? (
            <View style={styles.itemsBox}>
              <Text style={styles.sectionHead}>Item Breakup</Text>
              {noBreakup ? (
                <Text style={styles.noItemsText}>
                  {invoice.description ? `${invoice.description} — ` : ''}Amount only (no item breakup)
                </Text>
              ) : (
                <ScrollView style={styles.itemsScroll} nestedScrollEnabled>
                  {items.map((it, i) => (
                    <View key={i} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemName}>{it.description}</Text>
                        <Text style={styles.itemMeta}>
                          {it.quantity} × ₹ {(Number(it.rate) || 0).toLocaleString('en-IN')}
                          {it.taxRate ? `  ·  GST ${it.taxRate}%` : ''}
                        </Text>
                      </View>
                      <Text style={styles.itemAmount}>₹ {(Number(it.amount) || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}

          {invoice.side === 'transfer' ? (
            <View style={styles.breakupBox}>
              <Text style={styles.sectionHead}>From Buyer — {invoice.buyer}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Invoice Amount</Text>
                <Text style={styles.rowValue}>₹ {(invoice.gross ?? 0).toLocaleString('en-IN')}</Text>
              </View>
              {invoice.returned > 0 ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabelMinus}>− Goods Returned</Text>
                  <Text style={styles.rowValueMinus}>₹ {(invoice.returned ?? 0).toLocaleString('en-IN')}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.rowLabelMinus}>− Payment Received</Text>
                <Text style={styles.rowValueMinus}>₹ {(invoice.paidIn ?? 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.balanceLabel}>Still to Receive</Text>
                <Text style={[styles.balanceValue, { color: invoice.balanceIn > 0 ? COLORS.orange : COLORS.green }]}>
                  ₹ {(invoice.balanceIn ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.dividerLineBold} />

              <Text style={styles.sectionHead}>To Seller — {invoice.seller}</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Invoice Amount</Text>
                <Text style={styles.rowValue}>₹ {(invoice.gross ?? 0).toLocaleString('en-IN')}</Text>
              </View>
              {invoice.returned > 0 ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabelMinus}>− Goods Returned</Text>
                  <Text style={styles.rowValueMinus}>₹ {(invoice.returned ?? 0).toLocaleString('en-IN')}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Text style={styles.rowLabelMinus}>− Payment Made</Text>
                <Text style={styles.rowValueMinus}>₹ {(invoice.paidOut ?? 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.balanceLabel}>Still to Pay</Text>
                <Text style={[styles.balanceValue, { color: invoice.balanceOut > 0 ? COLORS.orange : COLORS.green }]}>
                  ₹ {(invoice.balanceOut ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ) : (
          <View style={styles.breakupBox}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{grossLabel}</Text>
              <Text style={styles.rowValue}>₹ {gross.toLocaleString('en-IN')}</Text>
            </View>
            {invoice.taxAmount > 0 ? (
              <Text style={styles.taxNote}>Includes GST of ₹ {invoice.taxAmount.toLocaleString('en-IN')}</Text>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabelMinus}>− {returnLabel}</Text>
              <Text style={styles.rowValueMinus}>₹ {returned.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.row}>
              <Text style={styles.rowLabelSub}>Net Amount</Text>
              <Text style={styles.rowValueSub}>₹ {netAfterReturn.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabelMinus}>− {paymentLabel}</Text>
              <Text style={styles.rowValueMinus}>₹ {paid.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.dividerLineBold} />
            <View style={styles.row}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={[styles.balanceValue, { color: balance > 0 ? COLORS.orange : COLORS.green }]}>
                ₹ {balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
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
  title: { fontSize: 17, fontWeight: '700', color: COLORS.navy },
  subtitle: { fontSize: 13, color: COLORS.gray, marginBottom: 16 },
  breakupBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  taxNote: { fontSize: 11, color: COLORS.lightGray, marginTop: -4, marginBottom: 10 },
  sectionHead: { fontSize: 12, fontWeight: '700', color: COLORS.blue, marginBottom: 10 },
  itemsBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  itemsScroll: { maxHeight: 150 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLeft: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 13, fontWeight: '600', color: COLORS.navy },
  itemMeta: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  itemAmount: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  noItemsText: { fontSize: 13, color: COLORS.gray },
  rowLabel: { fontSize: 14, color: COLORS.navy, fontWeight: '600' },
  rowValue: { fontSize: 14, color: COLORS.navy, fontWeight: '700' },
  rowLabelMinus: { fontSize: 13, color: COLORS.gray },
  rowValueMinus: { fontSize: 13, color: COLORS.gray },
  dividerLine: { height: 1, backgroundColor: COLORS.border, marginVertical: 6 },
  dividerLineBold: { height: 1, backgroundColor: COLORS.navy, marginVertical: 8, opacity: 0.15 },
  rowLabelSub: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },
  rowValueSub: { fontSize: 13, color: COLORS.navy, fontWeight: '700' },
  balanceLabel: { fontSize: 15, color: COLORS.navy, fontWeight: '700' },
  balanceValue: { fontSize: 16, fontWeight: '700' },
  closeButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});