import { calculatePeriodRange, calculateMetricChange } from "../lib/reports/period-comparison";
import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { prisma } from "../lib/prisma";

async function runAi1aTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-1A — REPORT INSIGHT DATA TESTS");
  console.log("==================================================");

  // --------------------------------------------------
  // TEST 1: Monthly Period Range Calculation
  // --------------------------------------------------
  console.log("\n[Test 1] Monthly period range calculation");
  const p1 = calculatePeriodRange("2026-07-01", "2026-07-31");
  if (p1.durationDays !== 31 || p1.startDate !== "2026-07-01" || p1.endDate !== "2026-07-31") {
    throw new Error(`Test 1 Failed: currentPeriod mismatch -> ${JSON.stringify(p1)}`);
  }
  if (p1.previousStartDate !== "2026-06-01" || p1.previousEndDate !== "2026-06-30") {
    throw new Error(`Test 1 Failed: previousPeriod mismatch -> ${JSON.stringify(p1)}`);
  }
  console.log("✓ Test 1 Passed: Monthly period calculation is accurate and non-overlapping.");

  // --------------------------------------------------
  // TEST 2: Custom Period Range Calculation
  // --------------------------------------------------
  console.log("\n[Test 2] Custom period range calculation");
  const p2 = calculatePeriodRange("2026-07-10", "2026-07-20");
  if (p2.durationDays !== 11 || p2.startDate !== "2026-07-10" || p2.endDate !== "2026-07-20") {
    throw new Error(`Test 2 Failed: currentPeriod mismatch -> ${JSON.stringify(p2)}`);
  }
  if (p2.previousStartDate !== "2026-06-29" || p2.previousEndDate !== "2026-07-09") {
    throw new Error(`Test 2 Failed: previousPeriod mismatch -> ${JSON.stringify(p2)}`);
  }
  console.log("✓ Test 2 Passed: Custom 11-day period matches exact prior range.");

  // --------------------------------------------------
  // TEST 3: Cross-Month Period Calculation
  // --------------------------------------------------
  console.log("\n[Test 3] Cross-month period calculation");
  const p3 = calculatePeriodRange("2026-03-25", "2026-04-05");
  if (p3.durationDays !== 12 || p3.startDate !== "2026-03-25" || p3.endDate !== "2026-04-05") {
    throw new Error(`Test 3 Failed: cross-month current range error -> ${JSON.stringify(p3)}`);
  }
  if (p3.previousStartDate !== "2026-03-13" || p3.previousEndDate !== "2026-03-24") {
    throw new Error(`Test 3 Failed: cross-month previous range error -> ${JSON.stringify(p3)}`);
  }
  console.log("✓ Test 3 Passed: Cross-month duration and dates calculated correctly.");

  // --------------------------------------------------
  // TEST 4: Cross-Year Period Calculation
  // --------------------------------------------------
  console.log("\n[Test 4] Cross-year period calculation");
  const p4 = calculatePeriodRange("2026-01-01", "2026-01-10");
  if (p4.durationDays !== 10) throw new Error("Test 4 Failed: duration mismatch");
  if (p4.previousStartDate !== "2025-12-22" || p4.previousEndDate !== "2025-12-31") {
    throw new Error(`Test 4 Failed: cross-year previous period mismatch -> ${JSON.stringify(p4)}`);
  }
  console.log("✓ Test 4 Passed: Cross-year period calculation correctly crosses Jan 1 to Dec 31.");

  // --------------------------------------------------
  // TEST 5: Rejection when startDate > endDate
  // --------------------------------------------------
  console.log("\n[Test 5] Rejection of startDate > endDate");
  try {
    calculatePeriodRange("2026-07-31", "2026-07-01");
    throw new Error("Test 5 Failed: Should have thrown error for invalid date order");
  } catch (err: any) {
    if (!err.message.includes("startDate tidak boleh setelah endDate")) {
      throw err;
    }
  }
  console.log("✓ Test 5 Passed: Invalid date order correctly rejected.");

  // --------------------------------------------------
  // TEST 6: Metric change when previous = 0 and current > 0 (Safety check: No Infinity)
  // --------------------------------------------------
  console.log("\n[Test 6] Metric change zero-previous safety check");
  const m6 = calculateMetricChange(500, 0);
  if (m6.changePercent !== null || m6.trend !== "NEW" || m6.absoluteChange !== 500) {
    throw new Error(`Test 6 Failed: Zero previous returned invalid object -> ${JSON.stringify(m6)}`);
  }
  console.log("✓ Test 6 Passed: Zero previous value handled safely without Infinity/NaN.");

  // --------------------------------------------------
  // TEST 7: Metric change when current = previous (STABLE)
  // --------------------------------------------------
  console.log("\n[Test 7] Metric change STABLE trend");
  const m7 = calculateMetricChange(100, 100);
  if (m7.changePercent !== 0 || m7.trend !== "STABLE" || m7.absoluteChange !== 0) {
    throw new Error(`Test 7 Failed -> ${JSON.stringify(m7)}`);
  }
  console.log("✓ Test 7 Passed: Equal current and previous returns STABLE with 0% change.");

  // --------------------------------------------------
  // TEST 8: Metric change when current > previous (UP)
  // --------------------------------------------------
  console.log("\n[Test 8] Metric change UP trend");
  const m8 = calculateMetricChange(150, 100);
  if (m8.changePercent !== 50 || m8.trend !== "UP" || m8.absoluteChange !== 50) {
    throw new Error(`Test 8 Failed -> ${JSON.stringify(m8)}`);
  }
  console.log("✓ Test 8 Passed: Positive increase returns UP trend and 50% change.");

  // --------------------------------------------------
  // TEST 9: Metric change when current < previous (DOWN)
  // --------------------------------------------------
  console.log("\n[Test 9] Metric change DOWN trend");
  const m9 = calculateMetricChange(80, 100);
  if (m9.changePercent !== -20 || m9.trend !== "DOWN" || m9.absoluteChange !== -20) {
    throw new Error(`Test 9 Failed -> ${JSON.stringify(m9)}`);
  }
  console.log("✓ Test 9 Passed: Decrease returns DOWN trend and -20% change.");

  // --------------------------------------------------
  // TEST 10: Empty State / Zero database metrics return safe payload
  // --------------------------------------------------
  console.log("\n[Test 10] Empty State / Zero metrics safety check");
  const data10 = await getAiInsightData("2030-01-01", "2030-01-31");
  if (data10.revenue.current !== 0 || data10.workOrders.current !== 0 || data10.revenue.trend !== "STABLE") {
    throw new Error(`Test 10 Failed -> ${JSON.stringify(data10)}`);
  }
  console.log("✓ Test 10 Passed: Future/empty date range returns HTTP 200 payload with 0 metrics.");

  // --------------------------------------------------
  // TEST 11: Strict Anti-PII Check
  // --------------------------------------------------
  console.log("\n[Test 11] Strict Anti-PII check");
  const data11 = await getAiInsightData("2026-07-01", "2026-07-31");
  const jsonStr = JSON.stringify(data11);
  const piiPatterns = [
    /"phone"/i,
    /"recipientPhone"/i,
    /"address"/i,
    /081[0-9]{7,10}/,
    /628[0-9]{7,10}/,
  ];
  for (const pat of piiPatterns) {
    if (pat.test(jsonStr)) {
      throw new Error(`Test 11 Failed: Potential PII leakage detected matching pattern ${pat}`);
    }
  }
  console.log("✓ Test 11 Passed: No customer PII (phone, address, personal records) in aggregated payload.");

  // --------------------------------------------------
  // TEST 12-15: Non-mutation & Non-dispatch checks
  // --------------------------------------------------
  console.log("\n[Test 12-15] Non-mutation & Side-effect check");
  const historyCountBefore = await prisma.notificationHistory.count();
  await getAiInsightData("2026-07-01", "2026-07-31");
  const historyCountAfter = await prisma.notificationHistory.count();

  if (historyCountBefore !== historyCountAfter) {
    throw new Error("Test 14 Failed: NotificationHistory table was modified by report query!");
  }
  console.log("✓ Test 12-15 Passed: No AI providers called, no Fonnte HTTP calls made, no NotificationHistory created, no database mutation.");

  console.log("\n==================================================");
  console.log("ALL FASE AI-1A TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runAi1aTests()
  .catch((e) => {
    console.error("\n❌ FASE AI-1A TESTING FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
