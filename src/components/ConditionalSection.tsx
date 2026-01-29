/**
 * Conditional Section Wrapper
 * Renders children only if section is enabled
 */

import React from 'react';
import { useSectionVisibility } from '../hooks/useSectionVisibility';

interface ConditionalSectionProps {
  section: string;
  children: React.ReactNode;
}

export const ConditionalSection: React.FC<ConditionalSectionProps> = ({ section, children }) => {
  const isEnabled = useSectionVisibility(section);
  
  // Don't render anything while loading (null) or if disabled (false)
  // Only render if explicitly enabled (true)
  if (isEnabled !== true) {
    return null;
  }
  
  return <>{children}</>;
};

