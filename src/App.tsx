import { useEffect, useMemo, useState } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ALLOCATIONS, SCENARIOS, SUPPLY_PRESETS } from './data'

type Language = 'tr' | 'en'

const COPY = {
  tr: {
    toolkit: 'QTM · DEVELOPER ARAÇLARI', heroDescription: 'PancakeSwap V2 havuz kurulumunu modelleyin, fiyat senaryolarını test edin ve QTM dağılımını tek yerde yönetin.', modelReady: 'Model hazır',
    setupKicker: 'PANCAKESWAP V2 · İLK KURULUM', setupTitle: 'Fiyat ve likiditeyi belirleyin', setupDescription: 'İlk havuz oranı, QTM’nin başlangıç fiyatını belirler. İki varlığın başlangıç değeri eşit olmalıdır.',
    poolInputs: 'HAVUZ GİRDİLERİ', initialParameters: 'Başlangıç parametreleri', initialPrice: '1 QTM başlangıç fiyatı', initialPriceHint: 'Örnek: 0.01 USDT = 1 QTM', liquidityInput: 'Eklenecek USDT likiditesi', liquidityHint: 'QTM tarafı otomatik hesaplanır', resetPool: 'Başlangıca dön',
    requiredQtm: 'Gerekli QTM', formula: 'USDT likiditesi ÷ QTM fiyatı', initialPool: 'İLK HAVUZ KOMPOZİSYONU', balanced: 'Dengeli', qtmAmount: 'QTM miktarı', usdtAmount: 'USDT miktarı', initialValue: 'Toplam başlangıç değeri',
    step1Title: 'Pair oluştur', step1Note: 'PancakeSwap V2’de QTM / USDT çiftini seçin.', step2Title: 'Fiyat oranını gir', step2Note: 'USDT olarak oranlayın.', step3Title: 'Varlıkları ekle', step4Title: 'Onayla ve kilitle', step4Note: 'İzinleri, LP token’larını ve kilit süresini doğrulayın.',
    scenarioKicker: 'QUANTUM TOKEN · FİYAT SENARYOSU', scenarioTitle: 'Havuzun fiyat hareketini simüle edin', scenarioDescription: 'V2 sabit çarpan modeliyle hedef fiyatta havuzda kalacak QTM ve USDT miktarını görün.', targetPrice: 'Hedef QTM fiyatı', readyScenarios: 'Hazır senaryolar', priceChange: 'Fiyat değişimi',
    poolUsdt: 'Havuzdaki USDT', poolQtm: 'Havuzdaki QTM', reserveChange: 'net rezerv değişimi', lpValue: 'LP pozisyon değeri', fromInitial: 'Başlangıca göre', impermanentLoss: 'Geçici kayıp', hodlValue: 'HODL değeri',
    constantCurve: 'SABİT ÇARPAN EĞRİSİ', chartTitle: 'QTM/USDT fiyat simülasyonu', chartDescription: 'Başlangıçtan hedef fiyata giden tahmini hareket çizgiyle gösterilir.', usdtReserve: 'USDT rezervi', qtmReserve: 'QTM rezervi', price: 'Fiyat', initial: 'Başlangıç', target: 'Hedef', open: 'A', high: 'Y', low: 'D', close: 'K', simulation: 'Simülasyon',
    modelNote: 'Model notu', modelDisclaimer: 'Bu simülasyon işlem ücreti, slippage, harici likidite, MEV ve vergileri içermez. Sonuçlar sabit çarpanlı tek bir V2 havuzu varsayar.',
    tokenomicsKicker: 'QTM · TOKENOMICS DAĞILIMI', tokenomicsTitle: 'Toplam arzı ve dağılımı modelleyin', tokenomicsDescription: 'Toplam arzı ve kategori yüzdelerini değiştirin; tüm QTM miktarları anlık olarak yeniden hesaplansın.', totalSupply: 'Toplam Arz', quickSelect: 'Hızlı seçim', calculatedTotal: 'Hesaplanan toplam',
    allocationEditor: 'Dağılım yüzdelerini düzenle', allocationEditorNote: 'Kategori oranlarını değiştirebilirsiniz. Sağlıklı bir dağılım için toplam %100 olmalıdır.', reset: 'Varsayılana dön', allocationTotal: 'Dağılım toplamı', validAllocation: 'Dağılım dengeli', invalidAllocation: 'Toplam %100 olmalı', remaining: 'Eksik', excess: 'Fazla',
    allocationView: 'DAĞILIM GÖRÜNÜMÜ', categories: '9 Kategori', totalCategories: 'Toplam kategori', allocated: 'Tahsis edilen', category: 'Kategori', allocation: 'Dağılım', qtmAmountHeader: 'QTM Miktarı', allocatedTotal: 'Dağıtılan toplam', footerModel: 'Model · PancakeSwap V2 sabit çarpan AMM',
  },
  en: {
    toolkit: 'QTM · DEVELOPER TOOLKIT', heroDescription: 'Model a PancakeSwap V2 pool setup, test price scenarios and manage QTM allocation in one place.', modelReady: 'Model ready',
    setupKicker: 'PANCAKESWAP V2 · INITIAL SETUP', setupTitle: 'Set price and liquidity', setupDescription: 'The initial pool ratio defines QTM’s starting price. Both assets must have equal value at launch.',
    poolInputs: 'POOL INPUTS', initialParameters: 'Initial parameters', initialPrice: 'Initial price of 1 QTM', initialPriceHint: 'Example: 0.01 USDT = 1 QTM', liquidityInput: 'USDT liquidity to add', liquidityHint: 'The QTM side is calculated automatically', resetPool: 'Reset inputs',
    requiredQtm: 'Required QTM', formula: 'USDT liquidity ÷ QTM price', initialPool: 'INITIAL POOL COMPOSITION', balanced: 'Balanced', qtmAmount: 'QTM amount', usdtAmount: 'USDT amount', initialValue: 'Total initial value',
    step1Title: 'Create pair', step1Note: 'Select the QTM / USDT pair on PancakeSwap V2.', step2Title: 'Enter price ratio', step2Note: 'Set the value in USDT.', step3Title: 'Add assets', step4Title: 'Approve and lock', step4Note: 'Verify approvals, LP tokens and the lock period.',
    scenarioKicker: 'QUANTUM TOKEN · PRICE SCENARIO', scenarioTitle: 'Simulate pool price movement', scenarioDescription: 'See the QTM and USDT remaining in the pool at the target price using the V2 constant-product model.', targetPrice: 'Target QTM price', readyScenarios: 'Preset scenarios', priceChange: 'Price change',
    poolUsdt: 'USDT in pool', poolQtm: 'QTM in pool', reserveChange: 'net reserve change', lpValue: 'LP position value', fromInitial: 'From initial value', impermanentLoss: 'Impermanent loss', hodlValue: 'HODL value',
    constantCurve: 'CONSTANT PRODUCT CURVE', chartTitle: 'QTM/USDT price simulation', chartDescription: 'The estimated path from the initial to target price is shown as a line.', usdtReserve: 'USDT reserve', qtmReserve: 'QTM reserve', price: 'Price', initial: 'Initial', target: 'Target', open: 'O', high: 'H', low: 'L', close: 'C', simulation: 'Simulation',
    modelNote: 'Model note', modelDisclaimer: 'This simulation excludes trading fees, slippage, external liquidity, MEV and taxes. It assumes a single constant-product V2 pool.',
    tokenomicsKicker: 'QTM · TOKENOMICS ALLOCATION', tokenomicsTitle: 'Model total supply and allocation', tokenomicsDescription: 'Change total supply and category percentages; every QTM amount is recalculated instantly.', totalSupply: 'Total Supply', quickSelect: 'Quick select', calculatedTotal: 'Calculated total',
    allocationEditor: 'Edit allocation percentages', allocationEditorNote: 'Adjust category ratios. A healthy allocation should total exactly 100%.', reset: 'Reset defaults', allocationTotal: 'Allocation total', validAllocation: 'Allocation balanced', invalidAllocation: 'Total must equal 100%', remaining: 'Remaining', excess: 'Excess',
    allocationView: 'ALLOCATION VIEW', categories: '9 Categories', totalCategories: 'Total categories', allocated: 'Allocated', category: 'Category', allocation: 'Allocation', qtmAmountHeader: 'QTM Amount', allocatedTotal: 'Total allocated', footerModel: 'Model · PancakeSwap V2 constant product AMM',
  },
} as const

