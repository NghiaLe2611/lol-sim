import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STALE_MS, passiveImgUrl, splashChampionImg, skillImgUrl } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import {
	type BonusAbility,
	type BonusAttributeRatings,
	type BonusChampionDetail,
	type BonusModifierRow,
	bonusStatAbbreviation,
	coerceBonusDetail,
	formatAbilityScalar,
	formatCooldownLine,
	formatCostLine,
	formatLevelingModifierLines,
	isBonusNumericStat,
	laneTagsFromPositions,
	roleTokenToBadge,
	shouldShowBonusStatKey,
} from '@/pages/champion-detail/utils';
import { getBonusChampionDetail, getChampionDetail } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { memo, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from 'recharts';

const ABILITY_SLOTS = ['P', 'Q', 'W', 'E', 'R'] as const;

const ATTRIBUTE_RADAR_MAX = 5;

/** First five API attribute ratings → pentagon radar (icons in `public/images/icons/attrs`). */
const ATTRIBUTE_RADAR_DEF = [
	{ key: 'damage', label: 'Damage', icon: '/images/icons/attrs/attack.svg' },
	{ key: 'toughness', label: 'Toughness', icon: '/images/icons/attrs/toughness.svg' },
	{ key: 'control', label: 'Control', icon: '/images/icons/attrs/control.svg' },
	{ key: 'mobility', label: 'Mobility', icon: '/images/icons/attrs/mobility.svg' },
	{ key: 'utility', label: 'Utility', icon: '/images/icons/attrs/utility.svg' },
] as const;

function clampAttributeRadarValue(raw: number): number {
	const n = Number.isFinite(raw) ? raw : 0;
	return Math.min(ATTRIBUTE_RADAR_MAX, Math.max(0, n));
}

function attributeRadarRows(ratings: BonusAttributeRatings | undefined) {
	const r = ratings ?? {};
	return ATTRIBUTE_RADAR_DEF.map(({ key, label }) => ({
		attribute: label,
		value: clampAttributeRadarValue(Number(r[key as keyof BonusAttributeRatings] ?? 0)),
	}));
}

function AttributeAngleIconTick(props: {
	payload?: { value?: string };
	x: number;
	y: number;
	cx: number;
	cy: number;
}) {
	const { payload, x, y, cx, cy } = props;
	const label = payload?.value ?? '';
	const def = ATTRIBUTE_RADAR_DEF.find((d) => d.label === label);
	const icon = def?.icon;
	const fullLabel = def?.label ?? label;

	const dx = x - cx;
	const dy = y - cy;
	const len = Math.hypot(dx, dy) || 1;
	const pad = 26;
	const ox = x + (dx / len) * pad;
	const oy = y + (dy / len) * pad;

	if (!icon) {
		return (
			<text className="fill-muted-foreground" fontSize={11} textAnchor="middle" x={ox} y={oy}>
				{fullLabel}
			</text>
		);
	}

	return (
		<g transform={`translate(${ox}, ${oy})`}>
			<foreignObject height={40} width={40} x={-20} y={-20}>
				<div className="flex h-10 w-10 items-center justify-center">
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<button
								aria-label={fullLabel}
								className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
								type="button"
							>
								<img
									alt={fullLabel}
									className="size-4 lg:size-5 object-contain filter-icon"
									src={icon}
								/>
							</button>
						</TooltipTrigger>
						<TooltipContent
							className="border-border/60 bg-popover text-popover-foreground text-xs"
							side="top"
							sideOffset={8}
						>
							{fullLabel}
						</TooltipContent>
					</Tooltip>
				</div>
			</foreignObject>
		</g>
	);
}

function RadarAttributeVertexDot({
	cx = 0,
	cy = 0,
	payload,
	index = 0,
	hoveredIndex,
	onPointerEnter,
	onPointerLeave,
}: {
	cx?: number;
	cy?: number;
	payload?: { attribute?: string; name?: string; value?: number };
	index?: number;
	hoveredIndex: number | null;
	onPointerEnter: (i: number) => void;
	onPointerLeave: () => void;
}) {
	const label = payload?.attribute ?? payload?.name ?? '';
	const val = payload?.value ?? 0;
	const isHover = hoveredIndex === index;
	const isDim = hoveredIndex !== null && hoveredIndex !== index;
	const fillOp = isDim ? 0.22 : isHover ? 0.52 : 1;

	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>
				<g
					style={{ cursor: 'pointer' }}
					transform={`translate(${cx}, ${cy})`}
					onPointerEnter={() => onPointerEnter(index)}
					onPointerLeave={onPointerLeave}
				>
					<circle className="pointer-events-auto" fill="transparent" r={14} />
					<circle
						className="pointer-events-none"
						fill="var(--hex-gold)"
						fillOpacity={fillOp}
						r={4.5}
						stroke="var(--hex-gold)"
						strokeOpacity={isDim ? 0.35 : isHover ? 0.65 : 1}
						strokeWidth={2}
					/>
				</g>
			</TooltipTrigger>
			<TooltipContent
				className="border-border/60 bg-popover text-popover-foreground text-xs"
				side="top"
				sideOffset={6}
			>
				<span className="font-medium">{label}</span>
				<span className="text-muted-foreground">: {val}</span>
			</TooltipContent>
		</Tooltip>
	);
}

