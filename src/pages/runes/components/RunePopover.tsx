import HoverPopover from '@/components/HoverPopover';
import { runePerkImgUrl, stripRuneMarkupToText, type DdragonRune } from '@/pages/runes/utils';
import type { ReactNode } from 'react';

const POPOVER_CONTENT_CLASS =
	'rounded-none border-hex-gold/50 bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100';

function RuneHoverContent({ rune }: { rune: DdragonRune }) {
	const longText = stripRuneMarkupToText(rune.longDesc);

	return (
		<div className="w-[min(18rem,calc(100vw-2rem))] p-3">
			<div className="flex items-center gap-2">
				<img
					src={runePerkImgUrl(rune.icon)}
					alt={rune.name}
					className="size-12 object-contain rounded-full"
				/>
				<p className="display text-sm font-semibold text-hex-gold lg:text-base">
					{rune.name}
				</p>
			</div>
			<p className="text-foreground mt-2 whitespace-pre-line text-xs leading-relaxed lg:text-sm">
				{longText}
			</p>
		</div>
	);
}

type RunePopoverProps = {
	rune: DdragonRune;
	children: ReactNode;
};

const RunePopover = ({ rune, children }: RunePopoverProps) => {
	return (
		<HoverPopover
			align="center"
			side="right"
			sideOffset={8}
			closeDelayMs={0}
			triggerClassName="inline-flex"
			content={<RuneHoverContent rune={rune} />}
			contentClassName={POPOVER_CONTENT_CLASS}
		>
			{children}
		</HoverPopover>
	);
};

export default RunePopover;
