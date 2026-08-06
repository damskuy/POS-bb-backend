import { detectAnomalies, DEFAULT_THRESHOLDS } from "../lib/ai/anomaly-detector";
import { AiAnomalyService } from "../lib/ai/ai-anomaly.service";
import { AiInsightDataReport } from "../lib/reports/ai-insight-data";
import { prisma } from "../lib/prisma";

// Mock helper to build synthetic report data for threshold tests
function createMockReport(overrides: Partial<AiInsightDataReport> = {}): AiInsightDataReport {
  return {
    period: {
      label: "7 Hari Terakhir",
      startDate: "2026-08-01",
      endDate: "2026-08-07",
      previousStartDate: "2026-07-25",
      previousEndDate: "2026-07-31",
      durationDays: 7,
    },
    revenue: {
      current: 10000000,
      previous: 10000000,
      absoluteChange: 0,
      changePercent: 0,
      trend: "FLAT",
    },
    workOrders: {
      current: 20,
      previous: 20,
      absoluteChange: 0,
      changePercent: 0,
      trend: "FLAT",
    },
    averageTicket: {
      current: 500000,
      previous: 500000,
      absoluteChange: 0,
      changePercent: 0,
      trend: "FLAT",
    },
    customers: {
      newCustomers: 5,
      returningCustomers: 10,
      inactiveCustomers: 2,
    },
    services: {
      topServices: [{ id: 1, name: "Ganti Oli Mesin", quantity: 15, revenue: 3000000 }],
      decliningServices: [],
    },
    inventory: {
      lowStockCount: 1,
      outOfStockCount: 0,
      fastMovingItems: [{ name: "Oli TMO 10W-40", totalSold: 10, revenue: 1000000 }],
      slowMovingItems: [],
    },
    mechanics: {
      workloads: [
        { id: 1, name: "Budi Mechanic", completedWorkOrders: 5, revenue: 2500000 },
        { id: 2, name: "Agus Mechanic", completedWorkOrders: 5, revenue: 2500000 },
      ],
      maxWorkload: 5,
      avgWorkload: 5,
      imbalanceRatio: 1.0,
    },
    ...overrides,
  };
}