const FORMATTERS = {
  tr: { compact: new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 2 }), number: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }), price: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) },
  en: { compact: new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }), number: new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }), price: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) },
}

type NumericValue = number | ''

function safePositive(value: NumericValue, fallback: number) { return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback }
function inputValue(value: string): NumericValue { return value === '' ? '' : Number(value) }
function formatNumber(value: number, language: Language) { return FORMATTERS[language].number.format(value) }
function formatPrice(value: number, language: Language) { return value < 0.01 ? value.toFixed(6) : FORMATTERS[language].price.format(value) }
function formatCompact(value: number, language: Language) { return FORMATTERS[language].compact.format(value) }

type PricePoint = { step: number; price: number }

function NumberStepper({ value, step, min = 0, onChange, label }: { value: NumericValue; step: number; min?: number; onChange: (value: NumericValue) => void; label: string }) {
  const adjust = (direction: number) => {
    const current = typeof value === 'number' ? value : 0
    const next = Math.max(min, current + step * direction)
    onChange(Number(next.toPrecision(12)))
  }
  return <span className="supply-stepper" aria-label={label}>
    <button type="button" onClick={() => adjust(1)} aria-label={`${label} +`}><i className="chevron-up" /></button>
    <button type="button" onClick={() => adjust(-1)} aria-label={`${label} -`}><i className="chevron-down" /></button>
  </span>
}

