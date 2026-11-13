import { describe, expect, it } from 'vitest'
import { createPool, executeSelectedTrades, executeTrade, maxBuyForImpact, poolPrice, simulateDailyPlan } from './amm'

describe('QTM V2 market-maker calculations', () => {
  const fee = .0025

  it('creates balanced reserves at the selected price', () => {
    expect(createPool(10_000, .01)).toEqual({ quoteReserve: 10_000, tokenReserve: 1_000_000 })
  })

  it('uses the 0.25% AMM fee and separates token tax', () => {
    const result = executeTrade(createPool(10_000, .01), 'buy', 1_000, fee, .03)
    expect(result.feeValueUsd).toBeCloseTo(2.5, 10)
    expect(result.output).toBeCloseTo(result.grossOutput * .97, 10)
    expect(result.state.quoteReserve).toBe(11_000)
  })

  it('applies sell tax before tokens reach the pool', () => {
    const result = executeTrade(createPool(10_000, .01), 'sell', 100_000, fee, .03)
    expect(result.state.tokenReserve).toBe(1_097_000)
    expect(result.output).toBeLessThan(1_000)
  })

  it('creates an exact 50/50 two-sided daily notional plan', () => {
    const plan = simulateDailyPlan(createPool(10_000, .01), 100_000, 100, fee, 0)
    expect(plan.orders).toBe(100)
    expect(plan.buyVolumeUsd + plan.sellVolumeUsd).toBe(100_000)
    expect(plan.orderSizeUsd).toBe(1_000)
    expect(plan.pricePath).toHaveLength(101)
    expect(plan.requiredUsdt).toBeGreaterThan(0)
  })

  it('starts the daily plan from the pool produced by the instant trade', () => {
    const initial = { tokenReserve: 1_000_000, quoteReserve: 10_000 }
    const instant = executeTrade(initial, 'buy', 1_000, fee, 0)
    const plan = simulateDailyPlan(instant.state, 20_000, 20, fee, 0)

    expect(plan.pricePath[0]).toBeCloseTo(instant.priceAfter, 12)
    expect(plan.pricePath[0]).not.toBeCloseTo(poolPrice(initial), 6)
  })

  it('can include a buy while leaving the sell completely disabled', () => {
    const initial = createPool(10_000, .01)
    const selected = executeSelectedTrades(initial, 1_000, null, fee, 0)
    const buyOnly = executeTrade(initial, 'buy', 1_000, fee, 0)

    expect(selected.buy).not.toBeNull()
    expect(selected.sell).toBeNull()
    expect(selected.state).toEqual(buyOnly.state)
    expect(selected.priceAfter).toBe(buyOnly.priceAfter)
  })

  it('applies independently selected buy and sell amounts in a clear order', () => {
    const initial = createPool(10_000, .01)
    const selected = executeSelectedTrades(initial, 1_000, 25_000, fee, 0)
    const buy = executeTrade(initial, 'buy', 1_000, fee, 0)
    const sell = executeTrade(buy.state, 'sell', 25_000, fee, 0)

    expect(selected.buy?.input).toBe(1_000)
    expect(selected.sell?.input).toBe(25_000)
    expect(selected.state).toEqual(sell.state)
  })

  it('solves the maximum buy for a requested movement limit', () => {
    const state = createPool(10_000, .01)
    const trade = executeTrade(state, 'buy', maxBuyForImpact(10_000, 2, fee), fee, 0)
    expect(trade.impactPct).toBeCloseTo(2, 8)
    expect(poolPrice(trade.state)).toBeGreaterThan(poolPrice(state))
  })
})
