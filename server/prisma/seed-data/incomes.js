const inr = (n) => Math.round(n * 100)

export const INCOME_SOURCES = ['Salary', 'Freelancing', 'Family', 'Refund', 'Other']

const H = 'acc_hdfc'
const S = 'acc_sbi'
const C = 'acc_cash'

const i = (n, date, amount, source, accountId, description) => ({
  id: `inc_${String(n).padStart(3, '0')}`,
  date,
  amount: inr(amount),
  source,
  accountId,
  description,
})

export const incomes = [
  // August
  i(1, '2026-08-01', 40000, 'Salary', H, 'Monthly salary – August'),
  i(2, '2026-08-05', 3000, 'Family', S, 'Monthly support from parents'),
  i(3, '2026-08-18', 1500, 'Freelancing', S, 'Landing page tweaks for a client'),
  // September
  i(4, '2026-09-01', 40000, 'Salary', H, 'Monthly salary – September'),
  i(5, '2026-09-04', 3000, 'Family', S, 'Monthly support from parents'),
  i(6, '2026-09-20', 2500, 'Freelancing', S, 'React bug fixes for a startup'),
  // October
  i(7, '2026-10-01', 40000, 'Salary', H, 'Monthly salary – October'),
  i(8, '2026-10-03', 3000, 'Family', S, 'Monthly support from parents'),
  i(9, '2026-10-15', 1800, 'Freelancing', S, 'Dashboard mockups for a client'),
  i(10, '2026-10-22', 700, 'Other', C, 'Sold old books to a junior'),
  i(11, '2026-10-26', 1200, 'Refund', H, 'Flipkart return refund – shoes'),
  // November
  i(12, '2026-11-01', 40000, 'Salary', H, 'Monthly salary – November'),
  i(13, '2026-11-02', 3000, 'Family', S, 'Monthly support from parents'),
  i(14, '2026-11-03', 2000, 'Freelancing', S, 'Portfolio website for a local shop'),
  i(15, '2026-11-04', 799, 'Refund', H, 'Amazon refund – earphones returned'),
  i(16, '2026-11-05', 500, 'Other', C, 'Sold old textbooks'),
]
