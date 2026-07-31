export type AutomationExecutionMode = "DRY_RUN" | "LIVE";

/**
 * Centralized helper to resolve the Automation Execution Mode.
 * Defaults to "DRY_RUN". Only exact string "LIVE" returns "LIVE".
 */
export function getAutomationExecutionMode(): AutomationExecutionMode {
  const envMode = process.env.AUTOMATION_EXECUTION_MODE;
  if (envMode === "LIVE") {
    return "LIVE";
  }
  return "DRY_RUN";
}

/**
 * Resolves the effective Automation Execution Mode by checking the LIVE safety gate.
 * If AUTOMATION_EXECUTION_MODE is LIVE but AUTOMATION_LIVE_ENABLED is not true, falls back to DRY_RUN.
 */
export function getEffectiveAutomationExecutionMode(): {
  mode: AutomationExecutionMode;
  reason?: string;
} {
  const mode = getAutomationExecutionMode();
  if (mode !== "LIVE") {
    return { mode: "DRY_RUN", reason: "AUTOMATION_DRY_RUN" };
  }

  const liveEnabled = process.env.AUTOMATION_LIVE_ENABLED;
  if (liveEnabled === "true") {
    return { mode: "LIVE" };
  }

  return { mode: "DRY_RUN", reason: "LIVE_NOT_ENABLED" };
}

export interface LiveTestFilterResult {
  allowed: boolean;
  reason?: string;
  filter?: {
    enabled: boolean;
    workOrderId?: number;
    trigger?: string;
  };
}

/**
 * Validates whether a specific Work Order and trigger is allowed for LIVE testing.
 */
export function checkLiveTestFilter(
  workOrderId: number,
  trigger: string
): LiveTestFilterResult {
  const testWoIdStr = process.env.AUTOMATION_TEST_WORK_ORDER_ID;
  const testTrigger = process.env.AUTOMATION_TEST_TRIGGER;

  if (!testWoIdStr) {
    return {
      allowed: false,
      reason: "LIVE_TEST_WORK_ORDER_NOT_CONFIGURED",
      filter: { enabled: false },
    };
  }

  const testWoId = parseInt(testWoIdStr, 10);
  if (isNaN(testWoId)) {
    return {
      allowed: false,
      reason: "LIVE_TEST_WORK_ORDER_NOT_CONFIGURED",
      filter: { enabled: false },
    };
  }

  if (workOrderId !== testWoId) {
    return {
      allowed: false,
      reason: "WORK_ORDER_NOT_ALLOWED_FOR_LIVE_TEST",
      filter: {
        enabled: true,
        workOrderId: testWoId,
        ...(testTrigger ? { trigger: testTrigger } : {}),
      },
    };
  }

  if (testTrigger && trigger !== testTrigger) {
    return {
      allowed: false,
      reason: "TRIGGER_NOT_ALLOWED_FOR_LIVE_TEST",
      filter: {
        enabled: true,
        workOrderId: testWoId,
        trigger: testTrigger,
      },
    };
  }

  return {
    allowed: true,
    filter: {
      enabled: true,
      workOrderId: testWoId,
      ...(testTrigger ? { trigger: testTrigger } : {}),
    },
  };
}
