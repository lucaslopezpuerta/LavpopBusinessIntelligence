// Tooltip.jsx v2.5 - ACCESSIBILITY
// ✅ Position-aware (top, bottom, left, right)
// ✅ Dark mode support
// ✅ Spring animations via Framer Motion
// ✅ Keyboard accessible
// ✅ Mobile touch support (tap-to-toggle)
// ✅ Reduced motion support
//
// CHANGELOG:
// v2.5 (2026-01-27): Accessibility improvements
//   - Added useReducedMotion hook for prefers-reduced-motion support
//   - Tooltip animations disabled when user prefers reduced motion
// v2.4 (2026-01-07): Glass morphism enhancement
//   - Added backdrop-blur-md for premium frosted glass effect
//   - Semi-transparent background (95% opacity)
//   - Subtle border for visual depth
// v2.3 (2026-01-07): Fixed tooltip STILL clipping on right edge
//   - CHANGED: Removed transform for horizontal positioning (was causing miscalculation)
//   - NEW: Use explicit left pixel value instead of transform(-50%)
//   - NEW: CSS right:8px fallback constraint prevents any overflow
//   - Now tooltip position is exact pixels, not dependent on element width transform
// v2.2 (2026-01-07): Fixed tooltip clipping on right edge of screen
//   - FIXED: Tooltip now measures actual dimensions before positioning
//   - FIXED: Clamping uses measured width instead of estimate
//   - Previously, first render used estimated width causing incorrect position
// v2.1 (2026-01-07): Fixed tooltip width on mobile viewport
//   - FIXED: Removed min-w-max that overrode max-width constraint
//   - FIXED: Tooltip now respects viewport boundaries on small screens
//   - Added word wrapping for long content
// v2.0 (2026-01-07): Fixed mobile tap not working
//   - FIXED: Restored isMobile check in handleMouseEnter/Leave
//   - On mobile tap: mouseenter fired → showed tooltip → click fired → hid it
//   - Now hover events are ignored on mobile, tap-to-toggle works correctly
// v1.9 (2026-01-07): Fixed tooltip position jump on click
//   - FIXED: Don't recalculate coords if tooltip already visible
//   - Clicking (which triggers focus) no longer causes position shift
// v1.8 (2026-01-07): Fixed AnimatePresence + Portal structure
//   - FIXED: Moved AnimatePresence INSIDE portal so it can track children
//   - Portal is now always rendered, AnimatePresence controls visibility
//   - This fixes tooltips not appearing after spring animation was added
// v1.7 (2026-01-07): Fixed hover not working on desktop
//   - FIXED: Removed isMobile early return from handleMouseEnter/Leave
//   - Hover now works on all devices with mouse/trackpad
//   - Click/tap still works on mobile as supplementary interaction
// v1.6 (2026-01-07): Mobile touch support & comprehensive edge clamping
//   - NEW: Tap-to-toggle on mobile (touch devices)
//   - NEW: Backdrop overlay for dismissing on outside tap
//   - FIXED: Vertical clamping for left/right tooltip positions
//   - UPDATED: SAFE_AREA constants for modern mobile devices (notch/Dynamic Island)
//   - IMPROVED: Responsive max-width for small screens
// v1.5 (2026-01-07): Spring entrance animations (Figma-quality enhancement)
//   - Added Framer Motion for smooth spring-based entrance
//   - Tooltip scales from 0.95 with spring physics
//   - AnimatePresence for smooth exit animations
// v1.4 (2026-01-07): UX-focused positioning - keep tooltip connected to trigger
//   - CHANGED: Removed aggressive clamping that disconnected tooltip from trigger
//   - NEW: Smart fallback to left/right when vertical space is limited
//   - NEW: Tooltip stays adjacent to trigger (better UX than floating away)
//   - Slight overflow is acceptable; disconnection is not
// v1.3 (2026-01-07): Vertical clamping fix (superseded by v1.4)
// v1.2 (2026-01-07): Horizontal clamping for top/bottom tooltips
// v1.1 (2026-01-07): Bug fixes for positioning and mobile
// v1.0 (2025-11-23): Initial implementation

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useIsMobile } from '../hooks/useMediaQuery';
import useReducedMotion from '../hooks/useReducedMotion';

// Spring animation config for tooltip entrance
const tooltipAnimation = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

// Reduced motion variant - instant visibility change
const tooltipAnimationReduced = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