function AttributesRadarChart({ ratings }: { ratings?: BonusAttributeRatings }) {
	const data = attributeRadarRows(ratings);
	const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);

	return (
		<div className="mx-auto aspect-square w-full min-h-[190px] max-w-[250px] sm:min-h-[210px] sm:max-w-[270px] lg:min-h-[initial] lg:max-w-[initial]">
			<ResponsiveContainer width="100%" height="100%">
				<RadarChart cx="50%" cy="50%" data={data} outerRadius="58%">
					<PolarGrid gridType="polygon" stroke="var(--hex-gold)" strokeOpacity={0.45} />
					<PolarAngleAxis
						dataKey="attribute"
						allowDuplicatedCategory={false}
						tick={(tickProps: Record<string, unknown>) => {
							const payload = tickProps.payload as { value?: string } | undefined;
							const tickKey =
								typeof tickProps.index === 'number'
									? `radar-angle-${tickProps.index}`
									: String(payload?.value ?? 'angle-tick');
							return (
								<AttributeAngleIconTick
									key={tickKey}
									cx={tickProps.cx as number}
									cy={tickProps.cy as number}
									payload={payload}
									x={tickProps.x as number}
									y={tickProps.y as number}
								/>
							);
						}}
						tickLine={false}
					/>
					<PolarRadiusAxis
						angle={90}
						axisLine={false}
						domain={[0, ATTRIBUTE_RADAR_MAX]}
						tick={false}
						type="number"
					/>
					<Radar
						dataKey="value"
						dot={(dotProps: {
							cx?: number;
							cy?: number;
							index?: number;
							payload?: { attribute?: string; value?: number };
						}) => {
							const byLabel = ATTRIBUTE_RADAR_DEF.findIndex(
								(d) => d.label === dotProps.payload?.attribute
							);
							const vertex =
								typeof dotProps.index === 'number'
									? dotProps.index
									: byLabel >= 0
										? byLabel
										: 0;
							const dotKey =
								typeof dotProps.index === 'number'
									? `radar-vertex-${dotProps.index}`
									: String(
											dotProps.payload?.attribute ??
												`vertex-${String(vertex)}`
										);
							return (
								<RadarAttributeVertexDot
									key={dotKey}
									cx={dotProps.cx}
									cy={dotProps.cy}
									hoveredIndex={hoveredVertex}
									index={vertex}
									payload={dotProps.payload}
									onPointerEnter={setHoveredVertex}
									onPointerLeave={() => setHoveredVertex(null)}
								/>
							);
						}}
						fill="var(--hex-gold)"
						fillOpacity={hoveredVertex !== null ? 0.22 : 0.42}
						isAnimationActive={false}
						name="Attributes Ratings"
						stroke="var(--hex-gold)"
						strokeOpacity={hoveredVertex !== null ? 0.55 : 1}
						strokeWidth={2}
					/>
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}

