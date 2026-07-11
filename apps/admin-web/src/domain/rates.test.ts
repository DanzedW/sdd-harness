import { describe, expect, it } from "vitest";
import { contracts, shops } from "../mocks/data-merchant-lifecycle";
import { merchants, products } from "../mocks/data";

function expectBasisPoints(values: Array<number | undefined>) {
  for (const value of values) {
    expect(typeof value).toBe("number");
    expect(Number.isInteger(value)).toBe(true);
    expect(value as number).toBeGreaterThanOrEqual(0);
    expect(value as number).toBeLessThanOrEqual(10_000);
  }
}

describe("all Mock proportion fields use integer basis points", () => {
  it("stores product point deduction rates in basis points", () => {
    expect(products[0].coinDiscountRateBps).toBe(1_000);
    expectBasisPoints(products.map((item) => item.coinDiscountRateBps));
  });

  it("stores merchant, contract and shop rates in basis points", () => {
    expectBasisPoints(merchants.map((item) => item.settlementRateBps));
    expectBasisPoints(contracts.flatMap((item) => [item.feeRateBps, item.settlementRateBps]));
    expectBasisPoints(
      shops.flatMap((item) => [
        item.platformRateBps,
        item.coinDiscountRateBps,
        item.cashbackRateBps,
      ]),
    );
  });
});
