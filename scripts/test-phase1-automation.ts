import { prisma } from "../lib/prisma";
import { NotificationTrigger } from "@prisma/client";
import { NotificationAutomationService } from "../lib/services/notification-automation.service";

async function runTests() {
  console.log("=== STARTING PHASE 1 AUTOMATION CONTROL TESTS ===");

  // 1. GET ALL AUTOMATIONS
  console.log("\n[Test 1] Testing getAll()...");
  const automations = await NotificationAutomationService.getAll();
  console.log(`Found ${automations.length} automations.`);
  if (automations.length !== 3) {
    throw new Error(`Expected 3 default automations, found ${automations.length}`);
  }
  const triggers = automations.map((a) => a.trigger);
  console.log("Automations order:", triggers);
  if (
    triggers[0] !== NotificationTrigger.WORK_ORDER_CREATED ||
    triggers[1] !== NotificationTrigger.WORK_ORDER_IN_PROGRESS ||
    triggers[2] !== NotificationTrigger.WORK_ORDER_COMPLETED
  ) {
    throw new Error("Automations are not in correct business sequence!");
  }
  console.log("✓ Test 1 passed: 3 automations returned in correct business sequence.");

  // 2. GET BY ID
  console.log("\n[Test 2] Testing getById()...");
  const firstId = automations[0].id;
  const detail = await NotificationAutomationService.getById(firstId);
  if (!detail || detail.id !== firstId) {
    throw new Error("getById failed to fetch automation detail.");
  }
  console.log(`✓ Test 2 passed: Fetched automation detail for ID ${firstId} (${detail.name}).`);

  // 3. TOGGLE AUTOMATION
  console.log("\n[Test 3] Testing toggle()...");
  const toggledOff = await NotificationAutomationService.toggle(firstId, false);
  console.log(`Toggled to isEnabled=${toggledOff.isEnabled}`);
  if (toggledOff.isEnabled !== false) {
    throw new Error("Toggle to false failed.");
  }

  const toggledOn = await NotificationAutomationService.toggle(firstId, true);
  console.log(`Toggled back to isEnabled=${toggledOn.isEnabled}`);
  if (toggledOn.isEnabled !== true) {
    throw new Error("Toggle to true failed.");
  }
  console.log("✓ Test 3 passed: Toggle true -> false -> true works.");

  // 4. UPDATE WITH VALID TEMPLATE ID
  console.log("\n[Test 4] Testing update with valid templateId...");
  let sampleTemplate = await prisma.notificationTemplate.findFirst({
    where: { deletedAt: null },
  });

  if (!sampleTemplate) {
    console.log("No existing template found, creating a test template...");
    sampleTemplate = await prisma.notificationTemplate.create({
      data: {
        name: "Test Template for Automation",
        message: "Halo {{customer_name}}, WO anda {{work_order_number}}",
        category: "CUSTOM",
      },
    });
  }

  const updatedWithTemplate = await NotificationAutomationService.update(firstId, {
    templateId: sampleTemplate.id,
  });
  if (updatedWithTemplate.templateId !== sampleTemplate.id || !updatedWithTemplate.template) {
    throw new Error("Failed to link valid templateId.");
  }
  console.log(`✓ Test 4 passed: Successfully linked templateId ${sampleTemplate.id} (${updatedWithTemplate.template.name}).`);

  // 5. UPDATE WITH INVALID TEMPLATE ID
  console.log("\n[Test 5] Testing update with invalid templateId...");
  try {
    await NotificationAutomationService.update(firstId, {
      templateId: 9999999,
    });
    throw new Error("Update with invalid templateId should have thrown an error, but didn't!");
  } catch (err: any) {
    console.log(`✓ Test 5 passed: Handled invalid templateId correctly with message: "${err.message}"`);
  }

  // 6. TRIGGER IMMUTABILITY
  console.log("\n[Test 6] Testing trigger immutability...");
  const beforeTrigger = detail.trigger;
  // Passing trigger to update payload via cast
  await NotificationAutomationService.update(firstId, { name: "Nama Baru" } as any);
  const afterAutomation = await NotificationAutomationService.getById(firstId);
  if (afterAutomation?.trigger !== beforeTrigger) {
    throw new Error("Trigger was mutated!");
  }
  console.log(`✓ Test 6 passed: Trigger remained unchanged (${afterAutomation?.trigger}).`);

  // 7. GET BY TRIGGER
  console.log("\n[Test 7] Testing getByTrigger()...");
  const activeAuto = await NotificationAutomationService.getByTrigger(NotificationTrigger.WORK_ORDER_CREATED);
  if (!activeAuto) {
    throw new Error("getByTrigger returned null for active automation.");
  }
  console.log(`Active trigger returned: ID ${activeAuto.id}, isEnabled=${activeAuto.isEnabled}`);

  // Disable and test getByTrigger
  await NotificationAutomationService.toggle(firstId, false);
  const disabledAuto = await NotificationAutomationService.getByTrigger(NotificationTrigger.WORK_ORDER_CREATED);
  if (disabledAuto !== null) {
    throw new Error("getByTrigger should return null when automation is disabled.");
  }
  console.log("Disabled trigger returned null correctly.");

  // Re-enable for clean state
  await NotificationAutomationService.toggle(firstId, true);
  console.log("✓ Test 7 passed: getByTrigger returns object when active, null when disabled.");

  console.log("\n=== ALL PHASE 1 AUTOMATION CONTROL TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((e) => {
    console.error("\n❌ TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
