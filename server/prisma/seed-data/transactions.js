const inr = (n) => Math.round(n * 100)

// Expenses. Amounts are stored as integer paise (see utils/money.js).
const H = 'acc_hdfc'
const S = 'acc_sbi'
const C = 'acc_cash'

const FOOD = 'cat_food'
const TRAVEL = 'cat_travel'
const SHOP = 'cat_shopping'
const EDU = 'cat_education'
const BILLS = 'cat_bills'
const FUN = 'cat_entertainment'
const HEALTH = 'cat_health'
const OTHER = 'cat_other'

const AUTO = 'Auto ride from hostel to metro'

let n = 0
const e = (date, amount, reason, categoryId, accountId, notes = '') => ({
  id: `exp_${String(++n).padStart(3, '0')}`,
  date,
  amount: inr(amount),
  reason,
  categoryId,
  accountId,
  notes,
})

export const transactions = [
  // August
  e('2026-08-01', 9000, 'Hostel rent – August', BILLS, H, 'Paid via UPI'),
  e('2026-08-02', 780, 'Groceries – DMart', FOOD, H),
  e('2026-08-03', 3500, 'Mess fees – August', FOOD, S),
  e('2026-08-03', 120, AUTO, TRAVEL, C),
  e('2026-08-05', 3000, 'Laptop EMI', BILLS, H, 'EMI 5 of 12'),
  e('2026-08-06', 349, 'Mobile recharge – Jio', BILLS, S),
  e('2026-08-08', 190, 'Swiggy – paneer wrap', FOOD, S),
  e('2026-08-10', 300, 'Metro card recharge', TRAVEL, S),
  e('2026-08-12', 120, AUTO, TRAVEL, C),
  e('2026-08-14', 380, 'Movie tickets', FUN, S, 'Weekend movie with friends'),
  e('2026-08-16', 499, 'Udemy course – Python', EDU, S),
  e('2026-08-20', 400, 'Wi-Fi bill share', BILLS, H),
  e('2026-08-22', 250, 'Lunch with colleagues', FOOD, C),
  e('2026-08-25', 160, 'Pharmacy – vitamins', HEALTH, C),
  e('2026-08-28', 999, 'Shirt – Myntra', SHOP, H),

  // September
  e('2026-09-01', 9000, 'Hostel rent – September', BILLS, H, 'Paid via UPI'),
  e('2026-09-02', 820, 'Groceries – DMart', FOOD, H),
  e('2026-09-03', 3500, 'Mess fees – September', FOOD, S),
  e('2026-09-04', 349, 'Mobile recharge – Jio', BILLS, S),
  e('2026-09-05', 3000, 'Laptop EMI', BILLS, H, 'EMI 6 of 12'),
  e('2026-09-06', 120, AUTO, TRAVEL, C),
  e('2026-09-07', 120, AUTO, TRAVEL, C),
  e('2026-09-09', 260, 'Swiggy – chicken biryani', FOOD, H),
  e('2026-09-11', 650, 'Bus ticket home', TRAVEL, S),
  e('2026-09-13', 129, 'Spotify Premium', FUN, H),
  e('2026-09-15', 1200, 'Semester exam fee', EDU, S),
  e('2026-09-18', 120, AUTO, TRAVEL, C),
  e('2026-09-21', 700, 'Birthday gift for roommate', OTHER, C),
  e('2026-09-23', 100, 'Haircut', OTHER, C),
  e('2026-09-24', 520, 'Electricity bill share', BILLS, H),
  e('2026-09-27', 299, 'Phone cover', SHOP, H),
  e('2026-09-29', 540, 'Dinner outing', FOOD, S),

  // October
  e('2026-10-01', 9000, 'Hostel rent – October', BILLS, H, 'Paid via UPI'),
  e('2026-10-03', 710, 'Groceries – BigBasket', FOOD, H),
  e('2026-10-03', 3500, 'Mess fees – October', FOOD, S),
  e('2026-10-04', 349, 'Mobile recharge – Jio', BILLS, S),
  e('2026-10-05', 3000, 'Laptop EMI', BILLS, H, 'EMI 7 of 12'),
  e('2026-10-06', 120, AUTO, TRAVEL, C),
  e('2026-10-08', 120, AUTO, TRAVEL, C),
  e('2026-10-09', 300, 'Metro card recharge', TRAVEL, S),
  e('2026-10-12', 310, 'Swiggy – thali', FOOD, H),
  e('2026-10-14', 450, 'Movie tickets', FUN, S),
  e('2026-10-17', 240, 'Notebooks and stationery', EDU, C),
  e('2026-10-19', 340, 'Pharmacy – fever medicine', HEALTH, H),
  e('2026-10-20', 2499, 'Festival shopping – clothes', SHOP, H),
  e('2026-10-24', 129, 'Spotify Premium', FUN, H),
  e('2026-10-28', 120, AUTO, TRAVEL, C),
  e('2026-10-29', 799, 'Amazon – wired earphones', SHOP, H, 'Returned later, see refund'),
  e('2026-10-30', 400, 'Wi-Fi bill share', BILLS, H),

  // November (to date)
  e('2026-11-01', 9000, 'Hostel rent – November', BILLS, H, 'Paid via UPI'),
  e('2026-11-01', 3500, 'Mess fees – November', FOOD, S),
  e('2026-11-01', 120, AUTO, TRAVEL, C),
  e('2026-11-01', 85, 'Lunch at canteen', FOOD, C),
  e('2026-11-02', 349, 'Mobile recharge – Jio', BILLS, S),
  e('2026-11-02', 120, AUTO, TRAVEL, C),
  e('2026-11-02', 640, 'Groceries – BigBasket', FOOD, H),
  e('2026-11-03', 120, AUTO, TRAVEL, C),
  e('2026-11-03', 450, 'Udemy course – Advanced React', EDU, S),
  e('2026-11-03', 230, 'Swiggy – chicken biryani', FOOD, H),
  e('2026-11-04', 150, 'Metro card recharge', TRAVEL, S),
  e('2026-11-04', 60, 'Chai and snacks', FOOD, C),
  e('2026-11-04', 120, AUTO, TRAVEL, C),
  e('2026-11-05', 3000, 'Laptop EMI', BILLS, H, 'EMI 8 of 12'),
  e('2026-11-05', 129, 'Spotify Premium', FUN, H),
  e('2026-11-05', 420, 'Movie tickets', FUN, S, 'Weekend movie with friends'),
  e('2026-11-05', 120, AUTO, TRAVEL, C),
  e('2026-11-06', 180, 'Dinner with friends – pizza share', FOOD, C),
  e('2026-11-06', 350, 'Printouts and stationery', EDU, C),
  e('2026-11-06', 120, AUTO, TRAVEL, C),
  e('2026-11-07', 220, 'Pharmacy – cold medicine', HEALTH, H),
  e('2026-11-07', 1299, 'T-shirt – Myntra', SHOP, S),
  e('2026-11-07', 90, 'Haircut', OTHER, C),
  e('2026-11-07', 120, AUTO, TRAVEL, C),
]
