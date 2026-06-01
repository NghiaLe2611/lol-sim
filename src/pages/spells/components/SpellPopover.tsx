import HoverPopover from '@/components/HoverPopover';
import { cn } from '@/lib/utils';
import {
	prepareSummonerDescriptionHtml,
	summonerSpellImgUrl,
	type SummonerSpellView,
} from '@/pages/spells/utils';
import { useAppContext } from '@/contexts/AppContext';
import { Crosshair } from 'lucide-react';
import type { ReactNode } from 'react';

const POPOVER_CONTENT_CLASS =
	'rounded-none border-hex-gold bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100';

function SpellStatRow({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-4 border-t dark:border-[#5a4617]/60 border-[#bb994c]/60 px-3 py-2 text-xs lg:text-sm">
			<span className="font-semibold text-foreground">{label}</span>
			<span className="text-foreground text-right">{value}</span>
		</div>
	);
}

function SpellHoverContent({ spell }: { spell: SummonerSpellView }) {
	const { patchVersion } = useAppContext();
	const descriptionHtml = prepareSummonerDescriptionHtml(spell.description);

	return (
		<div className="w-[min(20rem,calc(100vw-2rem))]">
			<div className="border-b dark:border-[#5a4617] border-[#bb994c] bg-muted/30 px-3 py-2 text-center">
				<p className="display text-sm lg:text-base font-semibold text-hex-gold">
					{spell.name}
				</p>
			</div>

			<div className="flex justify-center border-b dark:border-[#5a4617]/60 border-[#bb994c]/60 p-3">
				<img
					alt={spell.name}
					// className="size-12 shrink-0 border border-[#8a7344]/80 object-cover"
					src={summonerSpellImgUrl(patchVersion as string, spell.id)}
				/>
			</div>

			{descriptionHtml ? (
				<div
					className={cn(
						'border-b dark:border-[#5a4617]/60 border-[#bb994c]/60 p-3',
						'text-foreground leading-relaxed text-xs lg:text-sm',
						'[&_br]:block [&_em]:italic [&_em]:text-muted-foreground',
						'[&_b]:font-semibold [&_strong]:font-semibold'
					)}
					dangerouslySetInnerHTML={{ __html: descriptionHtml }}
				/>
			) : null}

			<div>
				<SpellStatRow
					label="Cooldown"
					value={
						spell.cooldownBurn
							? `${spell.cooldownBurn} second${spell.cooldownBurn === '1' ? '' : 's'}`
							: '—'
					}
				/>
				<SpellStatRow
					label="Range"
					value={
						<span className="inline-flex items-center gap-1">
							{spell.rangeBurn &&
							spell.rangeBurn !== '0' &&
							!/^(global|self)$/i.test(spell.rangeBurn) ? (
								<>
									<Crosshair className="size-3.5 shrink-0 opacity-80" />
									{spell.rangeBurn}
								</>
							) : spell.rangeBurn && /self/i.test(spell.rangeBurn) ? (
								'Self'
							) : (
								'Global'
							)}
						</span>
					}
				/>
				<SpellStatRow label="Summoner level" value={String(spell.summonerLevel)} />
			</div>
		</div>
	);
}

type SpellPopoverProps = {
	children: ReactNode;
	spell: SummonerSpellView;
};

const SpellPopover = ({ children, spell }: SpellPopoverProps) => {
	return (
		<HoverPopover
			align="center"
			side="top"
			sideOffset={8}
			closeDelayMs={0}
			triggerClassName="inline-flex flex-col items-center gap-2"
			content={<SpellHoverContent spell={spell} />}
			contentClassName={POPOVER_CONTENT_CLASS}
		>
			{children}
		</HoverPopover>
	);
};

export default SpellPopover;
