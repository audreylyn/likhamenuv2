/**
 * Conditional Section Wrapper
 * Renders children only if section is enabled
 * Shows sections by default while loading or if not explicitly disabled
 */

import React from "react";
import { useSectionVisibility } from "../hooks/useSectionVisibility";

interface ConditionalSectionProps {
  section: string;
  children: React.ReactNode;
}

export const ConditionalSection: React.FC<ConditionalSectionProps> = ({
  section,
  children,
}) => {
  const isEnabled = useSectionVisibility(section);

  // Show section if:
  // - Explicitly enabled (true)
  // - Still loading/unknown (null) - default to showing
  // Only hide if explicitly disabled (false)
  if (isEnabled === false) {
    return null;
  }

  return <>{children}</>;
};
