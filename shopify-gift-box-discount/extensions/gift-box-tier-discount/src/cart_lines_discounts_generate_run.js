import { DiscountClass, ProductDiscountSelectionStrategy } from "../generated/api";
import {
  centsToMoneyString,
  getGiftBoxLineDiscountCents,
  isGiftBoxLine,
} from "./gift-box-tier-pricing.js";

/**
 * @param {import("../generated/api").CartInput} input
 */
export function cartLinesDiscountsGenerateRun(input) {
  const lines = input.cart?.lines ?? [];
  if (!lines.length) {
    return { operations: [] };
  }

  const hasProductDiscount = input.discount?.discountClasses?.includes(DiscountClass.Product);
  if (!hasProductDiscount) {
    return { operations: [] };
  }

  /** @type {import("../generated/api").CartLinesDiscountsGenerateRunResult["operations"]} */
  const operations = [];

  for (const line of lines) {
    if (!isGiftBoxLine(line)) continue;

    const discountCents = getGiftBoxLineDiscountCents(line);
    if (discountCents <= 0) continue;

    operations.push({
      productDiscountsAdd: {
        candidates: [
          {
            message: "Gift box bundle pricing",
            targets: [
              {
                cartLine: {
                  id: line.id,
                },
              },
            ],
            value: {
              fixedAmount: {
                amount: centsToMoneyString(discountCents),
                appliesToEachItem: false,
              },
            },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    });
  }

  return { operations };
}
