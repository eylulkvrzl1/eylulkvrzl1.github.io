import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPool, executeSelectedTrades, MAX_DAILY_ORDERS, maxBuyForImpact, simulateDailyPlan } from './amm'

type Language = 'tr' | 'en'
type Page = 'pool' | 'maker' | 'live'
type NumericValue = number | ''

const TOKEN_ADDRESS = '0x1044f6a2299cdb1e48b2bbf259e577bb27eb5f11'
const POOL_ADDRESS = '0x61ec97d576bda871204b21f10aa252ddd661a33e'
const CMC_URL = `https://dex.coinmarketcap.com/token/bsc/${TOKEN_ADDRESS}/`
const CMC_API = 'https://pro-api.coinmarketcap.com/public-api'
const BSC_RPC = 'https://bsc-dataseed.binance.org'

const TEXT = {
  tr: {
    toolkit: 'QTM · DEVELOPER ARAÇLARI', title: 'Liquidity & Market Lab', subtitle: 'Havuzu kurun, market maker planını hesaplayın ve QTM verilerini takip edin.', ready: 'Model hazır',
    poolTab: 'Havuz Kurulumu', makerTab: 'Market Maker', liveTab: 'QTM Canlı',
    setupKicker: 'PANCAKESWAP V2 · İLK KURULUM', setupTitle: 'Fiyat ve likiditeyi belirleyin', setupDescription: 'İlk havuz oranı QTM fiyatını belirler. QTM tarafı USDT miktarından otomatik hesaplanır.', poolInputs: 'HAVUZ GİRDİLERİ', initialParameters: 'Başlangıç parametreleri', initialPrice: '1 QTM başlangıç fiyatı', liquidityInput: 'Eklenecek USDT likiditesi', fee: 'AMM işlem ücreti', tax: 'Token vergisi', requiredQtm: 'Gerekli QTM', formula: 'USDT likiditesi ÷ QTM fiyatı', initialPool: 'İLK HAVUZ KOMPOZİSYONU', balanced: 'Dengeli', qtmAmount: 'QTM miktarı', usdtAmount: 'USDT miktarı', initialValue: 'Toplam başlangıç değeri', reset: 'Başlangıca dön',
    step1: 'Pair oluştur', step1n: 'PancakeSwap V2 üzerinde QTM / USDT çiftini seçin.', step2: 'Fiyat oranını gir', step2n: 'USDT olarak başlangıç oranını belirleyin.', step3: 'Varlıkları ekle', step4: 'Onayla ve kilitle', step4n: 'LP token ve kilit süresini doğrulayın.',
    makerKicker: 'QUANTUM TOKEN · MARKET MAKER', makerTitle: 'Günlük hacim ve fiyat etkisini planlayın', makerDescription: 'Her emri seçtiğiniz alış veya satış miktarıyla sırayla V2 rezervlerine uygulayın.', poolState: 'BAŞLANGIÇ HAVUZU', planInputs: 'Market maker parametreleri', qtmReserve: 'QTM rezervi', usdtReserve: 'USDT rezervi', dailyVolume: 'Hesaplanan günlük hacim', orderCount: 'Günlük emir sayısı', impactLimit: 'Emir başına hareket sınırı', orderSize: 'Ortalama emir', buyVolume: 'Alış hacmi', sellVolume: 'Satış hacmi', requiredUsdtCapital: 'Gerekli USDT sermayesi', requiredQtmCapital: 'Gerekli başlangıç QTM', estimatedFees: 'Tahmini AMM ücretleri', estimatedTax: 'Tahmini token vergisi', executionCost: 'Tahmini uygulama maliyeti', endDrift: 'Gün sonu fiyat sapması', maxImpact: 'En yüksek emir etkisi', safeBuy: 'Sınır içi azami alış', healthy: 'Emir büyüklüğü seçilen sınır içinde.', warning: 'Emir büyüklüğü seçilen fiyat hareketi sınırını aşıyor.',
    useLivePool: 'Canlı CMC havuzunu kullan', livePoolHint: 'CMC / BNB Chain rezervlerini girişlere aktarır', instant: 'GÜNLÜK EMİR YÖNLERİ', instantTitle: 'Emir başına miktarı belirleyin', buy: 'QTM al', sell: 'QTM sat', buyInput: 'Her alış emrinde harcanacak USDT', sellInput: 'Her satış emrinde satılacak QTM', included: 'Plana dahil', excluded: 'Dahil değil', receives: 'Alınacak miktar', priceAfterTrade: 'İşlem sonrası fiyat', priceImpact: 'Fiyat hareketi', afterPool: 'Seçili işlemler sonrası havuz', executionOrder: 'Günlük emir sayısı kadar işlem yapılır. İki yön açıksa emirler alıştan başlayarak sırayla alış ve satış olarak uygulanır.', chartTitle: 'Emirler ilerledikçe fiyat', chartDescription: 'Çizgi, her emrin ardından oluşan gerçek havuz fiyatını gösterir.', start: 'Başlangıç fiyatı', afterInstant: 'İlk emir sonrası', afterDaily: 'Son fiyat', chartChange: 'Toplam değişim', chartPriceAxis: 'QTM fiyatı (USDT)', chartOrderAxis: 'Emir sırası', chartOrder: 'emir', notice: 'Bu araç meşru piyasa yapıcılık planlaması içindir; yapay veya kendi kendine eşleşen hacim üretimi için kullanılmamalıdır.', positiveError: 'Sıfırdan büyük bir değer girin.', nonnegativeError: 'Sıfır veya daha büyük bir değer girin.', rateError: '0 ile 100 arasında bir değer girin.', integerError: 'Sıfır veya pozitif tam sayı girin.', orderRangeError: 'En fazla 100.000 günlük emir girebilirsiniz.', fixInputs: 'Sonuçları görmek için işaretli alanları düzeltin.', invalid: 'Geçersiz giriş',
    liveKicker: 'QTM · COINMARKETCAP DEX', liveTitle: 'QTM canlı piyasa görünümü', liveDescription: 'QTM/USDT havuzunun CoinMarketCap ve BNB Chain üzerinden alınan son verileri.', refresh: 'Şimdi yenile', refreshing: 'Yenileniyor', liveData: 'Canlı veri', snapshot: 'Son doğrulanmış snapshot', source: 'Kaynak', updated: 'Güncelleme', price: 'QTM fiyatı', liquidity: 'Likidite', volume24: '24s hacim', change1: '1s değişim', change24: '24s değişim', transactions: '24s işlem', buys: 'Alış', sells: 'Satış', holders: 'Holder', fdv: 'FDV', poolDetails: 'HAVUZ BİLGİSİ', network: 'Ağ', dex: 'DEX', poolAddress: 'Pool adresi', tokenAddress: 'Token adresi', created: 'Havuz oluşturma', openCmc: 'CoinMarketCap sayfasını aç', unavailable: 'Veri yok', liveNote: 'CoinMarketCap anahtarsız API birincil kaynaktır. Kota veya CORS kısıtında rezervler doğrudan BNB Chain üzerinden yenilenir; CMC’ye özel eksik alanlar tahmin edilmez.',
  },
  en: {
    toolkit: 'QTM · DEVELOPER TOOLKIT', title: 'Liquidity & Market Lab', subtitle: 'Set up the pool, calculate a market-maker plan and monitor QTM data.', ready: 'Model ready',
    poolTab: 'Pool Setup', makerTab: 'Market Maker', liveTab: 'QTM Live',
    setupKicker: 'PANCAKESWAP V2 · INITIAL SETUP', setupTitle: 'Set price and liquidity', setupDescription: 'The initial pool ratio defines the QTM price. The QTM side is calculated from the USDT amount.', poolInputs: 'POOL INPUTS', initialParameters: 'Initial parameters', initialPrice: 'Initial price of 1 QTM', liquidityInput: 'USDT liquidity to add', fee: 'AMM trading fee', tax: 'Token tax', requiredQtm: 'Required QTM', formula: 'USDT liquidity ÷ QTM price', initialPool: 'INITIAL POOL COMPOSITION', balanced: 'Balanced', qtmAmount: 'QTM amount', usdtAmount: 'USDT amount', initialValue: 'Total initial value', reset: 'Reset inputs',
    step1: 'Create pair', step1n: 'Select the QTM / USDT pair on PancakeSwap V2.', step2: 'Enter price ratio', step2n: 'Set the initial ratio in USDT.', step3: 'Add assets', step4: 'Approve and lock', step4n: 'Verify LP tokens and the lock period.',
    makerKicker: 'QUANTUM TOKEN · MARKET MAKER', makerTitle: 'Plan daily volume and price impact', makerDescription: 'Apply every order sequentially to V2 reserves using your selected buy or sell amount.', poolState: 'STARTING POOL', planInputs: 'Market-maker parameters', qtmReserve: 'QTM reserve', usdtReserve: 'USDT reserve', dailyVolume: 'Calculated daily volume', orderCount: 'Orders per day', impactLimit: 'Movement limit per order', orderSize: 'Average order', buyVolume: 'Buy volume', sellVolume: 'Sell volume', requiredUsdtCapital: 'Required USDT capital', requiredQtmCapital: 'Required starting QTM', estimatedFees: 'Estimated AMM fees', estimatedTax: 'Estimated token tax', executionCost: 'Estimated execution drag', endDrift: 'End-of-day price drift', maxImpact: 'Maximum order impact', safeBuy: 'Maximum buy within limit', healthy: 'Order size stays inside the selected limit.', warning: 'Order size exceeds the selected price-movement limit.',
    useLivePool: 'Use live CMC pool', livePoolHint: 'Loads CMC / BNB Chain reserves into the inputs', instant: 'DAILY ORDER DIRECTIONS', instantTitle: 'Set the amount per order', buy: 'Buy QTM', sell: 'Sell QTM', buyInput: 'USDT spent in each buy order', sellInput: 'QTM sold in each sell order', included: 'Included in plan', excluded: 'Not included', receives: 'Amount received', priceAfterTrade: 'Price after trade', priceImpact: 'Price movement', afterPool: 'Pool after selected trades', executionOrder: 'The selected number of daily orders is executed. When both directions are enabled, orders alternate between buy and sell, starting with buy.', chartTitle: 'Price as orders progress', chartDescription: 'The line shows the actual pool price after every order.', start: 'Starting price', afterInstant: 'After first order', afterDaily: 'Final price', chartChange: 'Total change', chartPriceAxis: 'QTM price (USDT)', chartOrderAxis: 'Order sequence', chartOrder: 'orders', notice: 'This tool is for legitimate market-making planning; it should not be used to create artificial or self-matched volume.', positiveError: 'Enter a value greater than zero.', nonnegativeError: 'Enter zero or a greater value.', rateError: 'Enter a value from 0 up to 100.', integerError: 'Enter zero or a positive whole number.', orderRangeError: 'Enter no more than 100,000 daily orders.', fixInputs: 'Correct the highlighted fields to see results.', invalid: 'Invalid input',
    liveKicker: 'QTM · COINMARKETCAP DEX', liveTitle: 'QTM live market view', liveDescription: 'The latest QTM/USDT pool data available from CoinMarketCap and BNB Chain.', refresh: 'Refresh now', refreshing: 'Refreshing', liveData: 'Live data', snapshot: 'Last verified snapshot', source: 'Source', updated: 'Updated', price: 'QTM price', liquidity: 'Liquidity', volume24: '24h volume', change1: '1h change', change24: '24h change', transactions: '24h transactions', buys: 'Buys', sells: 'Sells', holders: 'Holders', fdv: 'FDV', poolDetails: 'POOL DETAILS', network: 'Network', dex: 'DEX', poolAddress: 'Pool address', tokenAddress: 'Token address', created: 'Pool created', openCmc: 'Open CoinMarketCap page', unavailable: 'Unavailable', liveNote: 'CoinMarketCap keyless API is primary. When quota or CORS restrictions apply, reserves refresh directly from BNB Chain; CMC-only missing fields are not estimated.',
  },
} as const

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const format = (value: number, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)
const money = (value: number | null, digits = 2) => value === null ? '—' : `$${format(value, digits)}`
const percent = (value: number | null) => value === null ? '—' : `${value >= 0 ? '+' : ''}${format(value)}%`
const inputValue = (value: string): NumericValue => value === '' ? '' : Number(value)
const isNumber = (value: NumericValue): value is number => typeof value === 'number' && Number.isFinite(value)
const isPositive = (value: NumericValue): value is number => isNumber(value) && value > 0
const isNonnegative = (value: NumericValue): value is number => isNumber(value) && value >= 0
const isRatePercent = (value: NumericValue): value is number => isNonnegative(value) && value < 100

