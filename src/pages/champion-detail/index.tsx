import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STALE_MS, splashChampionImg } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { riotAbilityVideoUrl } from '@/pages/champion-detail/AbilityVideoDialog';
import {
	type BonusAbility,
	type BonusAttributeRatings,
	type BonusChampionDetail,
	type BonusModifierRow,
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
// import AbilityVideoDialog from '@/pages/champion-detail/AbilityVideoDialog';
import HoverPopover from '@/components/HoverPopover';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DifficultyRating from '@/pages/champion-detail/DifficultyRating';
import { getBonusChampionDetail, getChampionDetail, getChampions } from '@/services/api';
import type {
	ChampionDetailApi,
	ChampionDetailPayload,
	ChampionListRow,
	ChampionsApiPayload,
} from '@/types/champions';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { AudioLines, Search } from 'lucide-react';
import { type ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from 'recharts';
import AbilityPopover from './AbilityPopover';
import BonusStatGridCell from './BonusStatGridCell';
import ChampionDetailFallback from './ChampionDetailFallback';
import ChampionSkinList from './ChampionSkinList';

export type { ChampionDetailApi } from '@/types/champions';

const ABILITY_SLOTS = ['P', 'Q', 'W', 'E', 'R'] as const;
const ATTRIBUTE_RADAR_MAX = 3;

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
					<circle className="pointer-events-auto" fill="transparent" r={12} />
					<circle
						className="pointer-events-none"
						fill="hsl(var(--hex-gold))"
						fillOpacity={fillOp}
						r={3}
						stroke="hsl(var(--hex-gold))"
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
					<PolarGrid gridType="polygon" stroke="hsl(var(--hex-gold))" strokeOpacity={0.45} />
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
						fill="hsl(var(--hex-gold))"
						fillOpacity={hoveredVertex !== null ? 0.22 : 0.42}
						isAnimationActive={false}
						name="Attributes Ratings"
						stroke="hsl(var(--hex-gold))"
						strokeOpacity={hoveredVertex !== null ? 0.55 : 1}
						strokeWidth={2}
					/>
				</RadarChart>
			</ResponsiveContainer>
		</div>
	);
}

export function detectAttackRangeType(attackRange: number): 'Ranged' | 'Melee' {
	return attackRange > 200 ? 'Ranged' : 'Melee';
}

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
		if (low === 'magic damage') return 'font-medium dark:text-sky-300 text-sky-500';
		if (low === 'true damage') return 'font-medium text-neutral-50';
		if (low === 'physical damage') return 'font-medium text-amber-500';
		if (low === 'movement speed' || low === 'bonus movement speed')
			return 'font-medium text-emerald-500 dark:text-emerald-300';
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
				<div key={li} className="font-medium mb-1 pl-3 last:mb-0">
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
		<dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs 2xl:text-sm">
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

function abilityHeading(spell: BonusAbility, slot: (typeof ABILITY_SLOTS)[number]): string {
	return `${spell.name} (${slot === 'P' ? 'Passive' : slot})`;
}

/** Skill label for hover video popover */
function titleForAbilityVideo(spell: BonusAbility, slot: (typeof ABILITY_SLOTS)[number]): string {
	const trimmed = spell.name.trim();
	if (slot === 'P') return trimmed ? abilityHeading(spell, slot) : 'Passive';
	return trimmed || slot;
}

