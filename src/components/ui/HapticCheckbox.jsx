// HapticCheckbox.jsx v1.0 - Checkbox with haptic feedback
// Wraps shadcn Checkbox with native haptic feedback for mobile
//
// CHANGELOG:
// v1.0 (2026-01-28): Initial implementation
//   - Wraps shadcn Checkbox component
//   - Adds haptics.light() on state change
//   - Passes all props through to underlying Checkbox

import * as React from "react";
import { Checkbox } from "./checkbox";
import { haptics } from "@/utils/haptics";

/**
 * HapticCheckbox - Checkbox with native haptic feedback
 *
 * @param {boolean} checked - Controlled checked state
 * @param {function} onCheckedChange - Callback when checked state changes
 * @param {string} className - Additional CSS classes
 * @param {boolean} disabled - Disable the checkbox
 */
const HapticCheckbox = React.forwardRef(
  ({ onCheckedChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (checked) => {
        haptics.light();
        onCheckedChange?.(checked);
      },
      [onCheckedChange]
    );

    return (
      <Checkbox
        ref={ref}
        onCheckedChange={handleChange}
        {...props}
      />
    );
  }
);

HapticCheckbox.displayName = "HapticCheckbox";

export { HapticCheckbox };