function NumberStepper({ value, step, onChange, label, min = 0, max = Number.POSITIVE_INFINITY }: { value: NumericValue; step: number; onChange: (value: NumericValue) => void; label: string; min?: number; max?: number }) {
  const adjust = (direction: number) => onChange(Math.min(max, Math.max(min, Number(((typeof value === 'number' ? value : min) + step * direction).toPrecision(12)))))
  return <span className="supply-stepper" aria-label={label}><button type="button" onClick={() => adjust(1)}><i className="chevron-up" /></button><button type="button" onClick={() => adjust(-1)}><i className="chevron-down" /></button></span>
}

function Field({ label, value, onChange, suffix, step = 0.001, min = 0, max, error }: { label: string; value: NumericValue; onChange: (value: NumericValue) => void; suffix: string; step?: number; min?: number; max?: number; error?: string }) {
  return <label className={`field ${error ? 'field-invalid' : ''}`}><span className="field-label">{label}</span><span className="input-shell"><input type="number" value={value} min={min} max={max} step={step} aria-invalid={Boolean(error)} onChange={(event) => onChange(inputValue(event.target.value))} /><NumberStepper value={value} step={step} onChange={onChange} label={label} min={min} max={max} /><span>{suffix}</span></span>{error && <small className="field-error">{error}</small>}</label>
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note?: string; accent?: boolean }) {
  return <div className={`metric ${accent ? 'metric-accent' : ''}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
}

function PriceChart({ values, labels, changeLabel, priceAxis, orderAxis, orderLabel }: { values: number[]; labels: [string, string, string]; changeLabel: string; priceAxis: string; orderAxis: string; orderLabel: string }) {
  const start = values[0], first = values[1] ?? start, end = values.at(-1) ?? start
  const totalOrders = Math.max(0, values.length - 1)
  const totalChange = start === 0 ? 0 : (end / start - 1) * 100
  const trend = totalChange > .000001 ? 'up' : totalChange < -.000001 ? 'down' : 'flat'
  const changeText = trend === 'flat' ? '0%' : percent(totalChange)
  const width = 780, height = 275, left = 116, right = 24, top = 24, bottom = 48
  const plotWidth = width - left - right, plotHeight = height - top - bottom
  let rawMin = start, rawMax = start
  for (const value of values) { rawMin = Math.min(rawMin, value); rawMax = Math.max(rawMax, value) }
  const rawSpread = rawMax - rawMin
  const padding = rawSpread > 0 ? rawSpread * .12 : Math.max(Math.abs(start) * .03, .000001)
  const min = Math.max(0, rawMin - padding), max = rawMax + padding, spread = max - min || 1
  const x = (index: number) => left + index / Math.max(totalOrders, 1) * plotWidth
  const y = (value: number) => top + (max - value) / spread * plotHeight
  const sampleStep = Math.max(1, Math.ceil(values.length / 140))
  const series: Array<{ value: number; index: number }> = []
  for (let index = 0; index < values.length; index += sampleStep) series.push({ value: values[index], index })
  if (series.at(-1)?.index !== values.length - 1) series.push({ value: values.at(-1) ?? start, index: values.length - 1 })
  const linePath = series.map(({ value, index }, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ')
  const areaPath = `${linePath} L ${x(totalOrders)} ${top + plotHeight} L ${left} ${top + plotHeight} Z`
  const yTicks = Array.from({ length: 5 }, (_, index) => max - index * spread / 4)
  const xTicks = Array.from(new Set([0, Math.round(totalOrders / 2), totalOrders]))
  const priceText = (value: number) => value >= 1 ? format(value, 4) : value >= .0001 ? format(value, 6) : value.toExponential(2)
  return <div className={`price-chart price-chart-${trend}`} aria-live="polite">
    <div className="chart-kpis">
      <div><span>{labels[0]}</span><strong>${priceText(start)}</strong></div>
      <div><span>{labels[1]}</span><strong>${priceText(first)}</strong></div>
      <div><span>{labels[2]}</span><strong>${priceText(end)}</strong></div>
      <div className={`chart-change ${trend}`}><span>{changeLabel}</span><strong>{changeText}</strong></div>
    </div>
    <div className="price-plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${labels[0]} ${priceText(start)} USDT, ${labels[2]} ${priceText(end)} USDT, ${changeLabel} ${changeText}`}>
        <title>{`${labels[0]}: ${priceText(start)} USDT. ${labels[2]}: ${priceText(end)} USDT.`}</title>
        <desc>{`${totalOrders} ${orderLabel}. ${changeLabel}: ${changeText}.`}</desc>
        {yTicks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} className="chart-gridline" /><text x={left - 16} y={y(tick) + 4} textAnchor="end" className="chart-axis-text">${priceText(tick)}</text></g>)}
        <line x1={left} x2={width - right} y1={y(start)} y2={y(start)} className="chart-start-line" />
        <path d={areaPath} className="chart-price-area" />
        <path d={linePath} className="chart-price-path" />
        {xTicks.map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={top + plotHeight} y2={top + plotHeight + 5} className="chart-axis-mark" /><text x={x(tick)} y={height - 22} textAnchor="middle" className="chart-axis-text">{tick}</text></g>)}
        <circle cx={x(0)} cy={y(start)} r="5" className="chart-point start"><title>{`${labels[0]}: ${priceText(start)} USDT`}</title></circle>
        {totalOrders > 0 && <circle cx={x(totalOrders)} cy={y(end)} r="6" className={`chart-point ${trend}`}><title>{`${labels[2]}: ${priceText(end)} USDT`}</title></circle>}
        <text x={24} y={height / 2} textAnchor="middle" transform={`rotate(-90 24 ${height / 2})`} className="chart-axis-title">{priceAxis}</text>
        <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" className="chart-axis-title">{orderAxis}</text>
      </svg>
    </div>
  </div>
}