function BonusAbilityEffectsBody({
	slot,
	spell,
	spellSegmentKey,
	videoCaption,
	videoUrl,
}: {
	slot: (typeof ABILITY_SLOTS)[number];
	spell: BonusAbility;
	spellSegmentKey: string;
	videoCaption: string;
	videoUrl: string;
}) {
	return spell.effects?.map((eff, ei) => {
		const effectIconSrc =
			typeof eff.icon === 'string' && eff.icon.trim().length > 0 ? eff.icon.trim() : null;
		const spellIconSrc =
			typeof spell.icon === 'string' && spell.icon.trim().length > 0
				? spell.icon.trim()
				: null;
		const thumbSrc = effectIconSrc ?? (ei === 0 ? spellIconSrc : null);
		const caption = titleForAbilityVideo(spell, slot);
		const canPreview = Boolean(videoUrl.trim());

		const thumbImg = (
			<img
				alt=""
				className="pointer-events-none size-[56px] rounded-md border border-hex-blue/40 object-cover"
				src={thumbSrc ?? ''}
			/>
		);

		return (
			<div
				key={`${spellSegmentKey}-eff-${ei}`}
				className="grid gap-6 py-2 4xl:py-4 lg:grid-cols-[4rem,minmax(0,1fr),minmax(0,350px)] lg:gap-6"
			>
				<div className="flex items-start justify-center lg:justify-start">
					{/* <button
						type="button"
						className="shrink-0 rounded-md border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
						onClick={() => openLegacyAbilityVideo('P', `${c.passive.name} (Passive)`)}
						aria-label="Play passive ability video"
					>
						<img
							alt=""
							className="pointer-events-none h-12 w-12 shrink-0 rounded-md border border-hex-gold/30 object-cover"
							src={passiveImgUrl(patchVersion, c.passive.image.full)}
						/>
					</button> */}
					{thumbSrc && canPreview ? (
						<HoverPopover
							content={({ open }) => (
								<AbilityPopover
									caption={videoCaption}
									isOpen={open}
									src={videoUrl}
								/>
							)}
							contentClassName="rounded-md border-0 bg-transparent p-0 shadow-xl"
						>
							<button
								className="rounded-md border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
								type="button"
								aria-label={`Video preview on hover — ${caption}`}
							>
								{thumbImg}
							</button>
						</HoverPopover>
					) : thumbSrc ? (
						<span aria-hidden>{thumbImg}</span>
					) : null}
				</div>
				<div className="min-w-0 text-xs leading-relaxed 2xl:text-sm">
					<p className="text-foreground">
						<HighlightedAbilityText>{eff.description}</HighlightedAbilityText>
					</p>
				</div>
				{eff.leveling?.length ? (
					<div className="rounded-md bg-muted/40 px-3 text-xs leading-snug 2xl:text-sm">
						{eff.leveling.map((block, bi) => (
							<div key={`${block.attribute}-${bi}`} className="mb-4 last:mb-0">
								<div className="mb-1 rounded-sm bg-cyan-500/20 px-3 py-1 font-medium uppercase tracking-wide text-cyan-600 dark:text-sky-400">
									{block.attribute}
								</div>
								<LevelingModifierLines modifiers={block.modifiers} />
							</div>
						))}
					</div>
				) : null}
			</div>
		);
	});
}