type ChampionSpellApi = {
	id: string;
	name: string;
	description: string;
	cooldownBurn: string;
	costBurn: string;
	rangeBurn: string;
	image: { full: string };
};

/** Data Dragon blob (fallback UI). */
export type ChampionDetailApi = {
	id: string;
	key: string;
	name: string;
	title: string;
	lore: string;
	blurb: string;
	tags: string[];
	partype: string;
	info: { attack: number; defense: number; magic: number; difficulty: number };
	stats: Record<string, number>;
	spells: ChampionSpellApi[];
	passive: { name: string; description: string; image: { full: string } };
	releaseDate?: string;
	releasedate?: string;
	released?: string;
};

type ChampionDetailPayload = {
	data: Record<string, ChampionDetailApi>;
};

export function detectAttackRangeType(attackRange: number): 'Ranged' | 'Melee' {
	return attackRange > 200 ? 'Ranged' : 'Melee';
}

function stripLolMarkupToText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.trim();
}

/** Optional release hint from DDRagon quirks. */
function getOptionalReleaseDate(champion: ChampionDetailApi): string | null {
	const v = champion.releaseDate ?? champion.releasedate ?? champion.released ?? null;
	return typeof v === 'string' && v.length > 0 ? v : null;
}

// function AttributeBarRow({ label, value, max }: { label: string; value: number; max?: number }) {
// 	const mx = max ?? 10;
// 	const pct = mx > 0 ? Math.min(100, (Math.max(0, value) / mx) * 100) : 0;
// 	return (
// 		<div>
// 			<div className="mb-1 flex justify-between text-xs lg:text-sm">
// 				<span className="text-muted-foreground uppercase tracking-wider">{label}</span>
// 				<span className="text-hex-gold">{value}</span>
// 			</div>
// 			<div className="h-2 overflow-hidden rounded-full bg-secondary">
// 				<div
// 					className="from-yellow-200 to-hex-gold dark:from-yellow-50 dark:to-yellow-500 h-full bg-gradient-to-r"
// 					style={{ width: `${pct}%` }}
// 				/>
// 			</div>
// 		</div>
// 	);
// }

const STAT_GRID_PRIORITY: readonly string[] = [
	'health',
	'healthRegen',
	'mana',
	'manaRegen',
	'armor',
	'magicResistance',
	'attackDamage',
	'attackSpeed',
	'attackSpeedRatio',
	'movespeed',
	'attackRange',
	'attackCastTime',
	'attackTotalTime',
	'attackDelayOffset',
	'criticalStrikeDamage',
	'gameplayRadius',
];

function sortStatKeys(keys: string[]): string[] {
	const rank = new Map(STAT_GRID_PRIORITY.map((k, i) => [k, i]));
	return [...keys].sort(
		(a, b) => (rank.get(a) ?? 1e6) - (rank.get(b) ?? 1e6) || a.localeCompare(b)
	);
}

function HighlightedAbilityText({ children: text }: { children: string }): ReactNode {
	const pattern =
		/(\bmagic damage\b|\btrue damage\b|\bphysical damage\b|\bbonus movement speed\b|\bmovement speed\b|\bcharm\b|\bvisible\b)/gi;
	const parts = text.split(pattern);
	const cls = (s: string) => {
		const low = s.toLowerCase();
		if (low === 'magic damage') return 'font-medium text-sky-300';
		if (low === 'true damage') return 'font-medium text-neutral-50';
		if (low === 'physical damage') return 'font-medium text-amber-500';
		if (low === 'movement speed' || low === 'bonus movement speed')
			return 'font-medium text-emerald-300';
		if (low === 'visible') return 'font-medium text-yellow-200';
		if (low === 'charm') return 'font-medium text-pink-300';
		return '';
	};
	return (
		<>
			{parts.map((chunk, idx) =>
				idx % 2 === 1 ? (
					<span key={`${idx}-${chunk}`} className={cls(chunk)}>
						{chunk}
					</span>
				) : (
					<span key={`${idx}-${chunk}`}>{chunk}</span>
				)
			)}
		</>
	);
}