function PriceLineChart({ data, language, initialPrice, targetPrice }: { data: PricePoint[]; language: Language; initialPrice: number; targetPrice: number }) {
  const t = COPY[language]
  const width = 1000, height = 360, left = 18, right = 84, top = 48, bottom = 35
  const plotWidth = width - left - right, plotHeight = height - top - bottom
  const rawMin = Math.min(...data.map((point) => point.price)), rawMax = Math.max(...data.map((point) => point.price))
  const padding = Math.max((rawMax - rawMin) * 0.08, rawMax * 0.015)
  const minPrice = rawMin - padding, maxPrice = rawMax + padding
  const x = (index: number) => left + (plotWidth * index) / Math.max(1, data.length - 1)
  const y = (price: number) => top + ((maxPrice - price) / (maxPrice - minPrice || 1)) * plotHeight
  const positive = targetPrice >= initialPrice
  const gridRows = Array.from({ length: 7 }, (_, index) => index)
  const gridColumns = Array.from({ length: 9 }, (_, index) => index)
  const linePoints = data.map((point, index) => `${x(index)},${y(point.price)}`).join(' ')

  return <div className="trading-chart">
    <div className="ohlc-strip">
      <span className="chart-symbol">QTM / USDT <b>· {t.simulation}</b></span>
      <span>{t.price} <b className={positive ? 'up' : 'down'}>{formatPrice(targetPrice, language)}</b></span>
    </div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t.chartTitle} preserveAspectRatio="none">
      <rect width={width} height={height} fill="#080b10" />
      {gridRows.map((row) => {
        const gridY = top + (plotHeight * row) / (gridRows.length - 1)
        const price = maxPrice - ((maxPrice - minPrice) * row) / (gridRows.length - 1)
        return <g key={`row-${row}`}><line x1={left} x2={width - right} y1={gridY} y2={gridY} className="tv-grid" /><text x={width - right + 10} y={gridY + 4} className="tv-axis-label">{formatPrice(price, language)}</text></g>
      })}
      {gridColumns.map((column) => {
        const gridX = left + (plotWidth * column) / (gridColumns.length - 1)
        const step = Math.round((data.length - 1) * column / (gridColumns.length - 1)) + 1
        return <g key={`column-${column}`}><line x1={gridX} x2={gridX} y1={top} y2={height - bottom} className="tv-grid" /><text x={gridX} y={height - 12} textAnchor="middle" className="tv-axis-label">{step}</text></g>
      })}
      <line x1={left} x2={width - right} y1={y(initialPrice)} y2={y(initialPrice)} className="initial-price-line" />
      <text x={left + 7} y={y(initialPrice) - 7} className="initial-price-label">{t.initial} · {formatPrice(initialPrice, language)}</text>
      <polyline points={linePoints} className={`price-line-glow ${positive ? 'up' : 'down'}`} />
      <polyline points={linePoints} className={`price-line ${positive ? 'up' : 'down'}`} />
      <circle cx={x(0)} cy={y(data[0].price)} r="4" className="price-point start" />
      <circle cx={x(data.length - 1)} cy={y(targetPrice)} r="5" className={`price-point ${positive ? 'up' : 'down'}`} />
      <line x1={x(data.length - 1)} x2={width - right} y1={y(targetPrice)} y2={y(targetPrice)} className={`current-price-line ${positive ? 'up' : 'down'}`} />
      <g transform={`translate(${width - right + 3} ${y(targetPrice) - 10})`}><rect width="73" height="20" rx="3" className={`current-price-box ${positive ? 'up' : 'down'}`} /><text x="36.5" y="14" textAnchor="middle" className="current-price-text">{formatPrice(targetPrice, language)}</text></g>
    </svg>
  </div>
}

