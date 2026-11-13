export type Side = 'buy' | 'sell'

export type PoolState = {
  tokenReserve: number
  quoteReserve: number
}

export type TradeResult = {
  state: PoolState
  side: Side
  input: number
  output: number
  grossOutput: number
  feeValueUsd: number
  taxValueUsd: number
  priceBefore: number
  priceAfter: number
  impactPct: number
}

export type TradeSequenceResult = {
  state: PoolState
  buy: TradeResult | null
  sell: TradeResult | null
  priceBefore: number
  priceAfter: number
  impactPct: number
}

const positive = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive`)
  return value
}

const rate = (value: number, label: string) => {
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error(`${label} must be between 0 and 1`)
  return value
}

export const poolPrice = (state: PoolState) => positive(state.quoteReserve, 'Quote reserve') / positive(state.tokenReserve, 'Token reserve')

export function createPool(quoteReserve: number, price: number): PoolState {
  return { quoteReserve: positive(quoteReserve, 'Quote reserve'), tokenReserve: quoteReserve / positive(price, 'Price') }
}

export function executeTrade(state: PoolState, side: Side, input: number, feeRate: number, tokenTaxRate: number): TradeResult {
  const x = positive(state.tokenReserve, 'Token reserve')
  const y = positive(state.quoteReserve, 'Quote reserve')
  positive(input, 'Trade input')
  rate(feeRate, 'Fee')
  rate(tokenTaxRate, 'Tax')
  const priceBefore = y / x

  if (side === 'buy') {
    const effectiveQuote = input * (1 - feeRate)
    const grossOutput = x * effectiveQuote / (y + effectiveQuote)
    const output = grossOutput * (1 - tokenTaxRate)
    const next = { tokenReserve: x - grossOutput, quoteReserve: y + input }
    const priceAfter = poolPrice(next)
    return { state: next, side, input, output, grossOutput, feeValueUsd: input * feeRate, taxValueUsd: (grossOutput - output) * priceBefore, priceBefore, priceAfter, impactPct: (priceAfter / priceBefore - 1) * 100 }
  }

  const poolTokenInput = input * (1 - tokenTaxRate)
  const effectiveToken = poolTokenInput * (1 - feeRate)
  const output = y * effectiveToken / (x + effectiveToken)
  const next = { tokenReserve: x + poolTokenInput, quoteReserve: y - output }
  const priceAfter = poolPrice(next)
  return { state: next, side, input, output, grossOutput: output, feeValueUsd: poolTokenInput * feeRate * priceBefore, taxValueUsd: (input - poolTokenInput) * priceBefore, priceBefore, priceAfter, impactPct: (priceAfter / priceBefore - 1) * 100 }
}

export function executeSelectedTrades(state: PoolState, buyInput: number | null, sellInput: number | null, feeRate: number, tokenTaxRate: number): TradeSequenceResult {
  const priceBefore = poolPrice(state)
  let next = { ...state }
  const buy = buyInput === null ? null : executeTrade(next, 'buy', buyInput, feeRate, tokenTaxRate)
  if (buy) next = buy.state
  const sell = sellInput === null ? null : executeTrade(next, 'sell', sellInput, feeRate, tokenTaxRate)
  if (sell) next = sell.state
  const priceAfter = poolPrice(next)

  return { state: next, buy, sell, priceBefore, priceAfter, impactPct: (priceAfter / priceBefore - 1) * 100 }
}

export type DailyPlan = {
  orders: number
  orderSizeUsd: number
  buyVolumeUsd: number
  sellVolumeUsd: number
  requiredUsdt: number
  requiredQtm: number
  feesUsd: number
  taxesUsd: number
  executionCostUsd: number
  maxImpactPct: number
  endDriftPct: number
  pricePath: number[]
  finalState: PoolState
}

export type DailyPlanSides = { buy: boolean; sell: boolean }

export function simulateDailyPlan(initial: PoolState, requestedOrders: number, buyInputUsd: number, sellInputQtm: number, feeRate: number, tokenTaxRate: number, sides: DailyPlanSides = { buy: true, sell: true }): DailyPlan {
  const hasBothSides = sides.buy && sides.sell
  const hasSelectedSide = sides.buy || sides.sell
  const orders = hasSelectedSide ? Math.max(1, Math.round(requestedOrders)) : 0
  if (sides.buy) positive(buyInputUsd, 'Buy input')
  if (sides.sell) positive(sellInputQtm, 'Sell input')
  let state = { ...initial }
  let cash = 0
  let tokens = 0
  let minCash = 0
  let minTokens = 0
  let feesUsd = 0
  let taxesUsd = 0
  let maxImpactPct = 0
  let buyVolumeUsd = 0
  let sellVolumeUsd = 0
  const pricePath = [poolPrice(state)]

  for (let index = 0; index < orders; index += 1) {
    const side: Side = hasBothSides ? (index % 2 === 0 ? 'buy' : 'sell') : (sides.buy ? 'buy' : 'sell')
    const input = side === 'buy' ? buyInputUsd : sellInputQtm
    const trade = executeTrade(state, side, input, feeRate, tokenTaxRate)
    state = trade.state
    feesUsd += trade.feeValueUsd
    taxesUsd += trade.taxValueUsd
    maxImpactPct = Math.max(maxImpactPct, Math.abs(trade.impactPct))
    if (side === 'buy') { cash -= input; tokens += trade.output; buyVolumeUsd += input } else { tokens -= input; cash += trade.output; sellVolumeUsd += trade.output }
    minCash = Math.min(minCash, cash)
    minTokens = Math.min(minTokens, tokens)
    pricePath.push(trade.priceAfter)
  }

  const finalPrice = poolPrice(state)
  const markedBalance = cash + tokens * finalPrice
  const totalVolumeUsd = buyVolumeUsd + sellVolumeUsd
  return {
    orders,
    orderSizeUsd: orders > 0 ? totalVolumeUsd / orders : 0,
    buyVolumeUsd,
    sellVolumeUsd,
    requiredUsdt: Math.max(0, -minCash),
    requiredQtm: Math.max(0, -minTokens),
    feesUsd,
    taxesUsd,
    executionCostUsd: Math.max(0, -markedBalance),
    maxImpactPct,
    endDriftPct: (finalPrice / pricePath[0] - 1) * 100,
    pricePath,
    finalState: state,
  }
}

export function maxBuyForImpact(quoteReserve: number, impactPct: number, feeRate: number) {
  positive(quoteReserve, 'Quote reserve')
  positive(impactPct, 'Impact')
  rate(feeRate, 'Fee')
  const a = 1 - feeRate
  const d = impactPct / 100
  return quoteReserve * (-(1 + a) + Math.sqrt((1 + a) ** 2 + 4 * a * d)) / (2 * a)
}
