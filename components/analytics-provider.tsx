"use client";

import { useEffect } from "react";
import { initPosthog } from "@/lib/analytics/posthog";

export function AnalyticsProvider() {
  useEffect(() => {
    initPosthog();
  }, []);

  return null;
}
