// Roles graduates aim for and recruiters hire for. The first six are shown as "Popular".
export const ROLES = [
  'Data Analyst', 'Accountant', 'Digital Marketer', 'Software Developer', 'Sales', 'Customer Service',
  'Finance', 'IT Support', 'Graphic Designer', 'Content Writer', 'Social Media Manager', 'HR',
  'Admin / Office', 'Procurement', 'Logistics', 'Engineering', 'Project Assistant', 'Research',
  'Lab Assistant', 'Teacher', 'Nurse', 'Pharmacist', 'Agronomist', 'Quantity Surveyor', 'Architect',
  'Legal Assistant',
]

// Tools graduates can say they used on a task, suggested by role. Anything else can be typed.
const TOOLS: Record<string, string[]> = {
  'Data Analyst': ['Excel', 'Power BI', 'SQL', 'Python', 'Google Sheets', 'Tableau', 'R', 'Looker Studio'],
  Accountant: ['Excel', 'QuickBooks', 'Sage', 'Google Sheets', 'Xero', 'Tally'],
  Finance: ['Excel', 'Power BI', 'Google Sheets', 'QuickBooks', 'Python'],
  'Digital Marketer': ['Canva', 'Meta Ads', 'Google Ads', 'Google Analytics', 'CapCut', 'Mailchimp', 'Excel', 'WhatsApp Business'],
  'Social Media Manager': ['Canva', 'CapCut', 'Meta Business Suite', 'TikTok', 'Instagram', 'Meta Ads', 'WhatsApp Business'],
  'Content Writer': ['Google Docs', 'WordPress', 'Grammarly', 'Canva', 'SEO tools'],
  'Graphic Designer': ['Canva', 'Photoshop', 'Illustrator', 'Figma', 'CorelDRAW', 'InDesign'],
  'Software Developer': ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'Java', 'PHP', 'Flutter', 'Git'],
  'IT Support': ['Windows', 'Linux', 'Networking', 'Active Directory', 'Microsoft 365', 'Excel'],
  Sales: ['Excel', 'Google Sheets', 'HubSpot', 'WhatsApp Business', 'PowerPoint'],
  'Customer Service': ['Zendesk', 'Freshdesk', 'Google Sheets', 'WhatsApp Business', 'Email'],
  HR: ['Excel', 'Google Sheets', 'Word', 'BambooHR', 'PowerPoint'],
  Procurement: ['Excel', 'SAP', 'Google Sheets', 'Word'],
  Logistics: ['Excel', 'Google Sheets', 'Power BI', 'SAP'],
  Engineering: ['AutoCAD', 'Excel', 'MATLAB', 'SolidWorks', 'Revit'],
  Architect: ['AutoCAD', 'Revit', 'SketchUp', 'ArchiCAD', 'Photoshop'],
  'Quantity Surveyor': ['Excel', 'AutoCAD', 'CostX', 'Word'],
  Research: ['Excel', 'SPSS', 'R', 'Python', 'Stata', 'Google Forms', 'Word'],
}
const GENERAL_TOOLS = ['Excel', 'Google Sheets', 'Word', 'PowerPoint', 'Canva', 'Google Docs']

export function toolsFor(role: string | undefined) {
  return (role && TOOLS[role]) || GENERAL_TOOLS
}

export const INDUSTRIES = [
  'Logistics and transport', 'Retail and wholesale', 'Banking, SACCOs and insurance', 'Health',
  'Tech and telecoms', 'Media and marketing', 'Manufacturing', 'Agriculture', 'Construction and real estate',
  'Education', 'Hospitality', 'NGO', 'Government', 'Other',
]

export const COMPANY_SIZES = ['1–10', '11–50', '51–200', '200+']

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
  'aol.com', 'proton.me', 'protonmail.com', 'ymail.com',
]

export function isCompanyEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return domain.includes('.') && !FREE_EMAIL_DOMAINS.includes(domain)
}

export function gradYears() {
  const now = new Date().getFullYear()
  return [now, now - 1, now - 2, now - 3]
}

// Tidy a typed role: trim, single spaces, and use the listed spelling when it matches one ("data analyst" → "Data Analyst").
export function normRole(raw: string) {
  const r = raw.trim().replace(/\s+/g, ' ')
  return ROLES.find((x) => x.toLowerCase() === r.toLowerCase()) ?? r
}
