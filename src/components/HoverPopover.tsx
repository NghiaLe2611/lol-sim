import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

const DEFAULT_OPEN_DELAY_MS = 100;
const DEFAULT_CLOSE_DELAY_MS = 100;

export type HoverPopoverProps = {
	children: React.ReactNode;
	/** Render popover panel; receives open so nested media can react (e.g. play while hovered). */
	content: React.ReactNode | ((opts: { open: boolean }) => React.ReactNode);
	contentClassName?: string;
	align?: Popover.PopoverContentProps['align'];
	side?: Popover.PopoverContentProps['side'];
	sideOffset?: number;
	/** Delay before closing when pointer leaves (ms). Default 150. Set 0 to close immediately. */
	closeDelayMs?: number;
	/** Delay before opening when pointer enters (ms). Default 120. Set 0 to open immediately. */
	openDelayMs?: number;
	/** Wrapper around the trigger anchor. Default `inline-flex`. Use `block w-full` for grid cells. */
	triggerClassName?: string;
	showTree?: boolean;
};

/**
 * Lightweight hover-triggered floating panel (Popover, not modal).
 * Open/close delays reduce flicker on dense grids and when moving trigger → content.
 */
function HoverPopover({
	children,
	content,
	contentClassName,
	align = 'center',
	side = 'right',
	sideOffset = 10,
	closeDelayMs = DEFAULT_CLOSE_DELAY_MS,
	openDelayMs = DEFAULT_OPEN_DELAY_MS,
	triggerClassName = 'inline-flex',
	showTree,
}: HoverPopoverProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);
	const [computedSide, setComputedSide] = useState<Popover.PopoverContentProps['side']>(side);
	const openRef = useRef(false);

	const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		openRef.current = open;
	}, [open]);

	useEffect(() => {
		setComputedSide(side);
	}, [side]);

	const cancelOpenTimer = useCallback(() => {
		if (openTimerRef.current != null) {
			clearTimeout(openTimerRef.current);
			openTimerRef.current = null;
		}
	}, []);

	const cancelCloseTimer = useCallback(() => {
		if (closeTimerRef.current != null) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			cancelOpenTimer();
			cancelCloseTimer();
		};
	}, [cancelOpenTimer, cancelCloseTimer]);

	const updateSide = useCallback(() => {
		if (triggerRef.current && (side === 'top' || side === 'bottom')) {
			const rect = triggerRef.current.getBoundingClientRect();
			const viewportHeight = window.innerHeight;
			if (rect.top < viewportHeight * 0.5) {
				setComputedSide('right');
			} else {
				setComputedSide('top');
			}
		} else {
			setComputedSide(side);
		}
	}, [side]);

	const scheduleOpen = useCallback(() => {
		cancelOpenTimer();

		if (openRef.current) return;

		if (openDelayMs <= 0) {
			setOpen(true);
			return;
		}

		openTimerRef.current = setTimeout(() => {
			setOpen(true);
			openTimerRef.current = null;
		}, openDelayMs);
	}, [cancelOpenTimer, openDelayMs]);

	const handleOpenPointerEnter = useCallback(() => {
		cancelCloseTimer();
		updateSide();
		scheduleOpen();
	}, [cancelCloseTimer, updateSide, scheduleOpen]);

	const scheduleClose = useCallback(() => {
		cancelOpenTimer();
		cancelCloseTimer();

		if (!openRef.current) return;

		if (closeDelayMs <= 0) {
			setOpen(false);
			return;
		}

		closeTimerRef.current = setTimeout(() => {
			setOpen(false);
			closeTimerRef.current = null;
		}, closeDelayMs);
	}, [cancelOpenTimer, cancelCloseTimer, closeDelayMs]);

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
					side={side ? side : computedSide}
					sideOffset={sideOffset}
					collisionPadding={12}
					className={cn(
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
