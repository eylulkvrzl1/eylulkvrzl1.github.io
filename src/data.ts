export const ALLOCATIONS = [
  { id: 'ecosystem', nameTr: 'Gelecek Ekosistem Rezervi', nameEn: 'Future Ecosystem Reserve', allocation: 30, color: '#8b5cf6' },
  { id: 'rewards', nameTr: 'Günlük Ödüller', nameEn: 'Daily Rewards', allocation: 12, color: '#3b82f6' },
  { id: 'team', nameTr: 'Ekip ve Geliştirme', nameEn: 'Team & Development', allocation: 10, color: '#06b6d4' },
  { id: 'treasury', nameTr: 'Hazine', nameEn: 'Treasury', allocation: 12, color: '#14b8a6' },
  { id: 'liquidity', nameTr: 'Likidite', nameEn: 'Liquidity', allocation: 12, color: '#22c55e' },
  { id: 'investors', nameTr: 'Yatırımcılar', nameEn: 'Investors', allocation: 10, color: '#eab308' },
  { id: 'marketing', nameTr: 'Pazarlama', nameEn: 'Marketing', allocation: 8, color: '#f97316' },
  { id: 'community', nameTr: 'Topluluk', nameEn: 'Community', allocation: 4, color: '#ec4899' },
  { id: 'advisors', nameTr: 'Danışmanlar', nameEn: 'Advisors', allocation: 2, color: '#a78bfa' },
] as const

export const SUPPLY_PRESETS = [
  { label: '100M', value: 100_000_000 },
  { label: '210M', value: 210_000_000 },
  { label: '500M', value: 500_000_000 },
  { label: '1B', value: 1_000_000_000 },
] as const

export const SCENARIOS = [
  {
    id: 'bad',
    labelTr: 'Kötü',
    labelEn: 'Downside',
    change: -35,
    noteTr: 'Talebin zayıfladığı ve fiyatın başlangıcın altına indiği stres senaryosu.',
    noteEn: 'A stress case where demand weakens and price falls below the initial level.',
  },
  {
    id: 'cautious',
    labelTr: 'Temkinli',
    labelEn: 'Cautious',
    change: 50,
    noteTr: 'Kontrollü büyüme ve sınırlı alım baskısı varsayımı.',
    noteEn: 'Assumes controlled growth with limited buying pressure.',
  },
  {
    id: 'good',
    labelTr: 'İyi',
    labelEn: 'Upside',
    change: 400,
    noteTr: 'Güçlü talep ile fiyatın 5 katına ulaştığı yüksek büyüme senaryosu.',
    noteEn: 'A high-growth case where strong demand takes price to 5× its initial level.',
  },
] as const