type MarketData = { source: string; updatedAt: string; price: number; liquidity: number; qtmReserve: number; usdtReserve: number; volume24: number | null; change1: number | null; change24: number | null; transactions: number | null; buys: number | null; sells: number | null; holders: number | null; fdv: number | null; created: string | null }
const snapshot: MarketData = { source: 'Verified CMC snapshot', updatedAt: '2026-11-13T13:19:34.590Z', price: .01001, liquidity: 9997.56664295117, qtmReserve: 1_000_000, usdtReserve: 10_010, volume24: null, change1: null, change24: null, transactions: null, buys: null, sells: null, holders: null, fdv: 2_102_100, created: '2026-11-13T12:46:35.000Z' }

async function loadCmc(): Promise<MarketData> {
  const aux = 'pool_created,num_transactions_24h,pool_base_asset,pool_quote_asset,holders,24h_no_of_buys,24h_no_of_sells'
  const response = await fetch(`${CMC_API}/v4/dex/pairs/quotes/latest?contract_address=${POOL_ADDRESS}&network_slug=bsc&aux=${aux}`)
  if (!response.ok) throw new Error('CMC unavailable')
  const body = await response.json(), row = body?.data?.[0], quote = row?.quote?.[0]
  if (!row || !quote) throw new Error('CMC pair unavailable')
  const qtmReserve = Number(row.pool_base_asset), usdtReserve = Number(row.pool_quote_asset)
  return { source: 'CoinMarketCap', updatedAt: quote.last_updated ?? row.last_updated ?? body.status?.timestamp, price: Number(quote.price) || usdtReserve / qtmReserve, liquidity: Number(quote.liquidity), qtmReserve, usdtReserve, volume24: Number.isFinite(Number(quote.volume_24h)) ? Number(quote.volume_24h) : null, change1: Number.isFinite(Number(quote.percent_change_price_1h)) ? Number(quote.percent_change_price_1h) : null, change24: Number.isFinite(Number(quote.percent_change_price_24h)) ? Number(quote.percent_change_price_24h) : null, transactions: Number.isFinite(Number(row.num_transactions_24h)) ? Number(row.num_transactions_24h) : null, buys: Number.isFinite(Number(row['24h_no_of_buys'])) ? Number(row['24h_no_of_buys']) : null, sells: Number.isFinite(Number(row['24h_no_of_sells'])) ? Number(row['24h_no_of_sells']) : null, holders: Number.isFinite(Number(row.holders)) ? Number(row.holders) : null, fdv: Number.isFinite(Number(quote.fully_diluted_value)) ? Number(quote.fully_diluted_value) : null, created: row.pool_created ?? row.created_at ?? null }
}

