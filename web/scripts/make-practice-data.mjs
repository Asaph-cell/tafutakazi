// Generates the practice-task datasets in public/practice/.
// Three versions (A, B, C) of each file, so graduates can't copy each other's answers.
// The data is messy on purpose: duplicates, inconsistent names, missing values.
// Run: node scripts/make-practice-data.mjs
import fs from 'node:fs'
import path from 'node:path'

const out = path.join(import.meta.dirname, '..', 'public', 'practice')
fs.mkdirSync(out, { recursive: true })

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
const pick = (r, list) => list[Math.floor(r() * list.length)]
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const csv = (rows) => rows.map((row) => row.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n'
const day = (r, from, days) => new Date(from.getTime() + int(r, 0, days - 1) * 86400000).toISOString().slice(0, 10)

// ─── Grocery chain sales ─────────────────────────────────────────────────────

const branches = ['Westlands', 'Kilimani', 'Thika Road', 'Kasarani', 'Ngong Road', 'Eastleigh']
const misspell = {
  'Thika Road': ['Thika Rd', 'thika road', 'THIKA ROAD'],
  Kasarani: ['kasarani', 'Kasarani ', 'KASARANI'],
  'Ngong Road': ['Ngong Rd', 'ngong road', 'Ngong road'],
  Westlands: ['westlands', 'Westlands '],
  Kilimani: ['kilimani'],
  Eastleigh: ['Eastleigh ', 'eastleigh'],
}
const products = [
  ['Milk 500ml', 'Dairy', 65], ['Yoghurt 1L', 'Dairy', 180], ['Butter 250g', 'Dairy', 290],
  ['Bread 400g', 'Bakery', 65], ['Mandazi pack', 'Bakery', 100], ['Cake slice', 'Bakery', 120],
  ['Tomatoes 1kg', 'Produce', 120], ['Onions 1kg', 'Produce', 110], ['Sukuma wiki bunch', 'Produce', 30], ['Bananas 1kg', 'Produce', 90],
  ['Maize flour 2kg', 'Grains', 175], ['Rice 1kg', 'Grains', 190], ['Wheat flour 2kg', 'Grains', 210], ['Beans 1kg', 'Grains', 220],
  ['Soda 500ml', 'Beverages', 70], ['Juice 1L', 'Beverages', 250], ['Tea leaves 250g', 'Beverages', 160], ['Water 1L', 'Beverages', 60],
  ['Bar soap', 'Household', 120], ['Washing powder 1kg', 'Household', 320], ['Tissue 10 pack', 'Household', 450], ['Cooking oil 1L', 'Household', 340],
]
const weakBranch = { A: 'Thika Road', B: 'Kasarani', C: 'Ngong Road' }

for (const [v, seed] of [['A', 11], ['B', 22], ['C', 33]]) {
  const r = rng(seed)
  const rows = [['date', 'branch', 'receipt_no', 'product', 'category', 'quantity', 'unit_price_ksh', 'discount_pct', 'total_ksh']]
  let receipt = 10000 + seed * 100
  for (let k = 0; k < 2600; k++) {
    const branch = pick(r, branches)
    const [name, cat, price] = pick(r, products)
    const qty = int(r, 1, 5)
    const weak = branch === weakBranch[v]
    const discount = weak && r() < 0.55 ? pick(r, [10, 15, 20, 25, 30]) : r() < 0.06 ? 5 : 0
    const total = Math.round(qty * price * (1 - discount / 100))
    const shown = r() < 0.08 && misspell[branch] ? pick(r, misspell[branch]) : branch
    const unit = r() < 0.012 ? '' : price
    rows.push([day(r, new Date('2026-07-01'), 92), shown, `R${receipt++}`, name, cat, qty, unit, discount, total])
    // Double-recorded receipts, mostly at the weak branch's till.
    if ((weak && r() < 0.09) || r() < 0.006) rows.push(rows[rows.length - 1].slice())
  }
  const header = rows.shift()
  rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  fs.writeFileSync(path.join(out, `grocery-sales-${v}.csv`), csv([header, ...rows]))
}

// ─── Delivery fleet fuel receipts ────────────────────────────────────────────

const vans = ['KDA 214B', 'KDB 908K', 'KDC 551M', 'KDE 103P', 'KDG 772T', 'KDH 340Y', 'KDJ 618Q', 'KDK 095R']
const drivers = ['Otieno', 'Mwanzia', 'Hassan', 'Achieng', 'Kiprop', 'Juma', 'Wafula', 'Nyambura']
const stations = ['Total Nyali', 'Shell Likoni Rd', 'Rubis Bamburi', 'OLA Changamwe', 'Total Mtwapa']
const thirsty = { A: 'KDG 772T', B: 'KDC 551M', C: 'KDJ 618Q' }

for (const [v, seed] of [['A', 44], ['B', 55], ['C', 66]]) {
  const r = rng(seed)
  const rows = [['date', 'van', 'driver', 'station', 'litres', 'price_per_litre_ksh', 'total_ksh', 'odometer_km', 'receipt_no']]
  vans.forEach((van, n) => {
    let odo = int(r, 40000, 160000)
    let date = new Date('2026-07-01')
    const kmPerLitre = van === thirsty[v] ? 5.2 : 8.5 + r() * 2
    while (date < new Date('2026-09-30')) {
      const km = int(r, 220, 420)
      odo += km
      let litres = Math.round((km / kmPerLitre) * 10) / 10
      if (r() < 0.025) litres = int(r, 82, 96) // impossible: the tank holds 70 litres
      const price = Math.round((186 + r() * 8) * 100) / 100
      const odometer = r() < 0.04 ? '' : odo
      rows.push([date.toISOString().slice(0, 10), van, drivers[n], pick(r, stations), litres, price, Math.round(litres * price), odometer, `F${seed}${int(r, 10000, 99999)}`])
      if (r() < 0.03) rows.push(rows[rows.length - 1].slice())
      date = new Date(date.getTime() + int(r, 2, 4) * 86400000)
    }
  })
  const header = rows.shift()
  rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  fs.writeFileSync(path.join(out, `fuel-receipts-${v}.csv`), csv([header, ...rows]))
}

// ─── SACCO loans (two systems, so formats disagree) ──────────────────────────

const saccoBranches = ['Kisumu', 'Kakamega', 'Bungoma']
const loanTypes = [['Development', 50000, 400000, 36], ['Emergency', 5000, 40000, 6], ['School fees', 20000, 120000, 12], ['Asset', 30000, 250000, 24]]
const riskyType = { A: 'Emergency', B: 'Asset', C: 'School fees' }
const riskyBranch = { A: 'Bungoma', B: 'Kakamega', C: 'Kisumu' }
const asAt = new Date('2026-09-30')
const ksh = (n) => n.toLocaleString('en-US')

for (const [v, seed] of [['A', 77], ['B', 88], ['C', 99]]) {
  const r = rng(seed)
  const rows = [['member_no', 'branch', 'gender', 'loan_type', 'amount_ksh', 'disbursed', 'term_months', 'monthly_installment_ksh', 'paid_to_date_ksh', 'last_payment', 'balance_ksh']]
  for (let k = 0; k < 900; k++) {
    const branch = pick(r, saccoBranches)
    const [type, lo, hi, term] = pick(r, loanTypes)
    const amount = Math.round(int(r, lo, hi) / 500) * 500
    const monthsAgo = int(r, 1, Math.max(1, term - 1))
    const disbursed = new Date(asAt.getTime() - monthsAgo * 30.4 * 86400000)
    const installment = Math.round((amount * 1.12) / term)
    const risky = (type === riskyType[v] ? 0.35 : 0.08) + (branch === riskyBranch[v] ? 0.2 : 0)
    const missed = r() < risky ? int(r, 1, Math.min(monthsAgo, 6)) : 0
    const paidMonths = Math.max(0, monthsAgo - missed)
    const paid = paidMonths * installment
    const balance = Math.max(0, Math.round(amount * 1.12) - paid)
    const lastPay = paidMonths === 0 ? '' : new Date(disbursed.getTime() + paidMonths * 30.4 * 86400000)
    // System 2 (about a third of rows) writes dates as dd/mm/yyyy and amounts with commas.
    const sys2 = r() < 0.33
    const d = (dt) => (dt === '' ? '' : sys2 ? `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}` : dt.toISOString().slice(0, 10))
    const money = (n) => (sys2 ? ksh(n) : n)
    rows.push([`M${seed}${String(k).padStart(4, '0')}`, r() < 0.04 ? branch.toUpperCase() : branch, pick(r, ['F', 'M', sys2 ? 'Female' : 'F', sys2 ? 'Male' : 'M']),
      type, money(amount), d(disbursed), term, money(installment), money(paid), r() < 0.03 ? '' : d(lastPay), money(balance)])
  }
  fs.writeFileSync(path.join(out, `sacco-loans-${v}.csv`), csv(rows))
}

// ─── Supermarket customer survey (typed in by staff) ─────────────────────────

const stores = ['Rongai', 'Ruaka', 'Kitengela', 'Juja']
const badStore = { A: 'Kitengela', B: 'Ruaka', C: 'Juja' }
const complaints = {
  queue: ['Queues too long on weekends', 'only 2 tills open at 6pm', 'waited 25 mins to pay', 'Tills are slow'],
  price: ['Prices higher than Naivas', 'promo prices not on shelf', 'cooking oil too expensive', 'charged more at till than shelf price'],
  stock: ['bread finished by 7pm', 'No flour again', 'milk always out of stock', 'empty shelves on sunday'],
  staff: ['Staff were rude', 'nobody to help find items', 'cashier was on phone'],
}
const praise = ['Clean store', 'good fresh produce', 'Friendly staff', 'parking is easy', 'Good service', 'love the bakery', '']
const ageFormats = (age, r) => pick(r, [String(age), String(age), `${age} yrs`, `${age} years`, age < 25 ? '18-24' : age < 35 ? '25-34' : '35+'])

for (const [v, seed] of [['A', 101], ['B', 202], ['C', 303]]) {
  const r = rng(seed)
  const rows = [['response_id', 'submitted', 'store', 'age', 'gender', 'visits_per_month', 'rating_overall', 'rating_price', 'rating_staff', 'rating_queue_time', 'would_recommend', 'comment']]
  for (let k = 0; k < 600; k++) {
    const store = pick(r, stores)
    const age = int(r, 18, 62)
    const bad = store === badStore[v]
    const queue = Math.max(1, Math.min(5, int(r, bad ? 1 : 2, bad ? 3 : 5)))
    const price = int(r, 2, 4)
    const staff = int(r, 2, 5)
    const overall = Math.max(1, Math.min(5, Math.round((queue * 1.5 + price + staff) / 3.5 + (r() - 0.5))))
    const fmt = (n) => (r() < 0.05 ? pick(r, [`${n}/5`, `${n} stars`, String(n)]) : String(n))
    const theme = queue <= 2 ? 'queue' : price <= 2 ? 'price' : r() < 0.3 ? 'stock' : staff <= 2 ? 'staff' : null
    const comment = theme && r() < 0.8 ? pick(r, complaints[theme]) : pick(r, praise)
    rows.push([
      `S${seed}-${k + 1}`, day(r, new Date('2026-08-01'), 45), r() < 0.05 ? store.toLowerCase() : store,
      r() < 0.06 ? '' : ageFormats(age, r), pick(r, ['F', 'M', 'Female', 'Male', 'female', 'm', '']),
      int(r, 1, 12), r() < 0.03 ? '' : fmt(overall), fmt(price), fmt(staff), fmt(queue),
      overall >= 4 ? pick(r, ['Yes', 'yes', 'Y']) : overall <= 2 ? pick(r, ['No', 'no']) : pick(r, ['Maybe', 'Yes', 'No']), comment,
    ])
  }
  fs.writeFileSync(path.join(out, `survey-responses-${v}.csv`), csv(rows))
}

// ─── Driving school ad results ───────────────────────────────────────────────

const ads = [['Pass first time', 0.9], ['Weekend classes', 1.0], ['From KSh 18,000', 1.35], ['Student offer', 1.1], ['Female instructors', 1.25]]
const audiences = [['18-24 Nairobi', 1.0], ['25-34 Nairobi', 1.3], ['University students', 0.85]]
const bestAd = { A: 'From KSh 18,000', B: 'Female instructors', C: 'Weekend classes' }

for (const [v, seed] of [['A', 404], ['B', 505], ['C', 606]]) {
  const r = rng(seed)
  const rows = [['week_starting', 'platform', 'ad_name', 'audience', 'spend_ksh', 'impressions', 'clicks', 'whatsapp_chats', 'enrolments']]
  for (let w = 0; w < 8; w++) {
    const week = new Date(new Date('2026-07-06').getTime() + w * 7 * 86400000).toISOString().slice(0, 10)
    for (const [ad, adBoost] of ads) {
      for (const [aud, audBoost] of audiences) {
        if (r() < 0.25) continue
        const platform = pick(r, ['Facebook', 'Instagram'])
        const spend = int(r, 6, 20) * 100
        const impressions = Math.round(spend * (9 + r() * 6))
        const boost = adBoost * audBoost * (ad === bestAd[v] ? 1.3 : 1)
        const clicks = Math.round(impressions * (0.008 + r() * 0.01) * boost)
        const chats = Math.round(clicks * (0.03 + r() * 0.03) * boost)
        const enrol = Math.round(chats * (0.04 + r() * 0.06) * boost)
        rows.push([week, platform, ad, aud, spend, impressions, clicks, chats, enrol])
      }
    }
  }
  fs.writeFileSync(path.join(out, `ad-results-${v}.csv`), csv(rows))
}

for (const f of fs.readdirSync(out)) {
  const lines = fs.readFileSync(path.join(out, f), 'utf8').trim().split('\n').length - 1
  console.log(f, lines, 'rows')
}
