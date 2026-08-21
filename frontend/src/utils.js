export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export const BRAND = '#0a3d62'
export const ACCENT = '#f9a825'

export const fmt = (n) => 'GHS ' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const CURRENT_YEAR  = new Date().getFullYear()
export const CURRENT_MONTH = new Date().getMonth() + 1

export const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export const REVENUE_CATS      = ['Internet', 'TV', 'Other Income']
export const DIRECT_COST_CATS  = ['Production Crew', 'Equipment Hire', 'Studio Rental', 'Talent/Artiste Fees', 'Location Fees', 'Post-Production', 'Materials', 'Other Direct Cost']
export const EXPENSE_CATS      = ['Audit Fees', 'Bank Charges', 'Utilities', 'Communication & Internet', 'Fuel & Lubricants', 'Office Expenses', 'Repairs & Maintenance', 'Cleaning & Sanitation', 'Transportation', 'Rent', 'Staff Cost', 'Printing & Stationery', 'Medicals', 'Depreciation', 'Vehicle Insurance', 'Other Admin Expense']
export const ASSET_CATS        = ['Camera & Equipment', 'Computer & IT', 'Furniture', 'Vehicle', 'Studio Equipment', 'Other Asset']
export const TAX_CATS          = ['Corporate Tax', 'CST', 'VAT', 'NHIL', 'Withholding', 'PAYE']