async function loadOnchain(): Promise<MarketData> {
  const response = await fetch(BSC_RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: POOL_ADDRESS, data: '0x0902f1ac' }, 'latest'] }) })
  if (!response.ok) throw new Error('RPC unavailable')
  const body = await response.json(), hex = String(body.result ?? '').replace(/^0x/, '')
  if (hex.length < 192) throw new Error('Invalid reserves')
  const qtmReserve = Number(BigInt(`0x${hex.slice(0, 64)}`)) / 1e18
  const usdtReserve = Number(BigInt(`0x${hex.slice(64, 128)}`)) / 1e18
  const timestamp = Number(BigInt(`0x${hex.slice(128, 192)}`))
  const price = usdtReserve / qtmReserve
  return { ...snapshot, source: 'BNB Chain RPC', updatedAt: new Date(timestamp * 1000).toISOString(), price, liquidity: usdtReserve * 2, qtmReserve, usdtReserve, fdv: price * 210_000_000 }
}

export default function App() {
  const [language, setLanguage] = useState<Language>('tr')
  const [page, setPage] = useState<Page>(() => (location.hash.slice(1) as Page) || 'pool')
  const [initialPrice, setInitialPrice] = useState<NumericValue>(.01)
  const [usdtLiquidity, setUsdtLiquidity] = useState<NumericValue>(100_000)
  const [mmQtmReserve, setMmQtmReserve] = useState<NumericValue>(10_000_000)
  const [mmUsdtReserve, setMmUsdtReserve] = useState<NumericValue>(100_000)
  const [feePct, setFeePct] = useState<NumericValue>(.25)
  const [taxPct, setTaxPct] = useState<NumericValue>(0)
  const [orderCount, setOrderCount] = useState<NumericValue>(100)
  const [impactLimit, setImpactLimit] = useState<NumericValue>(2)
  const [buyEnabled, setBuyEnabled] = useState(true)
  const [sellEnabled, setSellEnabled] = useState(false)
  const [buyAmount, setBuyAmount] = useState<NumericValue>(1_000)
  const [sellAmount, setSellAmount] = useState<NumericValue>(100_000)
  const [marketData, setMarketData] = useState<MarketData>(snapshot)
  const [liveState, setLiveState] = useState<'loading' | 'live' | 'snapshot'>('loading')
  const t = TEXT[language]

  const priceValid = isPositive(initialPrice), quoteValid = isPositive(usdtLiquidity)
  const qtmReserveValid = isPositive(mmQtmReserve), usdtReserveValid = isPositive(mmUsdtReserve)
  const feeValid = isRatePercent(feePct), taxValid = isRatePercent(taxPct)
  const ordersFormatValid = isNonnegative(orderCount) && Number.isInteger(orderCount)
  const ordersValid = ordersFormatValid && Number(orderCount) <= MAX_DAILY_ORDERS
  const buyAmountValid = isNonnegative(buyAmount), sellAmountValid = isNonnegative(sellAmount)
  const impactValid = isNonnegative(impactLimit)
  const setupValid = priceValid && quoteValid && feeValid && taxValid
  const makerValid = qtmReserveValid && usdtReserveValid && feeValid && taxValid && ordersValid && (!buyEnabled || buyAmountValid) && (!sellEnabled || sellAmountValid) && impactValid
  const price = priceValid ? Number(initialPrice) : 1, quote = quoteValid ? Number(usdtLiquidity) : 1
  const fee = feeValid ? Number(feePct) / 100 : 0, tax = taxValid ? Number(taxPct) / 100 : 0
  const orderTotal = ordersValid ? Number(orderCount) : 0
  const buyOrderAmount = buyAmountValid ? Number(buyAmount) : 0, sellOrderAmount = sellAmountValid ? Number(sellAmount) : 0
  const impact = impactValid ? Number(impactLimit) : 0
  const activeBuy = buyEnabled && buyOrderAmount > 0, activeSell = sellEnabled && sellOrderAmount > 0
  const pool = useMemo(() => createPool(quote, price), [quote, price])
  const mmPool = useMemo(() => ({ tokenReserve: qtmReserveValid ? Number(mmQtmReserve) : 1, quoteReserve: usdtReserveValid ? Number(mmUsdtReserve) : 1 }), [mmQtmReserve, qtmReserveValid, mmUsdtReserve, usdtReserveValid])
  const selectedTrades = useMemo(() => executeSelectedTrades(
    mmPool,
    activeBuy ? buyOrderAmount : null,
    activeSell ? sellOrderAmount : null,
    fee,
    tax,
  ), [mmPool, activeBuy, buyOrderAmount, activeSell, sellOrderAmount, fee, tax])
  const plan = useMemo(() => simulateDailyPlan(mmPool, orderTotal, buyOrderAmount, sellOrderAmount, fee, tax, { buy: activeBuy, sell: activeSell }), [mmPool, orderTotal, buyOrderAmount, sellOrderAmount, fee, tax, activeBuy, activeSell])
  const safeBuy = useMemo(() => maxBuyForImpact(mmPool.quoteReserve, impact, fee), [mmPool, impact, fee])

  const refresh = useCallback(async () => {
    setLiveState('loading')
    try { setMarketData(await loadCmc()); setLiveState('live') }
    catch { try { setMarketData(await loadOnchain()); setLiveState('live') } catch { setMarketData(snapshot); setLiveState('snapshot') } }
  }, [])

  useEffect(() => { document.documentElement.lang = language }, [language])
  useEffect(() => { history.replaceState(null, '', `#${page}`) }, [page])
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 90_000); return () => clearInterval(timer) }, [refresh])

  const resetPool = () => { setInitialPrice(.01); setUsdtLiquidity(100_000); setFeePct(.25); setTaxPct(0) }
  const useLivePool = () => { setMmQtmReserve(Number(marketData.qtmReserve.toPrecision(12))); setMmUsdtReserve(Number(marketData.usdtReserve.toPrecision(12))) }

  return <main><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="page-shell">
    <header className="hero"><div><div className="eyebrow"><span /> {t.toolkit}</div><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="hero-actions"><div className="lang-switch"><button className={language === 'tr' ? 'active' : ''} onClick={() => setLanguage('tr')}>TR</button><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div><div className="status-pill"><span /> {t.ready} <b>V2</b></div></div></header>
    <nav className="app-tabs panel">{(['pool', 'maker', 'live'] as Page[]).map((item) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}>{item === 'pool' ? t.poolTab : item === 'maker' ? t.makerTab : t.liveTab}</button>)}</nav>

    {page === 'pool' && <section className="stage active-stage">
      <div className="section-heading"><div className="stage-number">01</div><div><span className="kicker">{t.setupKicker}</span><h2>{t.setupTitle}</h2><p>{t.setupDescription}</p></div></div>
      <div className="setup-grid">
        <div className="panel input-panel">
          <div className="panel-title-row"><div><span className="overline no-rule">{t.poolInputs}</span><h3>{t.initialParameters}</h3></div><div className="panel-actions"><button className="reset-button compact" onClick={resetPool}>{t.reset}</button><span className="network-chip">BSC · V2</span></div></div>
          <div className="field-grid"><Field label={t.initialPrice} value={initialPrice} onChange={setInitialPrice} suffix="USDT" error={!priceValid ? t.positiveError : undefined} /><Field label={t.liquidityInput} value={usdtLiquidity} onChange={setUsdtLiquidity} suffix="USDT" step={1000} error={!quoteValid ? t.positiveError : undefined} /><Field label={t.fee} value={feePct} onChange={setFeePct} suffix="%" step={.01} max={99.99} error={!feeValid ? t.rateError : undefined} /><Field label={t.tax} value={taxPct} onChange={setTaxPct} suffix="%" step={.01} max={99.99} error={!taxValid ? t.rateError : undefined} /></div>
          <div className="formula-strip"><span>{t.requiredQtm}</span><code>{t.formula}</code><strong>{setupValid ? `${numberFormat.format(pool.tokenReserve)} QTM` : '—'}</strong></div>
        </div>
        <div className="pool-card"><div className="pool-topline"><span>{t.initialPool}</span><span className={setupValid ? 'live-dot' : 'invalid-dot'}>{setupValid ? t.balanced : t.invalid}</span></div><div className="pair-row"><div className="token-mark qtm">Q</div><div><span>{t.qtmAmount}</span><strong>{setupValid ? numberFormat.format(pool.tokenReserve) : '—'}</strong></div></div><div className="pair-divider"><span>+</span></div><div className="pair-row"><div className="token-mark usdt">₮</div><div><span>{t.usdtAmount}</span><strong>{setupValid ? numberFormat.format(pool.quoteReserve) : '—'}</strong></div></div><div className="pool-value"><span>{t.initialValue}</span><b>{setupValid ? `$${numberFormat.format(pool.quoteReserve * 2)}` : '—'}</b></div></div>
      </div>
      <div className="steps-panel"><div className="step-item"><span>1</span><div><b>{t.step1}</b><small>{t.step1n}</small></div></div><div className="step-line" /><div className="step-item"><span>2</span><div><b>{t.step2}</b><small>{setupValid ? `1 QTM = ${format(price, 6)} USDT. ${t.step2n}` : t.fixInputs}</small></div></div><div className="step-line" /><div className="step-item"><span>3</span><div><b>{t.step3}</b><small>{setupValid ? `${format(pool.quoteReserve)} USDT + ${format(pool.tokenReserve)} QTM` : '—'}</small></div></div><div className="step-line" /><div className="step-item"><span>4</span><div><b>{t.step4}</b><small>{t.step4n}</small></div></div></div>
    </section>}

    {page === 'maker' && <section className="stage active-stage">
      <div className="section-heading"><div className="stage-number">02</div><div><span className="kicker">{t.makerKicker}</span><h2>{t.makerTitle}</h2><p>{t.makerDescription}</p></div></div>
      <div className="mm-layout">
        <div className="panel mm-input-panel">
          <div className="panel-title-row"><div><span className="overline no-rule">{t.poolState}</span><h3>{t.planInputs}</h3></div><span className="network-chip">Fee {format(feePct === '' ? 0 : feePct)}% · Tax {format(taxPct === '' ? 0 : taxPct)}%</span></div>
          <button className="live-pool-button" type="button" onClick={useLivePool} disabled={liveState === 'loading'}><span>{liveState === 'loading' ? t.refreshing : t.useLivePool}</span><small>{t.livePoolHint} · {marketData.source}</small></button>
          <div className="field-grid"><Field label={t.qtmReserve} value={mmQtmReserve} onChange={setMmQtmReserve} suffix="QTM" step={1000} error={!qtmReserveValid ? t.positiveError : undefined} /><Field label={t.usdtReserve} value={mmUsdtReserve} onChange={setMmUsdtReserve} suffix="USDT" step={1000} error={!usdtReserveValid ? t.positiveError : undefined} /><Field label={t.orderCount} value={orderCount} onChange={setOrderCount} suffix="ORDERS" step={1} max={MAX_DAILY_ORDERS} error={!ordersFormatValid ? t.integerError : !ordersValid ? t.orderRangeError : undefined} /><Field label={t.fee} value={feePct} onChange={setFeePct} suffix="%" step={.01} max={99.99} error={!feeValid ? t.rateError : undefined} /><Field label={t.tax} value={taxPct} onChange={setTaxPct} suffix="%" step={.01} max={99.99} error={!taxValid ? t.rateError : undefined} /><Field label={t.impactLimit} value={impactLimit} onChange={setImpactLimit} suffix="%" step={.5} error={!impactValid ? t.nonnegativeError : undefined} /></div>
        </div>
        {makerValid ? <div className="panel mm-summary">
          <div className="panel-title-row"><div><span className="overline no-rule">{t.dailyVolume}</span><h3>{format(plan.buyVolumeUsd + plan.sellVolumeUsd)} USDT</h3></div><div className={`mm-health ${plan.maxImpactPct > impact ? 'warn' : 'ok'}`}><b>{format(plan.maxImpactPct)}%</b><span>{plan.maxImpactPct > impact ? t.warning : t.healthy}</span></div></div>
          <div className="metrics-grid mm-metrics"><Metric label={t.orderSize} value={`${format(plan.orderSizeUsd)} USDT`} accent /><Metric label={t.buyVolume} value={`${format(plan.buyVolumeUsd)} USDT`} /><Metric label={t.sellVolume} value={`${format(plan.sellVolumeUsd)} USDT`} /><Metric label={t.requiredUsdtCapital} value={`${format(plan.requiredUsdt)} USDT`} /><Metric label={t.requiredQtmCapital} value={`${format(plan.requiredQtm)} QTM`} /><Metric label={t.estimatedFees} value={`${format(plan.feesUsd)} USDT`} /><Metric label={t.estimatedTax} value={`${format(plan.taxesUsd)} USDT`} /><Metric label={t.executionCost} value={`${format(plan.executionCostUsd)} USDT`} /><Metric label={t.endDrift} value={percent(plan.endDriftPct)} /><Metric label={t.safeBuy} value={`${format(safeBuy)} USDT`} /></div>
        </div> : <div className="panel validation-panel"><b>{t.invalid}</b><span>{t.fixInputs}</span></div>}
      </div>
      <div className="mm-lower">
        <div className="panel instant-panel">
          <div className="panel-title-row"><div><span className="overline no-rule">{t.instant}</span><h3>{t.instantTitle}</h3></div></div>
          <div className="trade-choice-list">
            <div className={`trade-choice buy-choice ${buyEnabled ? 'enabled' : ''}`}><div className="trade-choice-head"><div><b>{t.buy}</b><small>USDT → QTM</small></div><button className={`trade-toggle ${buyEnabled ? 'active' : ''}`} type="button" aria-pressed={buyEnabled} onClick={() => setBuyEnabled((value) => !value)}><i />{buyEnabled ? t.included : t.excluded}</button></div><Field label={t.buyInput} value={buyAmount} onChange={setBuyAmount} suffix="USDT" step={100} error={buyEnabled && !buyAmountValid ? t.nonnegativeError : undefined} /><div className="trade-flow"><span>{format(buyAmountValid ? Number(buyAmount) : 0)} USDT</span><i>→</i><strong>{makerValid && selectedTrades.buy ? `${format(selectedTrades.buy.output)} QTM` : '—'}</strong></div>{makerValid && selectedTrades.buy && <div className="trade-meta"><span>{t.priceAfterTrade}: {money(selectedTrades.buy.priceAfter, 6)}</span><span>{t.priceImpact}: {percent(selectedTrades.buy.impactPct)}</span></div>}</div>
            <div className={`trade-choice sell-choice ${sellEnabled ? 'enabled' : ''}`}><div className="trade-choice-head"><div><b>{t.sell}</b><small>QTM → USDT</small></div><button className={`trade-toggle ${sellEnabled ? 'active' : ''}`} type="button" aria-pressed={sellEnabled} onClick={() => setSellEnabled((value) => !value)}><i />{sellEnabled ? t.included : t.excluded}</button></div><Field label={t.sellInput} value={sellAmount} onChange={setSellAmount} suffix="QTM" step={1000} error={sellEnabled && !sellAmountValid ? t.nonnegativeError : undefined} /><div className="trade-flow"><span>{format(sellAmountValid ? Number(sellAmount) : 0)} QTM</span><i>→</i><strong>{makerValid && selectedTrades.sell ? `${format(selectedTrades.sell.output)} USDT` : '—'}</strong></div>{makerValid && selectedTrades.sell && <div className="trade-meta"><span>{t.priceAfterTrade}: {money(selectedTrades.sell.priceAfter, 6)}</span><span>{t.priceImpact}: {percent(selectedTrades.sell.impactPct)}</span></div>}</div>
          </div>
          <p className="execution-order">{t.executionOrder}</p>
        </div>
        <div className="chart-panel panel simple-chart-panel"><div className="panel-title-row chart-title"><div><span className="overline no-rule">x × y = k</span><h3>{t.chartTitle}</h3><p>{t.chartDescription}</p></div></div>{makerValid ? <div className="chart-wrap simple-chart-wrap"><PriceChart values={plan.pricePath} labels={[t.start, t.afterInstant, t.afterDaily]} changeLabel={t.chartChange} priceAxis={t.chartPriceAxis} orderAxis={t.chartOrderAxis} orderLabel={t.chartOrder} /></div> : <div className="validation-panel chart-validation"><b>{t.invalid}</b><span>{t.fixInputs}</span></div>}</div>
      </div>
    </section>}

    {page === 'live' && <section className="stage active-stage"><div className="section-heading"><div className="stage-number">03</div><div><span className="kicker">{t.liveKicker}</span><h2>{t.liveTitle}</h2><p>{t.liveDescription}</p></div></div><div className="panel live-toolbar"><div className="live-source"><span className={liveState === 'live' ? 'live-dot' : 'snapshot-dot'}>{liveState === 'live' ? t.liveData : t.snapshot}</span><b>{t.source}: {marketData.source}</b><small>{t.updated}: {new Date(marketData.updatedAt).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</small></div><button className="reset-button" onClick={refresh} disabled={liveState === 'loading'}>{liveState === 'loading' ? t.refreshing : t.refresh}</button></div><div className="live-price panel"><div><span>QUANTUM</span><h3>QTM / USDT</h3><code>{TOKEN_ADDRESS}</code></div><div><span>{t.price}</span><strong>{money(marketData.price, 8)}</strong><small>{percent(marketData.change24)}</small></div></div><div className="metrics-grid live-metrics"><Metric label={t.liquidity} value={money(marketData.liquidity)} accent /><Metric label={t.volume24} value={money(marketData.volume24)} /><Metric label={t.change1} value={percent(marketData.change1)} /><Metric label={t.change24} value={percent(marketData.change24)} /><Metric label={t.fdv} value={money(marketData.fdv, 0)} /><Metric label={t.transactions} value={marketData.transactions === null ? '—' : format(marketData.transactions, 0)} /><Metric label={t.buys} value={marketData.buys === null ? '—' : format(marketData.buys, 0)} /><Metric label={t.sells} value={marketData.sells === null ? '—' : format(marketData.sells, 0)} /><Metric label={t.holders} value={marketData.holders === null ? '—' : format(marketData.holders, 0)} /></div><div className="live-grid"><div className="panel live-pool-card"><div className="panel-title-row"><div><span className="overline no-rule">{t.poolDetails}</span><h3>QTM / USDT</h3></div><span className="network-chip">BSC · V2</span></div><div className="pair-row"><div className="token-mark qtm">Q</div><div><span>{t.qtmReserve}</span><strong>{format(marketData.qtmReserve)}</strong></div></div><div className="pair-divider"><span>+</span></div><div className="pair-row"><div className="token-mark usdt">₮</div><div><span>{t.usdtReserve}</span><strong>{format(marketData.usdtReserve)}</strong></div></div></div><div className="panel details-panel"><div className="detail-row"><span>{t.network}</span><b>BNB Smart Chain</b></div><div className="detail-row"><span>{t.dex}</span><b>PancakeSwap v2</b></div><div className="detail-row"><span>{t.created}</span><b>{marketData.created ? new Date(marketData.created).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US') : '—'}</b></div><div className="detail-row"><span>{t.poolAddress}</span><code>{POOL_ADDRESS}</code></div><div className="detail-row"><span>{t.tokenAddress}</span><code>{TOKEN_ADDRESS}</code></div><a className="cmc-button" href={CMC_URL} target="_blank" rel="noreferrer">{t.openCmc} ↗</a></div></div></section>}
    <footer><span>QTM Liquidity Lab</span><span>PancakeSwap V2 constant-product AMM</span></footer>
  </div></main>
}
