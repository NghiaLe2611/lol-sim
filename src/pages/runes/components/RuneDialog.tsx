import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import RunePopover from '@/pages/runes/components/RunePopover';
import {
	prepareRuneShortDescHtml,
	runePathIconUrl,
	runePerkImgUrl,
	runePathCardUrl,
	type DdragonRunePath,
} from '@/pages/runes/utils';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import type { ReactNode } from 'react';

type RunePathStyle = {
	color: string;
	textColor: string;
	borderColor: string;
	borderHoverColor: string;
	bgGlow: string;
	glowFilter: string;
	slotNames: string[];
};

const PATH_STYLES: Record<string, RunePathStyle> = {
	Precision: {
		color: '#c89b3c',
		textColor: 'text-[#c89b3c]',
		borderColor: 'border-[#c89b3c]/60',
		borderHoverColor: 'hover:border-[#c89b3c]',
		bgGlow: 'bg-[#c89b3c]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(200,155,60,0.2)]',
		slotNames: ['Keystone', 'Heroism', 'Legend', 'Combat'],
	},
	Domination: {
		color: '#e03e3e',
		textColor: 'text-[#e03e3e]',
		borderColor: 'border-[#e03e3e]/60',
		borderHoverColor: 'hover:border-[#e03e3e]',
		bgGlow: 'bg-[#e03e3e]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(224,62,62,0.2)]',
		slotNames: ['Keystone', 'Malice', 'Tracking', 'Hunter'],
	},
	Sorcery: {
		color: '#9a63f0',
		textColor: 'text-[#9a63f0]',
		borderColor: 'border-[#9a63f0]/60',
		borderHoverColor: 'hover:border-[#9a63f0]',
		bgGlow: 'bg-[#9a63f0]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(154,99,240,0.2)]',
		slotNames: ['Keystone', 'Artifact', 'Excellence', 'Power'],
	},
	Resolve: {
		color: '#2de071',
		textColor: 'text-[#2de071]',
		borderColor: 'border-[#2de071]/60',
		borderHoverColor: 'hover:border-[#2de071]',
		bgGlow: 'bg-[#2de071]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(45,224,113,0.2)]',
		slotNames: ['Keystone', 'Strength', 'Resistance', 'Vitality'],
	},
	Inspiration: {
		color: '#48c4b7',
		textColor: 'text-[#48c4b7]',
		borderColor: 'border-[#48c4b7]/60',
		borderHoverColor: 'hover:border-[#48c4b7]',
		bgGlow: 'bg-[#48c4b7]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(72,196,183,0.2)]',
		slotNames: ['Keystone', 'Contraptions', 'Tomorrow', 'Beyond'],
	},
};

function SlotDivider({ name, style }: { name: string; style: RunePathStyle }) {
	return (
		<div className="relative my-1 flex w-full items-center justify-center py-2">
			<div
				className="pointer-events-none absolute left-0 right-0 flex h-px items-center justify-between bg-hex-gold/20 px-4 sm:px-12"
				// style={{
				// 	backgroundImage: `linear-gradient(to right, transparent, ${style.color}66)`,
				// }}
			></div>
		</div>
	);

	return (
		<div className="relative my-1 flex w-full items-center justify-center py-2">
			{/* Horizontal lines */}
			<div className="pointer-events-none absolute left-0 right-0 flex h-px items-center justify-between px-4 sm:px-12">
				<div
					className="h-px flex-1"
					style={{
						backgroundImage: `linear-gradient(to right, transparent, ${style.color}66)`,
					}}
				/>
				<div className="w-[110px] shrink-0" />
				<div
					className="h-px flex-1"
					style={{
						backgroundImage: `linear-gradient(to left, transparent, ${style.color}66)`,
					}}
				/>
			</div>

			<div
				className="display relative z-10 rounded-sm border px-4 py-0.5 text-center text-[10px] font-bold italic tracking-wider text-white sm:text-[11px]"
				style={{
					backgroundColor: `${style.color}15`,
					borderColor: `${style.color}40`,
				}}
			>
				{name}
			</div>
		</div>
	);
}