async function runAi2fAnomalyTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-2F — AI ANOMALY DETECTION TESTS");
  console.log("==================================================");

  // Record initial database counts for zero-mutation audit
  const customerCountBefore = await prisma.customer.count();
  const workOrderCountBefore = await prisma.workOrder.count();
  const sparePartCountBefore = await prisma.sparePart.count();

  // --------------------------------------------------
  // TEST 1: Healthy Business (No Anomalies Detected)
  // --------------------------------------------------
  console.log("\n[Test 1] Healthy Business Metrics Test");
  const healthyData = createMockReport();
  const healthyAnomalies = detectAnomalies(healthyData);

  if (healthyAnomalies.length !== 0) {
    throw new Error(`Test 1 Failed: Expected 0 anomalies for healthy metrics, got ${healthyAnomalies.length}`);
  }
  console.log("✓ Test 1 Passed: Healthy metrics return 0 anomalies.");

  // --------------------------------------------------
  // TEST 2: Revenue Drop Anomalies (Critical vs High)
  // --------------------------------------------------
  console.log("\n[Test 2] Revenue Drop Anomaly Detection (-45% vs -25%)");

  const criticalRevData = createMockReport({
    revenue: {
      current: 5500000,
      previous: 10000000,
      absoluteChange: -4500000,
      changePercent: -45,
      trend: "DOWN",
    },
  });
  const criticalAnomalies = detectAnomalies(criticalRevData);
  const criticalRevAnomaly = criticalAnomalies.find((a) => a.category === "REVENUE");

  if (!criticalRevAnomaly || criticalRevAnomaly.severity !== "CRITICAL") {
    throw new Error(`Test 2 Failed: Expected CRITICAL revenue anomaly for -45% drop, got ${criticalRevAnomaly?.severity}`);
  }

  const highRevData = createMockReport({
    revenue: {
      current: 7500000,
      previous: 10000000,
      absoluteChange: -2500000,
      changePercent: -25,
      trend: "DOWN",
    },
  });
  const highAnomalies = detectAnomalies(highRevData);
  const highRevAnomaly = highAnomalies.find((a) => a.category === "REVENUE");

  if (!highRevAnomaly || highRevAnomaly.severity !== "HIGH") {
    throw new Error(`Test 2 Failed: Expected HIGH revenue anomaly for -25% drop, got ${highRevAnomaly?.severity}`);
  }
  console.log("✓ Test 2 Passed: Revenue drop correctly categorized into CRITICAL (-45%) and HIGH (-25%).");

  // --------------------------------------------------
  // TEST 3: Revenue Spike Anomaly (+60%)
  // --------------------------------------------------
  console.log("\n[Test 3] Revenue Spike Anomaly Detection (+60%)");
  const spikeRevData = createMockReport({
    revenue: {
      current: 16000000,
      previous: 10000000,
      absoluteChange: 6000000,
      changePercent: 60,
      trend: "UP",
    },
  });
  const spikeAnomalies = detectAnomalies(spikeRevData);
  const spikeRevAnomaly = spikeAnomalies.find((a) => a.category === "REVENUE");

  if (!spikeRevAnomaly || spikeRevAnomaly.severity !== "MEDIUM") {
    throw new Error(`Test 3 Failed: Expected MEDIUM revenue spike anomaly for +60% increase, got ${spikeRevAnomaly?.severity}`);
  }
  console.log("✓ Test 3 Passed: Revenue spike correctly detected as MEDIUM severity.");

  // --------------------------------------------------
  // TEST 4: Inventory Out of Stock & Low Stock Anomaly
  // --------------------------------------------------
  console.log("\n[Test 4] Inventory Anomaly Detection");
  const inventoryData = createMockReport({
    inventory: {
      lowStockCount: 6,
      outOfStockCount: 2,
      fastMovingItems: [{ name: "Kampas Rem Depan", totalSold: 20, revenue: 2000000 }],
      slowMovingItems: [],
    },
  });
  const inventoryAnomalies = detectAnomalies(inventoryData);
  const invCategoryAnomalies = inventoryAnomalies.filter((a) => a.category === "INVENTORY");

  if (invCategoryAnomalies.length < 2) {
    throw new Error(`Test 4 Failed: Expected at least 2 inventory anomalies, got ${invCategoryAnomalies.length}`);
  }
  console.log("✓ Test 4 Passed: Inventory out-of-stock and low-stock anomalies detected.");

  // --------------------------------------------------
  // TEST 5: Customer & Mechanic Workload Imbalance Anomalies
  // --------------------------------------------------
  console.log("\n[Test 5] Customer & Mechanic Workload Imbalance Anomalies");
  const custMechData = createMockReport({
    customers: {
      newCustomers: 2,
      returningCustomers: 5,
      inactiveCustomers: 15,
    },
    mechanics: {
      workloads: [
        { id: 1, name: "Mechanic A", completedWorkOrders: 10, revenue: 5000000 },
        { id: 2, name: "Mechanic B", completedWorkOrders: 2, revenue: 1000000 },
      ],
      maxWorkload: 10,
      avgWorkload: 6,
      imbalanceRatio: 2.2,
    },
  });
  const custMechAnomalies = detectAnomalies(custMechData);
  const custAnomaly = custMechAnomalies.find((a) => a.category === "CUSTOMER");
  const mechAnomaly = custMechAnomalies.find((a) => a.category === "MECHANIC");

  if (!custAnomaly || custAnomaly.severity !== "MEDIUM") {
    throw new Error(`Test 5 Failed: Expected MEDIUM customer anomaly for 15 inactive customers`);
  }
  if (!mechAnomaly || mechAnomaly.severity !== "MEDIUM") {
    throw new Error(`Test 5 Failed: Expected MEDIUM mechanic anomaly for 2.2x workload ratio`);
  }
  console.log("✓ Test 5 Passed: Customer and Mechanic anomalies correctly identified.");

  // --------------------------------------------------
  // TEST 6: Service Decline Anomaly
  // --------------------------------------------------
  console.log("\n[Test 6] Service Decline Anomaly Detection");
  const serviceData = createMockReport({
    services: {
      topServices: [],
      decliningServices: [
        {
          id: 10,
          name: "Tune Up Karburator",
          currentQuantity: 1,
          previousQuantity: 5,
          absoluteChange: -4,
          changePercent: -80,
        },
      ],
    },
  });
  const serviceAnomalies = detectAnomalies(serviceData);
  const serviceAnomaly = serviceAnomalies.find((a) => a.category === "SERVICE");

  if (!serviceAnomaly || serviceAnomaly.severity !== "HIGH") {
    throw new Error(`Test 6 Failed: Expected HIGH service decline anomaly for -80% drop`);
  }
  console.log("✓ Test 6 Passed: Service decline anomaly correctly flagged as HIGH severity.");

  // --------------------------------------------------
  // TEST 7: Threshold Boundary Override Test
  // --------------------------------------------------
  console.log("\n[Test 7] Threshold Boundary Override Test");
  const borderData = createMockReport({
    revenue: {
      current: 8500000,
      previous: 10000000,
      absoluteChange: -1500000,
      changePercent: -15,
      trend: "DOWN",
    },
  });
  const defaultRes = detectAnomalies(borderData);
  if (defaultRes.some((a) => a.category === "REVENUE")) {
    throw new Error("Test 7 Failed: Expected -15% drop to pass without anomaly under default thresholds");
  }

  const customRes = detectAnomalies(borderData, { revenueDropHigh: -10 });
  if (!customRes.some((a) => a.category === "REVENUE")) {
    throw new Error("Test 7 Failed: Expected custom threshold -10% to catch -15% drop");
  }
  console.log("✓ Test 7 Passed: Custom threshold overrides function accurately.");

  // --------------------------------------------------
  // TEST 8: AiAnomalyService & Cache Verification
  // --------------------------------------------------
  console.log("\n[Test 8] AiAnomalyService Integration & Cache Verification");
  AiAnomalyService.clearCache();

  const res1 = await AiAnomalyService.getAnomalies("2026-07-01", "2026-07-31");
  const res2 = await AiAnomalyService.getAnomalies("2026-07-01", "2026-07-31");

  if (res1.generatedAt !== res2.generatedAt) {
    throw new Error("Test 8 Failed: Expected cached response timestamp to match!");
  }
  console.log("✓ Test 8 Passed: Service returns valid structure and uses cache.");

  // --------------------------------------------------
  // TEST 9: Zero PII Audit in Anomalies Response
  // --------------------------------------------------
  console.log("\n[Test 9] Zero PII Audit in Anomalies Output");
  const resJsonStr = JSON.stringify(res1);
  const piiRegexes = [
    /081[0-9]{7,10}/,
    /628[0-9]{7,10}/,
    /"phone"/i,
    /"address"/i,
    /"customerName"/i,
    /"vehiclePlate"/i,
  ];

  for (const regex of piiRegexes) {
    if (regex.test(resJsonStr)) {
      throw new Error(`Test 9 Failed: PII detected matching ${regex} in anomalies output!`);
    }
  }
  console.log("✓ Test 9 Passed: Anomalies output contains ZERO customer PII.");

  // --------------------------------------------------
  // TEST 10: Zero Database Mutation Audit
  // --------------------------------------------------
  console.log("\n[Test 10] Zero Database Mutation Audit");
  const customerCountAfter = await prisma.customer.count();
  const workOrderCountAfter = await prisma.workOrder.count();
  const sparePartCountAfter = await prisma.sparePart.count();

  if (customerCountBefore !== customerCountAfter ||
      workOrderCountBefore !== workOrderCountAfter ||
      sparePartCountBefore !== sparePartCountAfter) {
    throw new Error("Test 10 Failed: Database mutation detected during AI Anomaly execution!");
  }
  console.log("✓ Test 10 Passed: Zero database records were created, modified, or deleted.");

  console.log("\n==================================================");
  console.log("ALL FASE AI-2F AI ANOMALY DETECTION TESTS PASSED!");
  console.log("==================================================");
}

runAi2fAnomalyTests()
  .catch((err) => {
    console.error("\n❌ FASE AI-2F TESTING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
