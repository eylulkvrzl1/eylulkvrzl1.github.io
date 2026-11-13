import { describe, expect, it } from 'vitest'
import { createPool, executeSelectedTrades, executeTrade, MAX_DAILY_ORDERS, maxBuyForImpact, poolPrice, simulateDailyPlan } from './amm'

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

  it('accepts a genuine zero-percent AMM fee', () => {
    const state = createPool(10_000, .01)
    const result = executeTrade(state, 'buy', 1_000, 0, 0)

    expect(result.feeValueUsd).toBe(0)
    expect(result.grossOutput).toBeCloseTo(1_000_000 * 1_000 / 11_000, 10)
  })

  it('applies sell tax before tokens reach the pool', () => {
    const result = executeTrade(createPool(10_000, .01), 'sell', 100_000, fee, .03)
    expect(result.state.tokenReserve).toBe(1_097_000)
    expect(result.output).toBeLessThan(1_000)
  })

  it('executes the exact selected number of fixed-size buy orders', () => {
    const state = createPool(100_000, .01)
    const plan = simulateDailyPlan(state, 100, 1_000, 100_000, fee, 0, { buy: true, sell: false })
    let expected = state
    for (let index = 0; index < 100; index += 1) expected = executeTrade(expected, 'buy', 1_000, fee, 0).state

    expect(plan.orders).toBe(100)
    expect(plan.orderSizeUsd).toBe(1_000)
    expect(plan.buyVolumeUsd).toBe(100_000)
    expect(plan.sellVolumeUsd).toBe(0)
    expect(plan.feesUsd).toBeCloseTo(250, 8)
    expect(plan.pricePath).toHaveLength(101)
    expect(plan.finalState).toEqual(expected)
  })

  it('treats zero requested orders as a real zero-order plan', () => {
    const state = createPool(100_000, .01)
    const plan = simulateDailyPlan(state, 0, 1_000, 100_000, fee, 0, { buy: true, sell: false })

    expect(plan.orders).toBe(0)
    expect(plan.buyVolumeUsd).toBe(0)
    expect(plan.sellVolumeUsd).toBe(0)
    expect(plan.feesUsd).toBe(0)
    expect(plan.pricePath).toEqual([poolPrice(state)])
    expect(plan.finalState).toEqual(state)
  })

  it('rejects daily order counts above the browser-safe limit', () => {
    const state = createPool(100_000, .01)

    expect(() => simulateDailyPlan(state, MAX_DAILY_ORDERS + 1, 1_000, 100_000, fee, 0, { buy: true, sell: false })).toThrow(/Orders cannot exceed/)
  })

  it('keeps the plan idle when zero-size directions are excluded', () => {
    const state = createPool(100_000, .01)
    const plan = simulateDailyPlan(state, 100, 0, 0, fee, 0, { buy: false, sell: false })

    expect(plan.orders).toBe(0)
    expect(plan.pricePath).toHaveLength(1)
    expect(plan.finalState).toEqual(state)
  })

  it('alternates fixed buy and sell inputs without changing the requested order count', () => {
    const state = createPool(100_000, .01)
    const plan = simulateDailyPlan(state, 5, 1_000, 50_000, fee, 0, { buy: true, sell: true })
    let expected = state
    for (const side of ['buy', 'sell', 'buy', 'sell', 'buy'] as const) expected = executeTrade(expected, side, side === 'buy' ? 1_000 : 50_000, fee, 0).state

    expect(plan.orders).toBe(5)
    expect(plan.buyVolumeUsd).toBe(3_000)
    expect(plan.pricePath).toHaveLength(6)
    expect(plan.finalState).toEqual(expected)
  })

  it('excludes every daily sell when the sell direction is disabled', () => {
    const state = createPool(10_000, .01)
    const plan = simulateDailyPlan(state, 25, 1_000, 100_000, fee, 0, { buy: true, sell: false })

    expect(plan.orders).toBe(25)
    expect(plan.buyVolumeUsd).toBe(25_000)
    expect(plan.sellVolumeUsd).toBe(0)
    expect(plan.requiredQtm).toBe(0)
    expect(plan.pricePath.at(-1)).toBeGreaterThan(poolPrice(state))
  })

  it('excludes every daily buy when only the sell direction is enabled', () => {
    const state = createPool(10_000, .01)
    const plan = simulateDailyPlan(state, 10, 1_000, 5_000, fee, 0, { buy: false, sell: true })

    expect(plan.buyVolumeUsd).toBe(0)
    expect(plan.orders).toBe(10)
    expect(plan.requiredUsdt).toBe(0)
    expect(plan.pricePath.at(-1)).toBeLessThan(poolPrice(state))
  })

  it('starts the daily plan from the pool produced by the instant trade', () => {
    const initial = { tokenReserve: 1_000_000, quoteReserve: 10_000 }
    const instant = executeTrade(initial, 'buy', 1_000, fee, 0)
    const plan = simulateDailyPlan(instant.state, 20, 1_000, 25_000, fee, 0)

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

  it('returns a zero safe-buy amount for a zero movement limit', () => {
    expect(maxBuyForImpact(10_000, 0, fee)).toBe(0)
  })

  it('rejects a 100-percent fee instead of producing an invalid result', () => {
    expect(() => executeTrade(createPool(10_000, .01), 'buy', 1_000, 1, 0)).toThrow(/Fee/)
  })
})