const springConfig = { type: 'spring', damping: 20, stiffness: 300 };
const reducedConfig = { duration: 0.1 };

// Safe area constants for mobile - generous estimates for modern devices
const SAFE_AREA = {
    top: 60,      // Covers iOS Dynamic Island (59px) + status bar, Android notch
    bottom: 100,  // Bottom nav (64px) + home indicator (34px) + buffer
    padding: 12   // Comfortable spacing from viewport edges
};

const Tooltip = ({
    content,
    children,
    position = 'top',
    className = '',
    showIcon = false,
    iconSize = 'w-4 h-4'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [adjustedPosition, setAdjustedPosition] = useState(position);
    const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
    const tooltipRef = useRef(null);
    const triggerRef = useRef(null);
    const isMobile = useIsMobile();
    const prefersReducedMotion = useReducedMotion();

    // Update coords from trigger element
    const updateCoords = useCallback((element) => {
        const rect = element.getBoundingClientRect();
        setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
        });
    }, []);

    // Show on mouse enter (desktop only - mobile uses tap via handleClick)
    const handleMouseEnter = useCallback((e) => {
        if (isMobile) return; // Mobile uses tap-to-toggle, ignore hover events
        if (isVisible) return; // Already showing, don't recalculate position
        updateCoords(e.currentTarget);
        setIsVisible(true);
    }, [updateCoords, isVisible, isMobile]);

    // Hide on mouse leave (desktop only)
    const handleMouseLeave = useCallback(() => {
        if (isMobile) return; // Mobile uses tap-to-toggle, ignore hover events
        setIsVisible(false);
    }, [isMobile]);

    // Tap-to-toggle for touch devices (supplements hover for mobile)
    const handleClick = useCallback((e) => {
        // Only handle touch/click on touch-capable devices
        if (!isMobile) return;
        e.preventDefault();
        e.stopPropagation();

        if (isVisible) {
            setIsVisible(false);
        } else {
            updateCoords(e.currentTarget);
            setIsVisible(true);
        }
    }, [isMobile, isVisible, updateCoords]);

    // Dismiss on backdrop tap (mobile only)
    const handleBackdropClick = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Hide tooltip on scroll to prevent orphaned tooltips
    useEffect(() => {
        if (!isVisible) return;
        const handleScroll = () => setIsVisible(false);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isVisible]);

    // Reset adjusted position when requested position changes
    useEffect(() => {
        setAdjustedPosition(position);
    }, [position]);

    // Smart positioning: prioritize keeping tooltip CONNECTED to trigger
    // UX principle: A slightly clipped tooltip is better than a disconnected one
    useLayoutEffect(() => {
        if (!isVisible || !tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Calculate available space in each direction
        const spaceAbove = coords.top - SAFE_AREA.padding;
        const spaceBelow = viewport.height - coords.top - coords.height - SAFE_AREA.padding;
        const spaceLeft = coords.left - SAFE_AREA.padding;
        const spaceRight = viewport.width - coords.left - coords.width - SAFE_AREA.padding;

        // Minimum space needed (tooltip must have at least 60% visible to be usable)
        const minVerticalSpace = tooltipRect.height * 0.6;
        const minHorizontalSpace = tooltipRect.width * 0.6;

        let newPosition = position;

        // For vertical positions (top/bottom)
        if (position === 'top' || position === 'bottom') {
            const preferTop = position === 'top';
            const fitsAbove = spaceAbove >= minVerticalSpace;
            const fitsBelow = spaceBelow >= minVerticalSpace;

            if (preferTop) {
                if (!fitsAbove && fitsBelow) {
                    newPosition = 'bottom';
                } else if (!fitsAbove && !fitsBelow) {
                    // Neither vertical position works - try horizontal
                    if (spaceRight >= minHorizontalSpace) {
                        newPosition = 'right';
                    } else if (spaceLeft >= minHorizontalSpace) {
                        newPosition = 'left';
                    }
                    // else: keep original, accept clipping
                }
            } else {
                if (!fitsBelow && fitsAbove) {
                    newPosition = 'top';
                } else if (!fitsBelow && !fitsAbove) {
                    // Neither vertical position works - try horizontal
                    if (spaceRight >= minHorizontalSpace) {
                        newPosition = 'right';
                    } else if (spaceLeft >= minHorizontalSpace) {
                        newPosition = 'left';
                    }
                }
            }
        }

        // For horizontal positions (left/right)
        if (position === 'left' || position === 'right') {
            const preferLeft = position === 'left';
            const fitsLeft = spaceLeft >= minHorizontalSpace;
            const fitsRight = spaceRight >= minHorizontalSpace;

            if (preferLeft && !fitsLeft && fitsRight) {
                newPosition = 'right';
            } else if (!preferLeft && !fitsRight && fitsLeft) {
                newPosition = 'left';
            }
        }

        if (newPosition !== adjustedPosition) {
            setAdjustedPosition(newPosition);
        }
    }, [isVisible, coords, position, adjustedPosition]);

    // Measure tooltip dimensions after render to enable accurate clamping
    useLayoutEffect(() => {
        if (!isVisible || !tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const newWidth = tooltip.offsetWidth;
        const newHeight = tooltip.offsetHeight;

        // Only update if dimensions changed (avoid infinite loop)
        if (newWidth !== measuredSize.width || newHeight !== measuredSize.height) {
            setMeasuredSize({ width: newWidth, height: newHeight });
        }
    }, [isVisible, measuredSize.width, measuredSize.height]);

    // Reset measured size when tooltip hides
    useEffect(() => {
        if (!isVisible) {
            setMeasuredSize({ width: 0, height: 0 });
        }
    }, [isVisible]);

    // Calculate tooltip position - keeps tooltip ADJACENT to trigger (no disconnection)
    // Uses EXPLICIT pixel positioning (no transform for horizontal) to prevent overflow
    const getTooltipStyle = () => {
        const pos = adjustedPosition;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Use measured width if available, then ref, then estimate
        const tooltipWidth = measuredSize.width || tooltipRef.current?.offsetWidth || Math.min(280, viewportWidth - 32);
        const tooltipHeight = measuredSize.height || tooltipRef.current?.offsetHeight || 60;
        // On mobile, use tighter padding
        const edgePadding = viewportWidth < 480 ? 8 : SAFE_AREA.padding;

        let left, top, transform;

        if (pos === 'top') {
            // Position above trigger
            // Calculate left edge position (NOT center) to have full control
            const triggerCenter = coords.left + coords.width / 2;
            left = triggerCenter - tooltipWidth / 2; // Left edge of tooltip
            top = coords.top - tooltipHeight - 8;
            transform = 'none'; // No transform - use explicit pixels

            // Clamp left edge to viewport bounds
            if (left < edgePadding) {
                left = edgePadding;
            } else if (left + tooltipWidth > viewportWidth - edgePadding) {
                left = viewportWidth - edgePadding - tooltipWidth;
            }
        } else if (pos === 'bottom') {
            // Position below trigger
            const triggerCenter = coords.left + coords.width / 2;
            left = triggerCenter - tooltipWidth / 2;
            top = coords.top + coords.height + 8;
            transform = 'none';

            // Clamp left edge to viewport bounds
            if (left < edgePadding) {
                left = edgePadding;
            } else if (left + tooltipWidth > viewportWidth - edgePadding) {
                left = viewportWidth - edgePadding - tooltipWidth;
            }
        } else if (pos === 'left') {
            // Position to left of trigger, vertically centered
            left = coords.left - tooltipWidth - 8;
            top = coords.top + coords.height / 2 - tooltipHeight / 2;
            transform = 'none';

            // Clamp vertically to keep tooltip on screen
            const topSafe = viewportWidth < 480 ? 48 : SAFE_AREA.top;
            const bottomSafe = viewportWidth < 480 ? 80 : SAFE_AREA.bottom;

            if (top < topSafe) {
                top = topSafe;
            } else if (top + tooltipHeight > viewportHeight - bottomSafe) {
                top = viewportHeight - bottomSafe - tooltipHeight;
            }
        } else {
            // Position to right of trigger, vertically centered
            left = coords.left + coords.width + 8;
            top = coords.top + coords.height / 2 - tooltipHeight / 2;
            transform = 'none';

            // Clamp vertically to keep tooltip on screen
            const topSafe = viewportWidth < 480 ? 48 : SAFE_AREA.top;
            const bottomSafe = viewportWidth < 480 ? 80 : SAFE_AREA.bottom;

            if (top < topSafe) {
                top = topSafe;
            } else if (top + tooltipHeight > viewportHeight - bottomSafe) {
                top = viewportHeight - bottomSafe - tooltipHeight;
            }
        }

        // Final safety: ensure left is never negative and right edge doesn't overflow
        left = Math.max(edgePadding, Math.min(left, viewportWidth - tooltipWidth - edgePadding));

        return { top, left, transform };
    };

    // Calculate arrow position based on adjustedPosition
    // Arrow should point to trigger center even when tooltip is shifted
    const getArrowStyle = () => {
        const pos = adjustedPosition;
        const style = getTooltipStyle();
        const tooltipWidth = measuredSize.width || 200;
        const tooltipHeight = measuredSize.height || 60;

        // Calculate where the trigger center is relative to tooltip left edge
        const triggerCenter = coords.left + coords.width / 2;
        let arrowLeft = triggerCenter - style.left;
        // Clamp arrow to stay within tooltip bounds (with padding)
        arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipWidth - 12));

        if (pos === 'top' || pos === 'bottom') {
            return {
                bottom: pos === 'top' ? '-4px' : 'auto',
                top: pos === 'bottom' ? '-4px' : 'auto',
                left: `${arrowLeft}px`,
                right: 'auto',
                marginLeft: '-4px',
                borderRight: 'none',
                borderBottom: pos === 'top' ? '1px solid' : 'none',
                borderTop: pos === 'bottom' ? '1px solid' : 'none',
                borderLeft: 'none'
            };
        } else {
            // Left/right positions
            const triggerMiddle = coords.top + coords.height / 2;
            let arrowTop = triggerMiddle - style.top;
            arrowTop = Math.max(12, Math.min(arrowTop, tooltipHeight - 12));

            return {
                bottom: 'auto',
                top: `${arrowTop}px`,
                left: pos === 'right' ? '-4px' : 'auto',
                right: pos === 'left' ? '-4px' : 'auto',
                marginLeft: '0',
                marginTop: '-4px',
                borderRight: pos === 'left' ? '1px solid' : 'none',
                borderBottom: 'none',
                borderTop: 'none',
                borderLeft: pos === 'right' ? '1px solid' : 'none'
            };
        }
    };

    const tooltipContent = (
        <motion.div
            ref={tooltipRef}
            className={`
                fixed z-[9999] px-3 py-2
                bg-slate-900/95 dark:bg-slate-700/95 backdrop-blur-md
                text-white text-xs font-medium leading-relaxed
                rounded-lg shadow-xl
                pointer-events-none
                border border-slate-700/50 dark:border-slate-600/50
            `}
            style={{
                ...getTooltipStyle(),
                // CSS-based width constraints - more reliable than Tailwind for dynamic content
                width: 'max-content',
                maxWidth: `min(280px, calc(100vw - 16px))`,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
            }}
            role="tooltip"
            initial={prefersReducedMotion ? tooltipAnimationReduced.initial : tooltipAnimation.initial}
            animate={prefersReducedMotion ? tooltipAnimationReduced.animate : tooltipAnimation.animate}
            exit={prefersReducedMotion ? tooltipAnimationReduced.exit : tooltipAnimation.exit}
            transition={prefersReducedMotion ? reducedConfig : springConfig}
        >
            {content}
            {/* Arrow */}
            <div
                className={`
                    absolute w-2 h-2 bg-slate-900/95 dark:bg-slate-700/95
                    transform rotate-45 border-slate-700/50 dark:border-slate-600/50
                `}
                style={getArrowStyle()}
            />
        </motion.div>
    );

    return (
        <div className={`inline-flex items-center ${className}`}>
            <div
                ref={triggerRef}
                className="inline-flex items-center gap-1 cursor-help"
                // Desktop: hover behavior
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                // Mobile: tap-to-toggle
                onClick={handleClick}
                // Keyboard accessibility (all devices)
                onFocus={handleMouseEnter}
                onBlur={handleMouseLeave}
                tabIndex={0}
            >
                {children}
                {showIcon && (
                    <HelpCircle className={`${iconSize} text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors`} />
                )}
            </div>

            {ReactDOM.createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <>
                            {/* Backdrop for mobile - tap outside to dismiss */}
                            {isMobile && (
                                <div
                                    className="fixed inset-0 z-[9998]"
                                    onClick={handleBackdropClick}
                                    aria-hidden="true"
                                />
                            )}
                            {tooltipContent}
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;
