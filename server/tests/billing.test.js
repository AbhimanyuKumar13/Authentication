import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotals } from "../controllers/billingController.js";

test("calculateTotals splits intra-state GST into CGST and SGST", () => {
  const items = [
    { description: "Website Design", quantity: 1, rate: 1000, amount: 1000 },
    { description: "Hosting", quantity: 2, rate: 500, amount: 1000 },
  ];

  const totals = calculateTotals(items);

  assert.equal(totals.subtotal, 2000);
  assert.equal(totals.tax, 360);
  assert.equal(totals.total, 2360);
  assert.equal(totals.cgst, 180);
  assert.equal(totals.sgst, 180);
  assert.equal(totals.igst, 0);
});

test("calculateTotals applies full GST as IGST for interstate bills", () => {
  const totals = calculateTotals(
    [{ description: "Service", quantity: 1, rate: 2000, amount: 2000 }],
    true,
  );

  assert.equal(totals.tax, 360);
  assert.equal(totals.total, 2360);
  assert.equal(totals.cgst, 0);
  assert.equal(totals.sgst, 0);
  assert.equal(totals.igst, 360);
});
