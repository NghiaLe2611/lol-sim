import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

const CLOSE_DELAY_MS = 10;

export type HoverPopoverProps = {
	children: React.ReactNode;
	/** Render popover panel; receives open so nested media can react (e.g. play while hovered). */
	content: React.ReactNode | ((opts: { open: boolean }) => React.ReactNode);
	contentClassName?: string;
	align?: Popover.PopoverContentProps['align'];
	side?: Popover.PopoverContentProps['side'];
	sideOffset?: number;
	/** Delay before closing when pointer leaves (ms). Default 140. */
	closeDelayMs?: number;
	/** Wrapper around the trigger anchor. Default `inline-flex`. Use `block w-full` for grid cells. */
	triggerClassName?: string;
	showTree?: boolean;
};

/**
 * Lightweight hover-triggered floating panel (Popover, not modal).
 * Small close delay avoids flicker moving from anchor → content across the Radix positioning gap.
 */
function HoverPopover({
	children,
	content,
	contentClassName,
	align = 'center',
	side = 'right',
	sideOffset = 10,
	closeDelayMs = CLOSE_DELAY_MS,
	triggerClassName = 'inline-flex',
	showTree,
}: HoverPopoverProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);
	const [computedSide, setComputedSide] = useState<Popover.PopoverContentProps['side']>(side);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
		setComputedSide(side);
	}, [side]);

	const cancelCloseTimer = useCallback(() => {
		if (closeTimerRef.current != null) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	}, []);

	const handleOpenPointerEnter = useCallback(() => {
		cancelCloseTimer();
		if (triggerRef.current && (side === 'top' || side === 'bottom')) {
			const rect = triggerRef.current.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			// If the trigger is in the upper 50% of the viewport, put the popover at 'right'
			if (rect.top < viewportHeight * 0.5) {
				setComputedSide('right');
			} else {
				setComputedSide('top');
			}
		} else {
			setComputedSide(side);
		}
		setOpen(true);
	}, [cancelCloseTimer, side]);

	// const handleOpenPointerEnter = useCallback(() => {
	// 	cancelCloseTimer();
	// 	setOpen(true);
	// }, [cancelCloseTimer]);

	const scheduleClose = useCallback(() => {
		cancelCloseTimer();
		closeTimerRef.current = setTimeout(() => {
			setOpen(false);
			closeTimerRef.current = null;
		}, closeDelayMs);
	}, [cancelCloseTimer, closeDelayMs]);

	const renderedContent =
		typeof content === 'function'
			? (content as (opts: { open: boolean }) => React.ReactNode)({ open })
			: content;

	return (
		<Popover.Root modal={false} open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<div
					ref={triggerRef}
					className={cn(triggerClassName)}
					onPointerEnter={handleOpenPointerEnter}
					onPointerLeave={scheduleClose}
				>
					{children}
				</div>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align={align}
					side={computedSide}
					sideOffset={sideOffset}
					collisionPadding={12}
					className={cn(
						// '!max-h-[min(70vh,calc(100dvh-2rem))] overflow-y-auto',
						// 'origin-[--radix-popover-content-transform-origin]',
						'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
						'z-[100] rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none',
						contentClassName
					)}
					onPointerEnter={handleOpenPointerEnter}
					onPointerLeave={scheduleClose}
				>
					{renderedContent}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}

export default HoverPopover;
