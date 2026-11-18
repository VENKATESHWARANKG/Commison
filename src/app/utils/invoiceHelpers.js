const round2 = (n) => Math.round(n * 100) / 100;

export const isReturn = (record) =>
  record.invoiceType === 'Sales Return' ||
  record.invoiceType === 'Purchase Return' ||
  record.invoiceType === 'Transfer Goods Return';

// 'sales' (buyer side) or 'purchase' (seller side). Older records without a `side` field are inferred.
export const getSide = (record) => {
  if (record.side) return record.side;
  if (record.invoiceType === 'Transfer Goods' || record.invoiceType === 'Transfer Goods Return') return 'transfer';
  return record.invoiceType === 'Purchase' || record.invoiceType === 'Purchase Return' ? 'purchase' : 'sales';
};

export const sameName = (a, b) =>
  !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// A journal entry moves an amount FROM one party TO another, like "the buyer paid the seller directly".
// Against an invoice it settles up to two legs of that invoice:
//   in  -> the "from" party is who owes you on it (the buyer / the sales party)
//   out -> the "to" party is who you owe on it (the seller / the purchase party)
export function journalLegsFor(record, fromParty, toParty) {
  const side = getSide(record);
  const receivable = side === 'transfer' ? record.buyer : side === 'sales' ? record.party : '';
  const payable = side === 'transfer' ? record.seller : side === 'purchase' ? record.party : '';
  return { in: sameName(fromParty, receivable), out: sameName(toParty, payable) };
}

// Next number for a document type, based on the highest existing one (safe even after deletions).
// e.g. nextDocNumber(records, 'INV', 10024) -> 'INV-10024', then 'INV-10025', ...
export function nextDocNumber(records, prefix, start) {
  const max = records.reduce((highest, r) => {
    if (typeof r.id !== 'string' || !r.id.startsWith(`${prefix}-`)) return highest;
    const n = parseInt(r.id.slice(prefix.length + 1), 10);
    return Number.isNaN(n) ? highest : Math.max(highest, n);
  }, start - 1);
  return `${prefix}-${max + 1}`;
}

// Turns saved invoice records (returns included) + saved payments into one summary per real invoice:
//   gross    = invoice total
//   returned = total of returns made against it
//   paid     = payments applied to it (cash invoices count as fully settled)
//   balance  = gross - returned - paid
export function summarizeInvoices(records, payments, journals = []) {
  const returnedByInvoice = {};
  records.filter(isReturn).forEach((r) => {
    if (r.originalInvoice) {
      returnedByInvoice[r.originalInvoice] = (returnedByInvoice[r.originalInvoice] || 0) + (Number(r.amount) || 0);
    }
  });

  // Payments In (from buyers) and Payments Out (to sellers) are tracked separately, because a
  // goods transfer has both: the buyer owes you, and you owe the seller.
  const paidInByInvoice = {};
  const paidOutByInvoice = {};
  payments.forEach((p) => {
    const bucket = p.direction === 'out' ? paidOutByInvoice : paidInByInvoice;
    (p.invoices || []).forEach((i) => {
      bucket[i.id] = (bucket[i.id] || 0) + (Number(i.amount) || 0);
    });
  });

  // Settlements / journal entries that touch an invoice. A settlement lists several invoices
  // ({ invoices: [{ id, amount }] }); an older single journal entry names one (againstType/againstRef).
  const journalsByInvoice = {};
  journals.forEach((j) => {
    let allocations = [];
    if (Array.isArray(j.invoices) && j.invoices.length > 0) {
      allocations = j.invoices.map((i) => ({ id: i.id, amount: Number(i.amount) || 0 }));
    } else if (j.againstType === 'Invoice' && j.againstRef) {
      allocations = [{ id: j.againstRef, amount: Number(j.amount) || 0 }];
    }
    allocations.forEach((a) => {
      (journalsByInvoice[a.id] = journalsByInvoice[a.id] || []).push({
        fromParty: j.fromParty,
        toParty: j.toParty,
        amount: a.amount,
      });
    });
  });

  return records
    .filter((r) => !isReturn(r))
    .map((r) => {
      const gross = Number(r.amount) || 0;
      const returned = returnedByInvoice[r.id] || 0;
      let paidIn = paidInByInvoice[r.id] || 0;
      let paidOut = paidOutByInvoice[r.id] || 0;
      (journalsByInvoice[r.id] || []).forEach((j) => {
        const amount = Number(j.amount) || 0;
        const legs = journalLegsFor(r, j.fromParty, j.toParty);
        if (legs.in) paidIn += amount;
        if (legs.out) paidOut += amount;
      });

      if (getSide(r) === 'transfer') {
        const balanceIn = Math.max(round2(gross - returned - paidIn), 0); // still to collect from the buyer
        const balanceOut = Math.max(round2(gross - returned - paidOut), 0); // still to pay the seller
        return {
          ...r,
          gross,
          returned,
          paid: paidIn,
          paidIn,
          paidOut,
          balanceIn,
          balanceOut,
          balance: Math.max(balanceIn, balanceOut),
        };
      }

      const paid = r.paymentType === 'Cash' ? Math.max(gross - returned, 0) : paidIn + paidOut;
      const balance = Math.max(round2(gross - returned - paid), 0);
      return { ...r, gross, returned, paid, balance };
    });
}