function BonusAbilityCard({
	slot,
	spells,
	championResource,
	championNumericId,
}: {
	slot: (typeof ABILITY_SLOTS)[number];
	spells: BonusAbility[];
	championResource?: string;
	championNumericId?: number | string;
}) {
	const abilityVideoUrl =
		championNumericId != null && String(championNumericId).trim() !== ''
			? riotAbilityVideoUrl(championNumericId, slot)
			: '';

	const primary = spells[0];

	if (!spells.length) return null;

	return (
		<article className="border-border from-background mb-10 rounded-xl border bg-gradient-to-b to-muted/40 p-5 last:mb-0">
			{spells.length === 1 && primary != null ? (
				<>
					<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
						<h3 className="font-semibold text-lg capitalize 3xl:text-xl">
							{abilityHeading(primary, slot)}
						</h3>
						<AbilityStatStrip championResource={championResource} spell={primary} />
					</div>
					{BonusAbilityEffectsBody({
						slot,
						spell: primary,
						spellSegmentKey: primary.name,
						videoCaption: titleForAbilityVideo(primary, slot),
						videoUrl: abilityVideoUrl,
					})}
				</>
			) : (
				<>
					{spells.map((spell, si) => (
						<section
							key={`${spell.name}-${si}`}
							className={si === 0 ? '' : 'border-border/50 mt-8 border-t pt-8'}
						>
							<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
								<h3 className="font-semibold text-lg capitalize 3xl:text-xl">
									{si === 0 ? abilityHeading(spell, slot) : spell.name}
								</h3>
								<AbilityStatStrip
									championResource={championResource}
									spell={spell}
								/>
							</div>
							{BonusAbilityEffectsBody({
								slot,
								spell,
								spellSegmentKey: `${spell.name}-${si}`,
								videoCaption: titleForAbilityVideo(spell, slot),
								videoUrl: abilityVideoUrl,
							})}
						</section>
					))}
				</>
			)}

			{/*
			<AbilityVideoDialog
				open={videoOpen}
				onOpenChange={(open) => {
					setVideoOpen(open);
					if (!open) setVideoTitleOverride(null);
				}}
				title={videoDialogTitle}
				videoUrl={abilityVideoUrl}
			/>
			*/}
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

export function ChampionLanePositionTags({ positions }: { positions?: string[] }) {
	const tags = laneTagsFromPositions(positions);
	return (
		<div className="flex min-h-[1.25em] flex-wrap justify-end gap-2">
			{tags.map((t) => (
				<span key={t.key} className="bg-muted/25 inline-flex items-center gap-1">
					<img
						alt=""
						className="filter-icon size-5 shrink-0 object-contain"
						height={20}
						src={t.icon}
						width={20}
					/>
					<span className="font-medium text-foreground tracking-wide">{t.label}</span>
				</span>
			))}
		</div>
	);
}

export function ChampionClassTags({ tags }: { tags: string[] }) {
	const tagBades = (tags ?? []).map(roleTokenToBadge);
	return tagBades.map((tg) => (
		<Badge
			key={tg}
			className="gap-2 2xl:text-sm border-hex-gold/40 bg-hex-gold/15 text-hex-gold light:border-hex-gold light:bg-hex-gold light:text-white"
			variant="outline"
		>
			{/* <img src={`/images/icons/role_icon_${tg.toLowerCase()}.png`} alt={tg} className="size-5" /> */}
			{tg}
		</Badge>
	));
}

const formatStatValue = (str: string): string => {
	return str
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/\b\w/g, (char) => char.toUpperCase());
};

const rowClass =
	'grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-4 py-2.5 max-sm:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)]';
const mapRegionImg = {
	ionia: 'iona',
	'mount-targon': 'mt_targon',
	'shadow-isles': 'shadow_isles',
};

function ChampionBonusInfoRows({ b }: { b: BonusChampionDetail }) {
	const regionIconSrc =
		b?.faction !== 'unaffiliated'
			? `https://universe.leagueoflegends.com/images/${mapRegionImg[b?.faction?.toLowerCase() as keyof typeof mapRegionImg] ?? b?.faction?.toLowerCase()}_emblem.png`
			: null;
	return (
		<div className="divide-border/50 text-muted-foreground divide-y text-xs 2xl:text-sm">
			<div className={rowClass}>
				<span className="font-medium">Released Date</span>
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
					<ChampionClassTags tags={b.roles || []} />
				</div>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Range Type</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{formatStatValue(b.attackType ?? '')}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Resource</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{formatStatValue(b.resource ?? '')}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Adaptive Type</span>
				<span className="text-foreground min-h-[1.25em] text-right">
					{formatStatValue(b.adaptiveType ?? '')}
				</span>
			</div>
			<div className={rowClass}>
				<span className="font-medium">Store Price</span>
				<div className="ml-auto flex items-center gap-4 text-foreground">
					{b?.price?.blueEssence && (
						<p className="flex items-center gap-1">
							<img
								src="/images/icon-blue.png"
								alt="Blue Essence"
								className="w-4 h-4"
							/>
							{b?.price?.blueEssence}
						</p>
					)}
					{b?.price?.rp && (
						<p className="flex items-center gap-1">
							<img src="/images/icon-rp.png" alt="RP" className="w-4 h-4" />
							{b?.price?.rp}
						</p>
					)}
				</div>
			</div>
			{b?.faction && (
				<div className={rowClass}>
					<span className="font-medium">Region</span>
					<div className="ml-auto">
						<Link
							className="flex items-center gap-2 text-foreground uppercase hover:opacity-80"
							target="_blank"
							to={`https://universe.leagueoflegends.com/en_US/region/${b.faction.toLowerCase()}`}
						>
							{b.faction !== 'unaffiliated' ? (
								<img src={regionIconSrc ?? ''} alt={b.faction} className="size-6" />
							) : null}
							{b.faction !== 'unaffiliated' ? b.faction.replace('-', ' ') : ''}
						</Link>
					</div>
				</div>
			)}
			<div className={`${rowClass} items-center`}>
				<span className="font-medium">Difficulty</span>
				<DifficultyRating rating={b.attributeRatings?.difficulty || 0} />
			</div>
		</div>
	);
}

function championsFromPayload(payload: ChampionsApiPayload): ChampionListRow[] {
	return Object.values(payload.data);
}

function ChampionDetail({ champion }: { champion: BonusChampionDetail }) {
	const navigate = useNavigate();
	const [isOpenSearch, setIsOpenSearch] = useState<boolean>(false);
	const [search, setSearch] = useState('');
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const { patchVersion: version } = useAppContext();

	useEffect(() => {
		setIsOpenSearch(false);
	}, [champion]);

	const { data, isPending, isError } = useQuery({
		queryKey: ['champions'],
		queryFn: () => getChampions(version!),
		enabled: Boolean(version),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const championList = useMemo(() => {
		if (!data || typeof data !== 'object' || !('data' in data)) return [];
		const rows = championsFromPayload(data as ChampionsApiPayload);
		return rows;
	}, [data]);

	const handlePlayVoice = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		const audio = new Audio(
			`https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/${champion.id}.ogg`
		);
		audio.volume = 0.5;
		audio.play().catch(console.error);
		audioRef.current = audio;
	};

	return (
		<div className="mx-auto max-w-container">
			<div className="relative h-96 overflow-hidden 3xl:h-[50vh]">
				<img
					alt={champion.name}
					className="h-full w-full object-cover object-top"
					src={splashChampionImg(champion.key)}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/25" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="inline-flex items-center gap-4 group">
								<h1 className="display gold-text text-5xl font-medium">
									{champion.name}
								</h1>
								<Popover open={isOpenSearch} onOpenChange={setIsOpenSearch}>
									<PopoverTrigger asChild>
										<Search
											size={24}
											className={clsx(
												'cursor-pointer text-hex-gold',
												isOpenSearch
													? 'opacity-100'
													: 'opacity-0 group-hover:opacity-100'
											)}
										/>
									</PopoverTrigger>
									<PopoverContent
										align="start"
										className="w-80 border-none shadow-none"
									>
										<SearchAutocomplete
											getLabel={(c) => c.name}
											getImgUrl={(item) =>
												`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png`
											}
											inputClassName="h-8 w-full shrink-0 py-0 text-sm md:h-10 leading-normal"
											items={championList}
											onChange={setSearch}
											placeholder="Search champions..."
											value={search}
											handleClick={(c) => {
												if (c) navigate(`/champions/${c.id}`);
											}}
											onEnter={(c) => {
												if (c) navigate(`/champions/${c.id}`);
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex items-center gap-4">
								<p className="text-muted-foreground capitalize italic">
									{champion.title}
								</p>
								<span title="Play voice" onClick={handlePlayVoice}>
									<AudioLines className="text-muted-foreground hover:text-foreground hover:cursor-pointer" />
								</span>
								{/* https://wiki.leagueoflegends.com/en-us/Zed/Audio */}
							</div>
						</div>
						{champion.lore ? (
							<p className="text-muted-foreground whitespace-pre-line leading-relaxed text-xs lg:text-sm 4xl:text-base">
								{champion.lore}
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
						<ChampionBonusInfoRows b={champion} />
						<div className="grid">
							<AttributesRadarChart ratings={champion.attributeRatings} />
						</div>
					</div>
				</div>
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg lg:text-xl font-semibold text-hex-gold">
						Base Stats
					</h3>
					<BonusStatGrid stats={champion.stats} />
				</div>

				<div className="lg:col-span-full">
					{/* <div className="hex-border rounded-lg p-4 3xl:p-6"> */}
					<h2 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Abilities
					</h2>
					<div>
						{ABILITY_SLOTS.map((slot) => {
							const list = champion.abilities?.[slot];
							if (!list?.length) return null;

							return (
								<BonusAbilityCard
									key={slot}
									championNumericId={champion.id}
									championResource={champion.resource ?? undefined}
									slot={slot}
									spells={list}
								/>
							);
						})}
					</div>
					{/* </div> */}
				</div>

				<div className="lg:col-span-full">
					<h2 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Champion Skins
					</h2>
					<ChampionSkinList skins={champion.skins} />
				</div>
			</div>
		</div>
	);
}

export default function ChampionDetailPage() {
	const { id = '' } = useParams<{ id: string }>();
	const championId = id.charAt(0).toUpperCase() + id.slice(1);
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
	const bonusData = bonusQuery.data;
	const isPageLoading = bonusQuery.isPending || (!bonusData && ddrEnabled && ddrQuery.isPending);

	const pageTitle = useMemo(() => {
		const name = bonusData?.name ?? championDdr?.name;
		const title = bonusData?.title ?? championDdr?.title;
		return name ? (title ? `${name}, ${title}` : name) : 'Champion';
	}, [bonusData, championDdr]);

	let content: ReactNode;

	if (!version) {
		content = null;
	} else if (!championId) {
		content = (
			<div className="p-12 text-center">
				<p className="text-muted-foreground">Champion not specified.</p>
				<Link className="text-hex-gold underline" to="/champions">
					Back to champions
				</Link>
			</div>
		);
	} else if (isPageLoading) {
		content = (
			<div className="flex min-h-[50vh] items-center justify-center px-6 py-12">
				<Spinner type="default" className="size-10 text-hex-gold" />
			</div>
		);
	} else if (bonusData) {
		content = <ChampionDetail champion={bonusData} />;
	} else if (championDdr) {
		content = <ChampionDetailFallback champion={championDdr} patchVersion={version} />;
	} else {
		content = (
			<div className="p-12 text-center">
				<p className="text-muted-foreground">Champion not found.</p>
				<Link className="text-hex-gold underline" to="/champions">
					Back to champions
				</Link>
			</div>
		);
	}

	return (
		<>
			<Helmet>
				<title>{pageTitle}</title>
			</Helmet>
			{content}
		</>
	);
}
