import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { bonusStatAbbreviation } from '@/pages/champion-detail/utils';

export default function BonusStatGridCell({
	statKey,
	flat,
	perLevel,
	percentFlat,
	perLevelPct,
}: {
	statKey: string;
	flat: number;
	perLevel?: number;
	percentFlat?: number;
	perLevelPct?: number;
}) {
	const { short, label } = bonusStatAbbreviation(statKey);

	const extras: string[] = [];
	if (perLevel != null && perLevel !== 0)
		extras.push(
			`${perLevel >= 0 ? '+' : ''}${Number.isInteger(perLevel) ? perLevel : perLevel}/lvl`,
		);
	if (percentFlat != null && percentFlat !== 0)
		extras.push(`${percentFlat >= 0 ? '+' : ''}${percentFlat}%`);
	if (perLevelPct != null && perLevelPct !== 0)
		extras.push(`${perLevelPct >= 0 ? '+' : ''}${perLevelPct}%/lvl`);

	return (
		<div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 border-b border-border/40 py-2 text-xs 2xl:text-sm">
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>
					<span className="text-muted-foreground hover:cursor-help">{short}</span>
				</TooltipTrigger>
				<TooltipContent className="pointer-events-none select-none bg-yellow-700 text-white dark:bg-[#624e1e]">
					{label}
				</TooltipContent>
			</Tooltip>
			<div className="text-right">
				<span className="text-foreground">
					{Number.isInteger(flat) ? flat : Number(flat).toFixed(3)}
				</span>
				{extras.length ? (
					<span className="text-muted-foreground"> ({extras.join(', ')})</span>
				) : null}
			</div>
		</div>
	);
}