function formatLevelingLineColored(line: string): ReactNode {
	const fragments = line.split(/(\(\+[^)]+\))/g).filter(Boolean);
	return (
		<>
			{fragments.map((part, i) =>
				part.startsWith('(+') ? (
					<span key={i} className="text-amber-500">
						{part}
					</span>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</>
	);
}

const LevelingModifierLines = memo(function LevelingModifierLines({
	modifiers,
}: {
	modifiers: BonusModifierRow[];
}) {
	const lines = useMemo(
		() => formatLevelingModifierLines(modifiers),
		// Small, stable ability data — stringify avoids recomputing when parent passes a new array ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[JSON.stringify(modifiers)]
	);
	return (
		<>
			{lines.map((line, li) => (
				<div key={li} className="mb-1 last:mb-0">
					{formatLevelingLineColored(line)}
				</div>
			))}
		</>
	);
});

function buildAbilityDlRows(spell: BonusAbility, championResource?: string) {
	const cost = formatCostLine(spell.cost, championResource ?? spell.resource ?? undefined);
	const cdRaw = formatCooldownLine(spell.cooldown);
	const castTime = formatAbilityScalar(spell.castTime);
	const widthVal = formatAbilityScalar(spell.width);
	const speedVal = formatAbilityScalar(spell.speed);
	const effectR = formatAbilityScalar(spell.effectRadius);
	const tgtRange = formatAbilityScalar(spell.targetRange);

	const rows = [
		{ key: 'Cost', node: cost as ReactNode | null },
		{
			key: 'Cooldown',
			node: cdRaw ? (
				<span>
					{cdRaw}
					{/* {spell.cooldown?.affectedByCdr ? ' (CDR)' : ''} */}
				</span>
			) : null,
		},
		{ key: 'Cast time', node: castTime },
		{ key: 'Target range', node: tgtRange },
		{ key: 'Effect radius', node: effectR },
		{ key: 'Width', node: widthVal },
		{ key: 'Speed', node: speedVal },
	].filter((r) => r.node != null);
	return rows;
}

function AbilityStatStrip({
	spell,
	championResource,
}: {
	spell: BonusAbility;
	championResource?: string;
}) {
	const rows = buildAbilityDlRows(spell, championResource);
	if (rows.length === 0) return null;
	return (
		<dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs xl:text-sm">
			{rows.map(({ key, node }) => (
				<div key={key} className="flex gap-1.5 lowercase">
					<dt className="font-medium whitespace-nowrap text-cyan-600 dark:text-sky-400 uppercase">
						{key}:
					</dt>
					<dd className="normal-case">{node}</dd>
				</div>
			))}
		</dl>
	);
}

function BonusAbilityCard({
	slot,
	spell,
	championResource,
}: {
	slot: (typeof ABILITY_SLOTS)[number];
	spell: BonusAbility;
	championResource?: string;
}) {
	const activeLabel = slot === 'P' ? 'Passive' : 'Active';
	const nameLine = `${spell.name} (${slot === 'P' ? 'Passive' : slot})`;

	return (
		<article className="border-border from-background mb-10 rounded-xl border bg-gradient-to-b to-muted/40 p-5 last:mb-0">
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-baseline gap-2 justify-between">
					{/* text-violet-200 */}
					<h3 className="font-semibold text-lg 3xl:text-xl capitalize">{nameLine}</h3>
					<AbilityStatStrip championResource={championResource} spell={spell} />
				</div>
				{/* {(spell.blurb ?? spell.resource) ? (
					<p className="text-muted-foreground mt-2 text-xs 3xl:text-sm leading-relaxed">
						{spell.blurb}
						{spell.resource ? (
							<span className="ml-2 whitespace-nowrap text-[11px] text-sky-500/90">
								[{spell.resource}]
							</span>
						) : null}
					</p>
				) : null} */}
			</div>

			{spell.effects?.map((eff, ei) => (
				<div
					key={`${spell.name}-eff-${ei}`}
					// border-border/50 border-t
					className="py-2 4xl:py-4 grid gap-6 lg:grid-cols-[4rem,minmax(0,1fr),minmax(0,350px)] lg:gap-6"
				>
					<div className="flex justify-center lg:justify-start">
						{ei === 0 ? (
							<img
								alt=""
								className="size-[56px] rounded-md border border-hex-blue/40 object-cover"
								src={spell.icon}
							/>
						) : // <div className="size-[56px]" aria-hidden />
						null}
					</div>
					<div className="min-w-0 text-xs lg:text-sm leading-relaxed">
						<p className="text-foreground">
							{/* <strong className="tracking-wide">
								{ei === 0 ? `${activeLabel}: ` : null}
							</strong> */}
							<HighlightedAbilityText>{eff.description}</HighlightedAbilityText>
						</p>
					</div>
					{eff.leveling?.length ? (
						// border border-muted-foreground/20
						<div className="rounded-md bg-muted/40 px-3 text-xs lg:text-sm leading-snug">
							{eff.leveling.map((block, bi) => (
								<div key={`${block.attribute}-${bi}`} className="mb-4 last:mb-0">
									<div className="bg-cyan-500/20 rounded-sm px-3 py-1 mb-1 font-medium text-cyan-600 dark:text-sky-400 uppercase tracking-wide">
										{block.attribute}
									</div>
									<LevelingModifierLines modifiers={block.modifiers} />
								</div>
							))}
						</div>
					) : null}
				</div>
			))}
			{/* Notes */}
			{/* {spell.notes && spell.notes !== 'No additional details.' ? (
				<p className="text-muted-foreground mt-6 border-border/60 border-t pt-4 text-xs italic">
					{spell.notes}
				</p>
			) : null} */}
		</article>
	);
}

function BonusStatGrid({ stats }: { stats: BonusChampionDetail['stats'] }) {
	if (!stats) return null;
	const keys = sortStatKeys(Object.keys(stats).filter((k) => shouldShowBonusStatKey(k)));

	return (
		<div className="grid gap-x-10 sm:grid-cols-2">
			{keys.map((key) => {
				const blob = stats[key];
				if (!isBonusNumericStat(blob)) return null;
				const { flat = 0, perLevel = 0, percent = 0, percentPerLevel = 0 } = blob;
				return (
					<BonusStatGridCell
						key={key}
						percentFlat={percent}
						perLevel={perLevel}
						perLevelPct={percentPerLevel}
						statKey={key}
						flat={flat}
					/>
				);
			})}
		</div>
	);
}

function BonusStatGridCell({
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
			`${perLevel >= 0 ? '+' : ''}${Number.isInteger(perLevel) ? perLevel : perLevel}/lvl`
		);
	if (percentFlat != null && percentFlat !== 0)
		extras.push(`${percentFlat >= 0 ? '+' : ''}${percentFlat}%`);
	if (perLevelPct != null && perLevelPct !== 0)
		extras.push(`${perLevelPct >= 0 ? '+' : ''}${perLevelPct}%/lvl`);

	return (
		<div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 py-2 border-border/40 border-b">
			<Tooltip delayDuration={0}>
				<TooltipTrigger asChild>
					<span className="text-muted-foreground hover:cursor-help">{short}</span>
				</TooltipTrigger>
				<TooltipContent className="bg-yellow-700 dark:bg-[#624e1e] text-white select-none pointer-events-none">
					{label}
				</TooltipContent>
			</Tooltip>
			<div className="text-right">
				<span className="text-foreground">
					{Number.isInteger(flat) ? flat : Number(flat).toFixed(3)}
				</span>
				{extras.length ? (
					<span className="text-muted-foreground text-sm"> ({extras.join(', ')})</span>
				) : null}
			</div>
		</div>
	);
}

function ChampionLanePositionTags({ positions }: { positions?: string[] }) {
	const tags = laneTagsFromPositions(positions);
	return (
		<div className="flex min-h-[1.25em] flex-wrap justify-end gap-3">
			{tags.map((t) => (
				<span key={t.key} className="bg-muted/25 inline-flex items-center gap-2">
					<img
						alt=""
						className="filter-icon size-5 shrink-0 object-contain"
						height={20}
						src={t.icon}
						width={20}
					/>
					<span className="font-medium text-foreground text-xs tracking-wide">
						{t.label}
					</span>
				</span>
			))}
		</div>
	);
}

function ChampionBonusInfoRows({ b }: { b: BonusChampionDetail }) {
	const roleBadges = (b.roles ?? []).map(roleTokenToBadge);
	const rowClass =
		'grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-4 py-2.5 max-sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)]';

	return (
		<div className="divide-border/50 text-muted-foreground divide-y text-xs xl:text-sm">
			<div className={rowClass}>
				<span className="font-medium">Release date</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{b.releaseDate ?? ''}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Roles</span>
				<ChampionLanePositionTags positions={b.positions} />
			</div>
			<div className={rowClass}>
				<span className="font-medium">Classes</span>
				<div className="flex min-h-[1.25em] flex-wrap justify-end gap-1">
					{roleBadges.map((tg) => (
						<Badge
							key={tg}
							className="border-hex-gold/40 bg-hex-gold/15 text-hex-gold light:border-hex-gold light:bg-hex-gold light:text-white"
							variant="outline"
						>
							{tg}
						</Badge>
					))}
				</div>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Range type</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{b.attackType ?? ''}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Resource</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{b.resource ?? ''}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Adaptive type</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{b.adaptiveType ?? ''}
				</span>
			</div>
		</div>
	);
}

function ChampionDetailBonusInner({ b }: { b: BonusChampionDetail }) {
	return (
		<div className="mx-auto max-w-container">
			<div className="relative h-96 overflow-hidden 3xl:h-[50vh]">
				<img
					alt={b.name}
					className="h-full w-full object-cover object-top"
					src={splashChampionImg(b.key)}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/25" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<h1 className="display gold-text text-5xl font-medium">{b.name}</h1>
							<p className="text-muted-foreground capitalize italic">{b.title}</p>
						</div>
						{b.lore ? (
							<p className="text-muted-foreground whitespace-pre-line leading-relaxed text-xs lg:text-sm 4xl:text-base">
								{b.lore}
							</p>
						) : null}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 4xl:gap-y-12 px-6 py-8 lg:grid-cols-[60%_1fr]">
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
						Attributes
					</h3>
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
						<ChampionBonusInfoRows b={b} />
						<div className="grid">
							<AttributesRadarChart ratings={b.attributeRatings} />
						</div>
					</div>
				</div>
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
						Base Stats
					</h3>
					<BonusStatGrid stats={b.stats} />
				</div>

				<div className="lg:col-span-full">
					{/* <div className="hex-border rounded-lg p-4 3xl:p-6"> */}
					<h2 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Abilities
					</h2>
					<div>
						{ABILITY_SLOTS.map((slot) => {
							const list = b.abilities?.[slot];
							const spell = list?.[0];
							if (!spell) return null;
							return (
								<BonusAbilityCard
									key={slot}
									slot={slot}
									championResource={b.resource ?? undefined}
									spell={spell}
								/>
							);
						})}
					</div>
					{/* </div> */}
				</div>
			</div>
		</div>
	);
}

function ChampionDetailLegacyContent({
	champion: c,
	patchVersion,
}: {
	champion: ChampionDetailApi;
	patchVersion: string;
}) {
	const rangeLabel = detectAttackRangeType(c.stats.attackrange ?? 0);
	const release = getOptionalReleaseDate(c);

	return (
		<div className="mx-auto max-w-container">
			<div className="relative h-96 overflow-hidden 3xl:h-[50vh]">
				<img
					alt={c.name}
					className="h-full w-full object-cover object-top"
					src={splashChampionImg(c.id)}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="mb-4">
						<div className="mb-2 flex flex-wrap gap-2">
							{c.tags.map((t) => (
								<Badge
									key={t}
									className="border-hex-gold/40 bg-hex-gold/15 text-hex-gold light:border-hex-gold light:bg-hex-gold light:text-white"
									variant="outline"
								>
									{t}
								</Badge>
							))}
						</div>
						<h1 className="display gold-text mb-2 text-5xl font-medium">{c.name}</h1>
						<p className="text-muted-foreground capitalize italic">{c.title}</p>
						{release ? (
							<p className="text-muted-foreground mt-2 text-sm">
								Released: {release}
							</p>
						) : null}
					</div>
					<p className="text-muted-foreground whitespace-pre-line leading-relaxed">
						{c.lore}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 py-8 px-6 lg:grid-cols-2">
				{/* <div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
						Class Profile
					</h3>
					<div className="space-y-3">
						<AttributeBarRow label="Attack" max={10} value={c.info.attack} />
						<AttributeBarRow label="Defense" max={10} value={c.info.defense} />
						<AttributeBarRow label="Magic" max={10} value={c.info.magic} />
						<AttributeBarRow label="Difficulty" max={10} value={c.info.difficulty} />
					</div>
				</div> */}
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
						Base Stats
					</h3>
					<div className="grid grid-cols-2 gap-2 gap-x-8 text-sm">
						<div className="flex justify-between">
							<div className="text-muted-foreground">Health</div>
							<div className="text-right">{c.stats.hp}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Attack Damage</div>
							<div className="text-right">{c.stats.attackdamage}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Attack Speed</div>
							<div className="text-right">{c.stats.attackspeed.toFixed(3)}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Armor</div>
							<div className="text-right">{c.stats.armor}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Magic Resist</div>
							<div className="text-right">{c.stats.spellblock}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Move Speed</div>
							<div className="text-right">{c.stats.movespeed}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Range</div>
							<div className="text-right">{c.stats.attackrange}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Range type</div>
							<div className="text-right">{rangeLabel}</div>
						</div>
					</div>
				</div>

				<div className="space-y-6 lg:col-span-full">
					<div className="hex-border rounded-lg p-6">
						<h2 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
							Abilities
						</h2>
						<div className="space-y-4">
							<div className="flex gap-4">
								<img
									alt=""
									className="h-12 w-12 shrink-0 rounded-md border border-hex-gold/30 object-cover"
									src={passiveImgUrl(patchVersion, c.passive.image.full)}
								/>
								<div className="min-w-0">
									<div className="font-semibold">
										{c.passive.name}
										<span className="text-muted-foreground ml-2 text-sm uppercase">
											Passive
										</span>
									</div>
									<p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
										{stripLolMarkupToText(c.passive.description)}
									</p>
								</div>
							</div>

							{['Q', 'W', 'E', 'R'].map((slot, idx) => {
								const s = c.spells[idx];
								if (!s) return null;
								return (
									<div key={s.id} className="flex gap-4">
										<img
											alt=""
											className="h-12 w-12 shrink-0 rounded-md border border-hex-blue/40 object-cover"
											src={skillImgUrl(patchVersion, s.image.full)}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex flex-wrap items-center font-semibold">
													{s.name}
													<span className="text-muted-foreground ml-2 text-sm font-normal">
														({slot})
													</span>
												</div>
												<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs 3xl:text-sm">
													<span>
														<span className="font-medium">Cost:</span>{' '}
														<span className="text-hex-blue-glow">
															{s.costBurn}
														</span>
													</span>
													<span>
														<span className="font-medium">
															Cooldown:
														</span>{' '}
														<span className="text-hex-gold">
															{s.cooldownBurn}
														</span>
													</span>
													<span>
														<span className="font-medium">Range:</span>{' '}
														<span className="text-foreground">
															{s.rangeBurn}
														</span>
													</span>
												</div>
											</div>
											<p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
												{stripLolMarkupToText(s.description)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function ChampionDetailPage() {
	const { championId = '' } = useParams<{ championId: string }>();
	const { patchVersion: version } = useAppContext();

	const bonusQuery = useQuery({
		queryKey: ['championBonusDetail', championId],
		queryFn: async (): Promise<BonusChampionDetail> => {
			const raw = await getBonusChampionDetail(championId);
			const parsed = coerceBonusDetail(raw);
			if (!parsed) throw new Error('Invalid bonus champion payload');
			return parsed;
		},
		enabled: Boolean(championId),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		retry: false,
	});

	const ddrEnabled = Boolean(version && championId);
	const ddrQuery = useQuery({
		queryKey: ['championDetail', version, championId],
		queryFn: () => getChampionDetail(version!, championId),
		enabled: ddrEnabled,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: ChampionDetailPayload): ChampionDetailApi | null => {
			if (!raw?.data || !championId) return null;
			return raw.data[championId] ?? Object.values(raw.data)[0] ?? null;
		},
	});

	const championDdr = ddrQuery.data ?? null;
	const bonusOk = bonusQuery.data;

	useEffect(() => {
		const name = bonusOk?.name ?? championDdr?.name;
		const title = bonusOk?.title ?? championDdr?.title;
		document.title = name ? (title ? `${name}, ${title}` : name) : 'Champion';
	}, [bonusOk, championDdr]);

	if (!championId) {
		return (
			<div className="p-12 text-center">
				<p className="text-muted-foreground">Champion not specified.</p>
				<Link className="text-hex-gold underline" to="/champions">
					Back to champions
				</Link>
			</div>
		);
	}

	if (bonusQuery.isPending) {
		return (
			<div className="mx-auto max-w-container px-6 py-8">
				<Skeleton className="mb-6 h-80 w-full rounded-lg" />
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-4 lg:col-span-2">
						<Skeleton className="h-40 rounded-lg" />
						<Skeleton className="h-64 rounded-lg" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-56 rounded-lg" />
						<Skeleton className="h-72 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (bonusOk) {
		return <ChampionDetailBonusInner b={bonusOk} />;
	}

	if (!version) {
		return (
			<div className="mx-auto max-w-container px-6 py-12 text-center">
				<Skeleton className="mx-auto h-8 max-w-xs" />
				<p className="text-muted-foreground mt-6 text-sm">Loading patch…</p>
			</div>
		);
	}

	if ((ddrQuery.isFetching || ddrQuery.isPending) && !championDdr) {
		return (
			<div className="mx-auto max-w-container px-6 py-8">
				<Skeleton className="mb-6 h-80 w-full rounded-lg" />
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-4 lg:col-span-2">
						<Skeleton className="h-40 rounded-lg" />
						<Skeleton className="h-64 rounded-lg" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-56 rounded-lg" />
						<Skeleton className="h-72 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (championDdr) {
		return <ChampionDetailLegacyContent champion={championDdr} patchVersion={version} />;
	}

	return (
		<div className="p-12 text-center">
			<p className="text-muted-foreground">Champion not found.</p>
			<Link className="text-hex-gold underline" to="/champions">
				Back to champions
			</Link>
		</div>
	);
}
