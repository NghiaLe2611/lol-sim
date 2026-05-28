import React, { useCallback, useRef, useState } from 'react';
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
}: HoverPopoverProps) {
	const [open, setOpen] = useState(false);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancelCloseTimer = useCallback(() => {
		if (closeTimerRef.current != null) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	}, []);

	const handleOpenPointerEnter = useCallback(() => {
		cancelCloseTimer();
		setOpen(true);
	}, [cancelCloseTimer]);

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
					side={side}
					sideOffset={sideOffset}
					collisionPadding={12}
					className={cn(
						'z-[100] origin-[--radix-popover-content-transform-origin] rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
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