type AllocationTooltipProps = { active?: boolean; payload?: Array<{ payload: { name: string; allocation: number; amount: number; color: string } }>; language: Language }
function AllocationTooltip({ active, payload, language }: AllocationTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const t = COPY[language]
  return <div className="chart-tooltip allocation-tooltip">
    <div className="tooltip-label">{item.name}</div>
    <div className="tooltip-row"><span>{t.allocation}</span><b>%{formatNumber(item.allocation, language)}</b></div>
    <div className="tooltip-row"><span>{t.qtmAmount}</span><b>{formatNumber(item.amount, language)}</b></div>
  </div>
}

function Field({ label, value, onChange, suffix, hint, step = 0.001 }: { label: string; value: NumericValue; onChange: (value: NumericValue) => void; suffix: string; hint?: string; step?: number }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-shell"><input type="number" value={value} min="0" step={step} onChange={(event) => onChange(inputValue(event.target.value))} aria-label={label} /><NumberStepper value={value} step={step} onChange={onChange} label={label} /><span>{suffix}</span></span>{hint && <small>{hint}</small>}</label>
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note?: string; accent?: boolean }) {
  return <div className={`metric ${accent ? 'metric-accent' : ''}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
}

export default function App() {
  const [language, setLanguage] = useState<Language>('tr')
  const [initialPrice, setInitialPrice] = useState<NumericValue>(0.01)
  const [usdtLiquidity, setUsdtLiquidity] = useState<NumericValue>(100_000)
  const [targetPrice, setTargetPrice] = useState<NumericValue>(0.05)
  const [activeScenario, setActiveScenario] = useState<string>('good')
  const [totalSupply, setTotalSupply] = useState<NumericValue>(210_000_000)
  const [allocationValues, setAllocationValues] = useState<Record<string, NumericValue>>(() => Object.fromEntries(ALLOCATIONS.map((item) => [item.id, item.allocation])))
  const t = COPY[language]

  useEffect(() => { document.documentElement.lang = language }, [language])

  const model = useMemo(() => {
    const p0 = safePositive(initialPrice, 0.01), quote = safePositive(usdtLiquidity, 100_000), p1 = safePositive(targetPrice, p0)
    const tokenReserve = quote / p0, k = quote * tokenReserve, finalToken = Math.sqrt(k / p1), finalUsdt = Math.sqrt(k * p1)
    const initialValue = quote * 2, finalValue = finalUsdt * 2, change = ((p1 / p0) - 1) * 100
    return { p0, p1, quote, tokenReserve, k, finalToken, finalUsdt, initialValue, finalValue, change }
  }, [initialPrice, targetPrice, usdtLiquidity])

  const chartData = useMemo(() => {
    const points = 56
    const logStart = Math.log(model.p0), logTarget = Math.log(model.p1)
    const trendDistance = Math.abs(logTarget - logStart)
    const volatility = Math.min(0.17, 0.028 + trendDistance * 0.075)
    return Array.from({ length: points }, (_, index) => {
      const progress = (index + 1) / points
      const wave = (Math.sin(index * 0.83) * 0.56 + Math.sin(index * 0.29 + 1.1) * 0.34 + Math.sin(index * 1.73) * 0.1) * volatility * Math.sin(Math.PI * progress)
      const price = index === points - 1 ? model.p1 : Math.exp(logStart + (logTarget - logStart) * progress + wave)
      return { step: index + 1, price }
    })
  }, [model])

  const allocations = useMemo(() => ALLOCATIONS.map((item) => {
    const rawAllocation = allocationValues[item.id]
    const allocation = typeof rawAllocation === 'number' ? rawAllocation : 0
    return { ...item, name: language === 'tr' ? item.nameTr : item.nameEn, allocation, amount: (safePositive(totalSupply, 210_000_000) * allocation) / 100 }
  }), [allocationValues, language, totalSupply])
  const allocationTotal = useMemo(() => allocations.reduce((sum, item) => sum + item.allocation, 0), [allocations])
  const allocationIsValid = Math.abs(allocationTotal - 100) < 0.001, allocationDifference = 100 - allocationTotal, allocatedAmount = safePositive(totalSupply, 210_000_000) * allocationTotal / 100
  const selectedScenario = SCENARIOS.find((scenario) => scenario.id === activeScenario)

  const applyScenario = (id: string, change: number) => { setActiveScenario(id); setTargetPrice(Number((model.p0 * (1 + change / 100)).toPrecision(8))) }
  const updateAllocation = (id: string, value: NumericValue) => setAllocationValues((current) => ({ ...current, [id]: value === '' ? '' : Math.min(100, Math.max(0, value)) }))
  const resetAllocations = () => setAllocationValues(Object.fromEntries(ALLOCATIONS.map((item) => [item.id, item.allocation])))
  const resetPoolInputs = () => { setInitialPrice(0.01); setUsdtLiquidity(100_000) }

  return <main>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="page-shell">
      <header className="hero">
        <div><div className="eyebrow"><span /> {t.toolkit}</div><h1>Liquidity & Tokenomics Lab</h1><p>{t.heroDescription}</p></div>
        <div className="hero-actions"><div className="lang-switch" aria-label="Language selection"><button className={language === 'tr' ? 'active' : ''} onClick={() => setLanguage('tr')}>TR</button><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div><div className="status-pill"><span /> {t.modelReady} <b>V2</b></div></div>
      </header>

      <section className="stage" id="liquidity">
        <div className="section-heading"><div className="stage-number">01</div><div><span className="kicker">{t.setupKicker}</span><h2>{t.setupTitle}</h2><p>{t.setupDescription}</p></div></div>
        <div className="setup-grid">
          <div className="panel input-panel">
            <div className="panel-title-row"><div><span className="overline no-rule">{t.poolInputs}</span><h3>{t.initialParameters}</h3></div><div className="panel-actions"><button type="button" className="reset-button compact" onClick={resetPoolInputs}>{t.resetPool}</button><span className="network-chip">BSC · V2</span></div></div>
            <div className="field-grid"><Field label={t.initialPrice} value={initialPrice} onChange={setInitialPrice} suffix="USDT" hint={t.initialPriceHint} /><Field label={t.liquidityInput} value={usdtLiquidity} onChange={setUsdtLiquidity} suffix="USDT" hint={t.liquidityHint} step={1000} /></div>
            <div className="formula-strip"><span>{t.requiredQtm}</span><code>{t.formula}</code><strong>{formatNumber(model.tokenReserve, language)} QTM</strong></div>
          </div>
          <div className="pool-card">
            <div className="pool-topline"><span>{t.initialPool}</span><span className="live-dot">{t.balanced}</span></div>
            <div className="pair-row"><div className="token-mark qtm">Q</div><div><span>{t.qtmAmount}</span><strong>{formatNumber(model.tokenReserve, language)}</strong></div></div>
            <div className="pair-divider"><span>+</span></div>
            <div className="pair-row"><div className="token-mark usdt">₮</div><div><span>{t.usdtAmount}</span><strong>{formatNumber(model.quote, language)}</strong></div></div>
            <div className="pool-value"><span>{t.initialValue}</span><b>${formatNumber(model.initialValue, language)}</b></div>
          </div>
        </div>
        <div className="steps-panel">
          <div className="step-item"><span>1</span><div><b>{t.step1Title}</b><small>{t.step1Note}</small></div></div><div className="step-line" />
          <div className="step-item"><span>2</span><div><b>{t.step2Title}</b><small>1 QTM = {formatPrice(model.p0, language)} USDT. {t.step2Note}</small></div></div><div className="step-line" />
          <div className="step-item"><span>3</span><div><b>{t.step3Title}</b><small>{formatCompact(model.quote, language)} USDT + {formatCompact(model.tokenReserve, language)} QTM.</small></div></div><div className="step-line" />
          <div className="step-item"><span>4</span><div><b>{t.step4Title}</b><small>{t.step4Note}</small></div></div>
        </div>
      </section>

      <section className="stage" id="scenario">
        <div className="section-heading"><div className="stage-number">02</div><div><span className="kicker">{t.scenarioKicker}</span><h2>{t.scenarioTitle}</h2><p>{t.scenarioDescription}</p></div></div>
        <div className="scenario-toolbar panel">
          <Field label={t.targetPrice} value={targetPrice} onChange={(value) => { setTargetPrice(value); setActiveScenario('') }} suffix="USDT" />
          <div className="scenario-presets"><span>{t.readyScenarios}</span><div>{SCENARIOS.map((scenario) => <button className={activeScenario === scenario.id ? 'active' : ''} key={scenario.id} onClick={() => applyScenario(scenario.id, scenario.change)}>{language === 'tr' ? scenario.labelTr : scenario.labelEn}<small>{scenario.change > 0 ? '+' : ''}{scenario.change}%</small></button>)}</div>{selectedScenario && <p className="scenario-note"><span />{language === 'tr' ? selectedScenario.noteTr : selectedScenario.noteEn}</p>}</div>
          <div className={`change-badge ${model.change < 0 ? 'negative' : ''}`}><span>{t.priceChange}</span><strong>{model.change >= 0 ? '+' : ''}{formatNumber(model.change, language)}%</strong></div>
        </div>
        <div className="metrics-grid">
          <Metric label={t.poolUsdt} value={`${formatNumber(model.finalUsdt, language)} USDT`} note={`${formatNumber(model.finalUsdt - model.quote, language)} ${t.reserveChange}`} accent />
          <Metric label={t.poolQtm} value={`${formatNumber(model.finalToken, language)} QTM`} note={`${formatNumber(model.finalToken - model.tokenReserve, language)} ${t.reserveChange}`} />
          <Metric label={t.lpValue} value={`$${formatNumber(model.finalValue, language)}`} note={`${t.fromInitial} ${model.finalValue >= model.initialValue ? '+' : ''}${formatNumber(((model.finalValue / model.initialValue) - 1) * 100, language)}%`} />
        </div>
        <div className="chart-panel panel">
          <div className="panel-title-row chart-title"><div><span className="overline no-rule">{t.constantCurve}</span><h3>{t.chartTitle}</h3><p>{t.chartDescription}</p></div><div className="formula-chip">x × y = {model.k.toExponential(2)}</div></div>
          <div className="chart-wrap classic-chart"><PriceLineChart data={chartData} language={language} initialPrice={model.p0} targetPrice={model.p1} /></div>
          <div className="chart-caption"><span>{t.initial} ${formatPrice(model.p0, language)}</span><i /><span>{t.target} ${formatPrice(model.p1, language)}</span></div>
        </div>
        <div className="notice"><b>{t.modelNote}</b><span>{t.modelDisclaimer}</span></div>
      </section>

      <section className="stage tokenomics" id="tokenomics">
        <div className="section-heading"><div className="stage-number">03</div><div><span className="kicker">{t.tokenomicsKicker}</span><h2>{t.tokenomicsTitle}</h2><p>{t.tokenomicsDescription}</p></div></div>
        <div className="supply-bar panel">
          <label><span className="field-label">{t.totalSupply}</span><span className="supply-input"><input type="number" min="1" step="1000000" value={totalSupply} onChange={(event) => setTotalSupply(inputValue(event.target.value))} /><NumberStepper value={totalSupply} step={1_000_000} min={1} onChange={setTotalSupply} label={t.totalSupply} /><b>QTM</b></span></label>
          <div className="supply-presets"><span>{t.quickSelect}</span><div>{SUPPLY_PRESETS.map((preset) => <button className={totalSupply === preset.value ? 'active' : ''} key={preset.label} onClick={() => setTotalSupply(preset.value)}>{preset.label}</button>)}</div></div>
          <div className="supply-total"><span>{t.calculatedTotal}</span><strong>{formatNumber(safePositive(totalSupply, 210_000_000), language)}</strong></div>
        </div>
        <div className="allocation-editor panel">
          <div className="allocation-editor-heading"><div><span className="overline no-rule">{t.allocationEditor}</span><p>{t.allocationEditorNote}</p></div><button type="button" className="reset-button" onClick={resetAllocations}>{t.reset}</button></div>
          <div className="allocation-inputs">{ALLOCATIONS.map((item) => <label key={item.id}><span><i style={{ background: item.color }} />{language === 'tr' ? item.nameTr : item.nameEn}</span><span className="allocation-input-shell"><input type="number" min="0" max="100" step="0.1" value={allocationValues[item.id]} onChange={(event) => updateAllocation(item.id, inputValue(event.target.value))} /><NumberStepper value={allocationValues[item.id]} step={0.1} onChange={(value) => updateAllocation(item.id, value)} label={language === 'tr' ? item.nameTr : item.nameEn} /><b>%</b></span></label>)}</div>
          <div className={`allocation-summary ${allocationIsValid ? 'valid' : 'invalid'}`}><span>{t.allocationTotal}</span><strong>%{formatNumber(allocationTotal, language)}</strong>{!allocationIsValid && <em className={allocationDifference > 0 ? 'remaining' : 'excess'} title={allocationDifference > 0 ? t.remaining : t.excess}>{allocationDifference > 0 ? '+' : '-'}{formatNumber(Math.abs(allocationDifference), language)}%</em>}<small>{allocationIsValid ? t.validAllocation : t.invalidAllocation}</small></div>
        </div>
        <div className="allocation-grid">
          <div className="donut-panel panel">
            <div className="panel-title-row"><div><span className="overline no-rule">{t.allocationView}</span><h3>QTM Allocation</h3></div><span className="network-chip">{t.categories}</span></div>
            <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={allocations} dataKey="allocation" nameKey="name" cx="50%" cy="50%" innerRadius="68%" outerRadius="91%" paddingAngle={2} stroke="none">{allocations.map((entry) => <Cell key={entry.id} fill={entry.color} />)}</Pie><Tooltip content={<AllocationTooltip language={language} />} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{formatNumber(allocationTotal, language)}%</strong><span>QTM Allocation</span><small>{formatCompact(allocatedAmount, language)} QTM</small></div></div>
            <div className="donut-foot"><span>{t.totalCategories}</span><b>9</b><i /><span>{t.allocated}</span><b>%{formatNumber(allocationTotal, language)}</b></div>
          </div>
          <div className="table-panel panel">
            <div className="table-header"><span>{t.category}</span><span>{t.allocation}</span><span>{t.qtmAmountHeader}</span></div>
            <div className="table-body">{allocations.map((item) => <div className="table-row" key={item.id}><span className="category"><i style={{ background: item.color, boxShadow: `0 0 10px ${item.color}55` }} />{item.name}</span><span>%{formatNumber(item.allocation, language)}</span><strong>{formatNumber(item.amount, language)}</strong></div>)}</div>
            <div className="table-total"><span>{t.allocatedTotal}</span><span>%{formatNumber(allocationTotal, language)}</span><strong>{formatNumber(allocatedAmount, language)} QTM</strong></div>
          </div>
        </div>
      </section>
      <footer><span>QTM Liquidity Lab</span><span>{t.footerModel}</span></footer>
    </div>
  </main>
}
