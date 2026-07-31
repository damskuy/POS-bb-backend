/**
 * Period Comparison Helper
 * Utility functions to calculate date ranges for current & previous periods
 * and calculate metric change deltas, percentages, and trends.
 */

export interface PeriodRangeResult {
  label: string;
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  durationDays: number;
  currentPeriod: {
    startObj: Date;
    endObj: Date;
  };
  previousPeriod: {
    startObj: Date;
    endObj: Date;
  };
}

export interface MetricChange {
  current: number;
  previous: number;
  absoluteChange: number;
  changePercent: number | null;
  trend: "UP" | "DOWN" | "STABLE" | "NEW";
}

/**
 * Format a Date object to YYYY-MM-DD string cleanly in local/UTC timezone.
 */
function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current and previous period date ranges.
 * Ensures the previous period has identical duration to current period without overlap.
 */
export function calculatePeriodRange(
  startDateStr?: string | null,
  endDateStr?: string | null
): PeriodRangeResult {
  const now = new Date();

  let start: Date;
  let end: Date;

  if (!startDateStr && !endDateStr) {
    // Default: 30 days up to today
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
  } else {
    // Parse provided dates
    const parsedStart = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const parsedEnd = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (isNaN(parsedStart.getTime())) {
      throw new Error("Format startDate tidak valid. Gunakan format YYYY-MM-DD");
    }
    if (isNaN(parsedEnd.getTime())) {
      throw new Error("Format endDate tidak valid. Gunakan format YYYY-MM-DD");
    }

    start = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
    end = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);
  }

  if (start.getTime() > end.getTime()) {
    throw new Error("startDate tidak boleh setelah endDate");
  }

  // Check if start is 1st of month and end is last day of month
  const isStartFirstDay = start.getDate() === 1;
  const lastDayOfEndMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  const isEndLastDay = end.getDate() === lastDayOfEndMonth;

  let prevStart: Date;
  let prevEnd: Date;
  let durationDays: number;

  if (isStartFirstDay && isEndLastDay && (start.getMonth() === end.getMonth()) && (start.getFullYear() === end.getFullYear())) {
    // Full Calendar Month (e.g. July 1 - July 31 -> June 1 - June 30)
    prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
    durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Custom date range (exact days subtraction)
    const diffMs = end.getTime() - start.getTime();
    durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

    prevEnd = new Date(start.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() - (durationDays - 1), 0, 0, 0, 0);
  }

  const startFormatted = formatDateToYYYYMMDD(start);
  const endFormatted = formatDateToYYYYMMDD(end);
  const prevStartFormatted = formatDateToYYYYMMDD(prevStart);
  const prevEndFormatted = formatDateToYYYYMMDD(prevEnd);

  const label = `${durationDays} hari (${startFormatted} s/d ${endFormatted})`;

  return {
    label,
    startDate: startFormatted,
    endDate: endFormatted,
    previousStartDate: prevStartFormatted,
    previousEndDate: prevEndFormatted,
    durationDays,
    currentPeriod: {
      startObj: start,
      endObj: end,
    },
    previousPeriod: {
      startObj: prevStart,
      endObj: prevEnd,
    },
  };
}

/**
 * Calculates metric change delta, percentage, and trend direction.
 * Safely handles zero values without producing NaN or Infinity.
 */
export function calculateMetricChange(
  currentVal?: number | null,
  previousVal?: number | null
): MetricChange {
  const current = typeof currentVal === "number" && !isNaN(currentVal) ? currentVal : 0;
  const previous = typeof previousVal === "number" && !isNaN(previousVal) ? previousVal : 0;

  const absoluteChange = current - previous;

  if (previous > 0) {
    const rawPercent = ((current - previous) / previous) * 100;
    const changePercent = Number(rawPercent.toFixed(2));

    let trend: MetricChange["trend"] = "STABLE";
    if (current > previous) trend = "UP";
    else if (current < previous) trend = "DOWN";

    return {
      current,
      previous,
      absoluteChange,
      changePercent,
      trend,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      current,
      previous,
      absoluteChange: current,
      changePercent: null,
      trend: "NEW",
    };
  }

  return {
    current,
    previous,
    absoluteChange: 0,
    changePercent: null,
    trend: "STABLE",
  };
}
