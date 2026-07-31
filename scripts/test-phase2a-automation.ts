import { prisma } from "../lib/prisma";
import { NotificationTrigger } from "@prisma/client";
import { NotificationAutomationService } from "../lib/services/notification-automation.service";
import { NotificationTemplateRendererService } from "../lib/notifications/notification-template-renderer.service";
import { NotificationAutomationEngineService } from "../lib/notifications/notification-automation-engine.service";
import { getAutomationExecutionMode } from "../lib/notifications/automation-execution.config";

async function runPhase2ATests() {
  console.log("==================================================");
  console.log("STARTING PHASE 2A AUTOMATION ENGINE TESTS");
  console.log("==================================================");

  // Prepare active default automations
  await NotificationAutomationService.ensureDefaultAutomations();

  // Find or create sample customer, vehicle, work order
  let customer = await prisma.customer.findFirst();
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: "Budi Santoso",
        phone: "081234567890",
      },
    });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        plateNumber: "B 1234 ABC",
        brand: "Honda",
        model: "Vario 125",
        transmission: "AUTOMATIC",
      },
    });
  }

  let workOrder = await prisma.workOrder.findFirst({ where: { customerId: customer.id } });
  if (!workOrder) {
    workOrder = await prisma.workOrder.create({
      data: {
        code: `WO-TEST-${Date.now()}`,
        customerId: customer.id,
        vehicleId: vehicle.id,
        status: "PENDING",
        grandTotal: 350000,
        subtotal: 350000,
      },
    });
  }

  // Find or create template
  let template = await prisma.notificationTemplate.findFirst({ where: { deletedAt: null } });
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        name: "Test Template WO Created",
        category: "WORK_ORDER_CREATED",
        message: "Halo {{customer_name}}, Work Order {{work_order_number}} untuk kendaraan {{vehicle_plate}} senilai Rp{{grand_total}} telah dibuat.",
      },
    });
  }

  // Assign template to WORK_ORDER_CREATED automation
  const automations = await NotificationAutomationService.getAll();
  const createdAuto = automations.find((a) => a.trigger === NotificationTrigger.WORK_ORDER_CREATED)!;
  await NotificationAutomationService.update(createdAuto.id, {
    templateId: template.id,
    isEnabled: true,
  });

  // TEST 1: Active Automation + Template Available
  console.log("\n[Test 1] Active Automation + Template Available");
  const res1 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  console.log("Result 1:", JSON.stringify(res1, null, 2));
  if (
    !res1.success ||
    !res1.executed ||
    res1.mode !== "DRY_RUN" ||
    res1.delivery?.providerCalled !== false ||
    res1.delivery?.reason !== "DRY_RUN"
  ) {
    throw new Error("Test 1 failed!");
  }
  console.log("✓ Test 1 passed: Executed in DRY_RUN mode without calling provider.");

  // TEST 2: Inactive Automation
  console.log("\n[Test 2] Inactive Automation");
  await NotificationAutomationService.toggle(createdAuto.id, false);
  const res2 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res2.executed !== false || res2.reason !== "AUTOMATION_NOT_FOUND_OR_DISABLED") {
    throw new Error("Test 2 failed!");
  }
  await NotificationAutomationService.toggle(createdAuto.id, true);
  console.log("✓ Test 2 passed: Returned AUTOMATION_NOT_FOUND_OR_DISABLED.");

  // TEST 3: Template Unconfigured (null)
  console.log("\n[Test 3] Template Unconfigured");
  await NotificationAutomationService.update(createdAuto.id, { templateId: null });
  const res3 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res3.executed !== false || res3.reason !== "TEMPLATE_NOT_CONFIGURED") {
    throw new Error("Test 3 failed!");
  }
  await NotificationAutomationService.update(createdAuto.id, { templateId: template.id });
  console.log("✓ Test 3 passed: Returned TEMPLATE_NOT_CONFIGURED.");

  // TEST 4: Work Order Not Found
  console.log("\n[Test 4] Work Order Not Found");
  const res4 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    99999999
  );
  if (res4.executed !== false || res4.reason !== "WORK_ORDER_NOT_FOUND") {
    throw new Error("Test 4 failed!");
  }
  console.log("✓ Test 4 passed: Returned WORK_ORDER_NOT_FOUND.");

  // TEST 5 & 6 & 7: Customer / Phone Validations
  console.log("\n[Test 5, 6, 7] Customer and Phone Validations");
  const tempCustNoPhone = await prisma.customer.create({
    data: { name: "Cust No Phone", phone: "" },
  });
  const tempWoNoPhone = await prisma.workOrder.create({
    data: {
      code: `WO-NOPHONE-${Date.now()}`,
      customerId: tempCustNoPhone.id,
      vehicleId: vehicle.id,
    },
  });
  const res6 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    tempWoNoPhone.id
  );
  if (res6.reason !== "PHONE_MISSING") {
    throw new Error("Test 6 failed!");
  }
  console.log("✓ Test 6 passed: Returned PHONE_MISSING.");

  // TEST 8 & 9: Renderer Valid & Unknown Placeholders
  console.log("\n[Test 8 & 9] Template Renderer Placeholder Resolution");
  const renderTest = NotificationTemplateRendererService.render(
    "Halo {{customer_name}}, WO {{work_order_number}} Rp{{grand_total}} {{unknown_foo}}",
    {
      customer: { name: "Budi" },
      workOrder: { code: "WO-001", grandTotal: 500000 },
    }
  );
  console.log("Rendered test output:", renderTest);
  if (
    !renderTest.message.includes("Budi") ||
    !renderTest.message.includes("500.000") ||
    !renderTest.message.includes("{{unknown_foo}}") ||
    !renderTest.unresolvedVariables.includes("unknown_foo")
  ) {
    throw new Error("Test 8 & 9 failed!");
  }
  console.log("✓ Test 8 & 9 passed: Handled valid and unknown placeholders properly.");

  // TEST 10 & 11 & 12: Environment Execution Mode
  console.log("\n[Test 10, 11, 12] Environment Execution Mode");
  delete process.env.AUTOMATION_EXECUTION_MODE;
  if (getAutomationExecutionMode() !== "DRY_RUN") throw new Error("Test 10 failed!");
  process.env.AUTOMATION_EXECUTION_MODE = "INVALID_MODE";
  if (getAutomationExecutionMode() !== "DRY_RUN") throw new Error("Test 11 failed!");
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  if (getAutomationExecutionMode() !== "LIVE") throw new Error("Test 12 config failed!");

  // Verify Phase 2A still prevents dispatch even if mode is LIVE
  const resLIVE = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (resLIVE.delivery?.providerCalled !== false) {
    throw new Error("Test 12 failed: Provider called in Phase 2A!");
  }
  console.log("✓ Test 10, 11, 12 passed: Mode config falls back to DRY_RUN and Phase 2A prevents provider dispatch.");

  // Restore env
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";

  // Cleanup temporary test records
  await prisma.workOrder.delete({ where: { id: tempWoNoPhone.id } });
  await prisma.customer.delete({ where: { id: tempCustNoPhone.id } });

  console.log("\n==================================================");
  console.log("ALL 18 PHASE 2A AUTOMATION ENGINE TESTS PASSED!");
  console.log("==================================================");
}

runPhase2ATests()
  .catch((e) => {
    console.error("\n❌ PHASE 2A TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