function PathMainBanner({ name, style }: { name: string; style: RunePathStyle }) {
	return (
		<div className="relative flex w-full items-center justify-center">
			{/* Left/Right diamond + line */}
			<div className="pointer-events-none absolute left-0 right-0 flex h-px items-center justify-between px-4">
				<div
					className="size-2 rotate-45 border"
					style={{
						borderColor: style.color,
						// backgroundColor: style.color
					}}
				/>
				<div className="mx-2 h-px flex-1" style={{ backgroundColor: `${style.color}40` }} />
				<div className="w-[200px] shrink-0" />
				<div className="mx-2 h-px flex-1" style={{ backgroundColor: `${style.color}40` }} />
				<div
					className="size-2 rotate-45 border"
					style={{
						borderColor: style.color,
						// backgroundColor: style.color
					}}
				/>
			</div>

			{/* Text Banner with border */}
			<div
				className="display relative z-10 border px-8 py-1.5 text-center text-base font-bold uppercase tracking-widest text-white sm:text-lg"
				style={{
					backgroundColor: `${style.color}1a`,
					borderColor: style.color,
					boxShadow: `0 0 10px ${style.color}15`,
				}}
			>
				{name}
			</div>
		</div>
	);
}

type RuneDialogProps = {
	activePath: DdragonRunePath | null;
	onClose: () => void;
};

const RuneDialog = ({ activePath, onClose }: RuneDialogProps) => {
	if (!activePath) return null;

	const style = PATH_STYLES[activePath.key] || {
		color: '#c89b3c',
		textColor: 'text-[#c89b3c]',
		borderColor: 'border-[#c89b3c]/60',
		borderHoverColor: 'hover:border-[#c89b3c]',
		bgGlow: 'bg-[#c89b3c]/5',
		glowFilter: 'shadow-[0_0_15px_rgba(200,155,60,0.2)]',
		slotNames: ['Keystone', 'Slot 1', 'Slot 2', 'Slot 3'],
	};

	return (
		<Dialog open={Boolean(activePath)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				showCloseButton
				className={cn(
					style.borderColor,
					// border-hex-gold
					'max-w-2xl border-2 bg-background p-0 shadow-2xl',
					'max-h-[min(95vh,950px)] overflow-y-auto'
				)}
			>
				<VisuallyHidden.Root>
					<DialogTitle>{activePath.name}</DialogTitle>
					<DialogDescription>Rune tree for {activePath.name}</DialogDescription>
				</VisuallyHidden.Root>

				<div
					className="relative flex min-w-[320px] select-none flex-col items-center bg-background px-4 pb-8 pt-6 sm:min-w-[500px]"
					style={{
						backgroundImage: `url(/public/images/runes/${activePath.key.toLowerCase()}.png)`,
						backgroundSize: 'cover',
						backgroundPosition: '50% 50%',
						backgroundRepeat: 'no-repeat',
					}}
				>
					<img
						alt=""
						className={cn(
							'mb-4 size-12 rounded-full border object-contain p-2',
							style.borderColor
						)}
						style={{
							borderColor: style.color,
							boxShadow: `0 0 15px ${style.color}20`,
						}}
						src={runePathIconUrl(activePath.icon)}
					/>
					<PathMainBanner name={activePath.name} style={style} />
					<div className="mt-10 flex w-full max-w-3xl flex-col gap-6 4xl:mt-16">
						{activePath.slots.map((slot, slotIndex) => {
							const slotName = style.slotNames[slotIndex];
							return (
								<div
									key={`${activePath.key}-slot-${slotIndex}`}
									className="flex flex-col items-center gap-4"
								>
									{slotIndex > 0 && slotName && (
										<SlotDivider name={slotName} style={style} />
									)}
									<div className="flex w-full flex-wrap items-start justify-center gap-4 sm:gap-6">
										{slot.runes.map((rune) => (
											<RunePopover key={rune.id} rune={rune}>
												<button
													type="button"
													className="group flex w-[7.5rem] flex-col items-center gap-2 rounded-sm text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60 sm:w-[8.5rem]"
												>
													<img
														alt=""
														className={cn(
															'shrink-0 rounded-full border-2 bg-black/60 object-cover transition-transform duration-200 group-hover:scale-110',
															slotIndex === 0
																? 'size-14 border-2 sm:size-16'
																: 'size-10 border sm:size-12'
														)}
														style={{
															borderColor: style.color,
															boxShadow:
																slotIndex === 0
																	? `0 0 10px ${style.color}30`
																	: undefined,
														}}
														src={runePerkImgUrl(rune.icon)}
													/>
													<p className="text-xs font-semibold leading-snug text-[#a09b8c] dark:text-foreground sm:text-sm">
														{rune.name}
													</p>
													{/* <p
														className="text-gray-300 dark:text-muted-foreground text-[0.65rem] leading-snug sm:text-xs max-w-[130px] [&_b]:font-semibold [&_b]:text-foreground"
														dangerouslySetInnerHTML={{
															__html: prepareRuneShortDescHtml(
																rune.shortDesc
															),
														}}
													/> */}
												</button>
											</RunePopover>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default RuneDialog;
