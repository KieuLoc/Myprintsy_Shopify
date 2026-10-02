import { describe, expect, it } from "vitest";
import {
  getGiftBoxLineDiscountCents,
  getTierPriceCents,
  moneyToCents,
} from "./gift-box-tier-pricing.js";
import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run.js";

describe("gift-box-tier-pricing", () => {
  it("matches theme tier table", () => {
    expect(getTierPriceCents(1)).toBe(499);
    expect(getTierPriceCents(2)).toBe(899);
    expect(getTierPriceCents(3)).toBe(1199);
    expect(getTierPriceCents(4)).toBe(1499);
    expect(getTierPriceCents(5)).toBe(1799);
    expect(getTierPriceCents(6)).toBe(1799);
  });

  it("discounts 4 boxes from variant subtotal to tier total", () => {
    const line = {
      quantity: 4,
      attribute: { value: "true" },
      cost: { subtotalAmount: { amount: "19.96" } },
      merchandise: { product: { title: "Add-On Gift Box Service" } },
    };

    expect(getGiftBoxLineDiscountCents(line)).toBe(moneyToCents("19.96") - 1499);
  });
});

describe("cartLinesDiscountsGenerateRun", () => {
  it("returns product discount for gift box lines only", () => {
    const result = cartLinesDiscountsGenerateRun({
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 4,
            attribute: { value: "true" },
            cost: { subtotalAmount: { amount: "19.96" } },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/1",
              product: { title: "Add-On Gift Box Service" },
            },
          },
          {
            id: "gid://shopify/CartLine/1",
            quantity: 3,
            attribute: null,
            cost: { subtotalAmount: { amount: "76.95" } },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/2",
              product: { title: "Personalized Bottles" },
            },
          },
        ],
      },
      discount: {
        discountClasses: ["PRODUCT"],
      },
    });

    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].productDiscountsAdd.candidates[0].targets[0].cartLine.id).toBe(
      "gid://shopify/CartLine/0",
    );
    expect(result.operations[0].productDiscountsAdd.candidates[0].value.fixedAmount.amount).toBe("4.97");
  });

  it("skips when product discount class is not enabled", () => {
    const result = cartLinesDiscountsGenerateRun({
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            quantity: 4,
            attribute: { value: "true" },
            cost: { subtotalAmount: { amount: "19.96" } },
            merchandise: {
              __typename: "ProductVariant",
              id: "gid://shopify/ProductVariant/1",
              product: { title: "Add-On Gift Box Service" },
            },
          },
        ],
      },
      discount: {
        discountClasses: ["ORDER"],
      },
    });

    expect(result.operations).toEqual([]);
  });
});
