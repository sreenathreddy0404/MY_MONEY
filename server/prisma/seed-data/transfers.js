const inr = (n) => Math.round(n * 100)

const H = 'acc_hdfc'
const S = 'acc_sbi'
const C = 'acc_cash'

const t = (n, date, amount, fromAccountId, toAccountId, note) => ({
  id: `trf_${String(n).padStart(3, '0')}`,
  date,
  amount: inr(amount),
  fromAccountId,
  toAccountId,
  note,
})

export const transfers = [
  t(1, '2026-08-03', 1500, H, C, 'ATM cash withdrawal'),
  t(2, '2026-09-05', 1500, H, C, 'ATM cash withdrawal'),
  t(3, '2026-10-02', 1000, H, C, 'ATM cash withdrawal'),
  t(4, '2026-11-02', 1500, H, C, 'ATM cash withdrawal'),
  t(5, '2026-11-03', 3000, H, S, 'Move money for mess fees and bills'),
  t(6, '2026-11-06', 1000, S, C, 'Cash for the weekend'),
]
