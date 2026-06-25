import {
	runePerkImgUrl,
	runeShardImgUrl,
	stripRuneMarkupToText,
	type DdragonRune,
	type DdragonRunePath,
} from '@/pages/runes/utils';
import type { RuneShardPerk } from '@/services/api';
import clsx from 'clsx';
import { Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import HoverPopover from '@/components/HoverPopover';
import RunePopover from './RunePopover';
import './rune-detail.scss';

// ─── Config ───────────────────────────────────────────────────────────────────

const PATH_CFG: Record<
	string,
	{ color: string; color2: string; gradId: string; shortKey: string }
> = {
	Precision: { color: '#c8aa6e', color2: '#aea789', gradId: 'precision', shortKey: 'p' },
	Domination: { color: '#d44242', color2: '#dc4747', gradId: 'domination', shortKey: 'd' },
	Sorcery: { color: '#9faafc', color2: '#6c75f5', gradId: 'sorcery', shortKey: 's' },
	Resolve: { color: '#a1d586', color2: '#a4d08d', gradId: 'resolve', shortKey: 'r' },
	Inspiration: { color: '#49aab9', color2: '#48b4be', gradId: 'inspiration', shortKey: 'i' },
};

const PATH_SUBTITLES: Record<string, string> = {
	Precision: 'Improved attacks and sustained damage',
	Domination: 'Burst damage and target access',
	Sorcery: 'Empowered abilities and resource manipulation',
	Resolve: 'Durability and crowd control',
	Inspiration: 'Creative tools and rule bending',
};

function cfgFor(key: string) {
	return PATH_CFG[key] ?? PATH_CFG['Precision']!;
}

function constructKsUrl(pathId: number, ksId: number) {
	return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/perks/images/construct/${pathId}/keystones/${ksId}.png`;
}

function secondaryConstructUrl(pathId: number, secondaPathId: number) {
	return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/perks/images/construct/${pathId}/second/${secondaPathId}.png`;
}

// ─── SVG Gradient Defs ────────────────────────────────────────────────────────

function SvgDefs({ pathKey }: { pathKey: string }) {
	const { color, color2, gradId } = cfgFor(pathKey);
	return (
		<svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }} aria-hidden>
			<defs>
				<linearGradient id="rd-w" x1="0" y1="0" x2="0" y2="1">
					<stop stopColor="#fff" stopOpacity={1} offset="0%" />
					<stop stopColor="#fff" stopOpacity={0} offset="100%" />
				</linearGradient>
				<linearGradient id={`rd-g-${gradId}`} x1="0" y1="0" x2="0" y2="1">
					<stop stopColor={color} offset="0%" />
					<stop stopColor={color2} offset="100%" />
				</linearGradient>
				<linearGradient id={`rd-go-${gradId}`} x1="0" y1="0" x2="0" y2="1">
					<stop stopColor={color} stopOpacity={0.45} offset="0%" />
					<stop stopColor={color2} stopOpacity={0.45} offset="100%" />
				</linearGradient>
				<linearGradient id={`rd-c-${gradId}`} x1="1" y1="0.6" x2="0" y2="0">
					<stop stopColor={color} stopOpacity={1} offset="0%" />
					<stop stopColor={color} stopOpacity={0} offset="70%" />
				</linearGradient>
				<linearGradient id={`rd-cup-${gradId}`} x1="0" y1="0" x2="0" y2="1">
					<stop stopColor={color} stopOpacity={0} offset="80%" />
					<stop stopColor={color} stopOpacity={1} offset="100%" />
				</linearGradient>
				<linearGradient id={`rd-fl-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop stopColor={color} stopOpacity={0} offset="0%" />
					<stop stopColor={color} stopOpacity={1} offset="50%" />
					<stop stopColor={color} stopOpacity={0} offset="100%" />
				</linearGradient>
			</defs>
		</svg>
	);
}

// ─── PathCircleButton (animated header circle with path icon) ─────────────────

function PathCircleBtn({ pathKey, fallbackGradId }: { pathKey?: string; fallbackGradId?: string }) {
	const { shortKey, gradId } = pathKey
		? cfgFor(pathKey)
		: { shortKey: null, gradId: fallbackGradId || 'precision' };
	return (
		<div className="rd-path-btn" aria-hidden>
			<svg className="rd-path-circles" viewBox="0 0 84 84">
				<circle
					cx="50%"
					cy="50%"
					r="43%"
					fill="none"
					strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`}
					className="rd-circ-a"
				/>
				<circle
					cx="50%"
					cy="50%"
					r="43%"
					fill="none"
					strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`}
					className="rd-circ-b"
				/>
				<circle
					cx="50%"
					cy="50%"
					r="43%"
					fill="none"
					strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`}
					className="rd-circ-c"
				/>
			</svg>
			<svg className="rd-path-cup" viewBox="0 0 84 84">
				<circle
					cx="42"
					cy="42"
					r="42"
					fill="none"
					strokeWidth="2"
					stroke={`url(#rd-cup-${gradId})`}
				/>
			</svg>
			{shortKey && (
				<img
					src={`/images/runes/icon-${shortKey}-36x36.png`}
					alt=""
					className="rd-path-icon"
					draggable={false}
				/>
			)}
		</div>
	);
}

// ─── PerkCircleButton ────────────────────────────────────────────────────────

type PSize = 'lg' | 'md' | 'sm';

interface PerkBtnProps {
	gradId: string;
	size?: PSize;
	rune?: DdragonRune;
	iconSrc?: string;
	iconAlt?: string;
	isActive?: boolean;
	isSelected?: boolean;
	isMuted?: boolean;
	onClick?: () => void;
	className?: string;
	static?: boolean;
}

function PerkBtn({
	gradId,
	size = 'md',
	rune,
	iconSrc,
	iconAlt,
	isActive,
	isSelected,
	isMuted,
	onClick,
	className,
	static: isStatic,
}: PerkBtnProps) {
	const Tag = isStatic ? 'div' : 'button';
	const gidOuter = `rd-go-${gradId}`;
	const { color, color2 } =
		Object.values(PATH_CFG).find((c) => c.gradId === gradId) ?? PATH_CFG.Precision!;
	const isLg = size === 'lg';
	const arc = isLg ? 'M 31 1.5 A 29.5 29.5 0 0 0 31 60.5' : 'M 23.5 1 A 22.5 22.5 0 0 0 23.5 46';
	const vb = isLg ? '0 0 62 62' : '0 0 47 47';
	const cx = isLg ? 31 : 23.5;
	const rOuter = isLg ? 29.5 : 22.5;
	const imgSrc = rune ? runePerkImgUrl(rune.icon) : iconSrc;
	const imgAlt = rune?.name ?? iconAlt ?? '';

	return (
		<Tag
			{...(isStatic ? {} : { type: 'button' as const })}
			className={clsx(
				'rd-perk-btn',
				`rd-perk-btn--${size}`,
				isActive && 'rd-perk-btn--active',
				isSelected && 'rd-perk-btn--selected',
				(rune || iconSrc) && 'rd-perk-btn--has-rune',
				isMuted && 'rd-perk-btn--muted',
				className
			)}
			style={
				{
					'--rd-perk-c1': color,
					'--rd-perk-c2': color2,
				} as React.CSSProperties
			}
			onClick={isStatic ? undefined : onClick}
		>
			<div className="rd-perk-inner" aria-hidden />
			{imgSrc && (
				<img className="rd-perk-icon" src={imgSrc} alt={imgAlt} draggable={false} />
			)}
			<svg className="rd-perk-outer" viewBox={vb} aria-hidden>
				<circle
					cx={cx}
					cy={cx}
					r={rOuter}
					strokeWidth={isLg ? 3 : 2}
					fill="none"
					stroke={`url(#${gidOuter})`}
				/>
			</svg>
			<svg className="rd-perk-spinner" viewBox={vb} aria-hidden>
				<path
					fill="none"
					strokeLinecap="round"
					strokeWidth="2"
					stroke="url(#rd-w)"
					d={arc}
				/>
				<ellipse cx="50%" cy="1.5" fill="#fff" rx="4" ry="2" />
			</svg>
		</Tag>
	);
}

// ─── Mobile rune list (vertical drawer) ──────────────────────────────────────

function MobileRuneList({
	runes,
	selectedId,
	gradId,
	color,
	isKs,
	onSelect,
}: {
	runes: DdragonRune[];
	selectedId: number | null;
	gradId: string;
	color: string;
	isKs?: boolean;
	onSelect: (id: number) => void;
}) {
	return (
		<div className="rd-mobile-list">
			{runes.map((rune) => (
				<button
					key={rune.id}
					type="button"
					className={clsx(
						'rd-mobile-list-item',
						selectedId === rune.id && 'rd-mobile-list-item--selected',
						selectedId != null && rune.id !== selectedId && 'rd-mobile-list-item--muted'
					)}
					onClick={() => onSelect(rune.id)}
				>
					<PerkBtn
						gradId={gradId}
						size={isKs ? 'md' : 'sm'}
						rune={rune}
						isSelected={rune.id === selectedId}
						isMuted={selectedId != null && rune.id !== selectedId}
						static
					/>
					<div className="rd-desc">
						<div className="rd-desc-name" style={{ color }}>
							{rune.name.toUpperCase()}
						</div>
						<p className="rd-desc-text rd-desc-text--full">
							{stripRuneMarkupToText(rune.shortDesc)}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}

// ─── Keystone Flourish separator ────────────────────────────────────────────

function KsFlourish({
	gradId,
	color,
	color2,
	inline,
}: {
	gradId: string;
	color: string;
	color2: string;
	inline?: boolean;
}) {
	const gradIdLocal = `rd-fl-sep-${gradId}${inline ? '-inline' : ''}`;
	return (
		<svg
			// my-4
			className={clsx('rd-flourish', inline && 'rd-flourish--inline')}
			viewBox="0 0 286 9"
			preserveAspectRatio="none"
			aria-hidden
		>
			<defs>
				<linearGradient id={gradIdLocal} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop stopColor={color2} stopOpacity={0} offset="0%" />
					<stop stopColor={color} stopOpacity={1} offset="50%" />
					<stop stopColor={color2} stopOpacity={0} offset="100%" />
				</linearGradient>
			</defs>
			<path fill="none" stroke={`url(#${gradIdLocal})`} d="M0 4.5h193l4 4" />
			<path fill="none" stroke={`url(#${gradIdLocal})`} d="M286 8.5H62l-7-8H20l-4 4" />
		</svg>
	);
}

function NormalFlourish({ color }: { color: string }) {
	return (
		<div
			className="rd-normal-flourish"
			style={{ '--rd-color': color } as React.CSSProperties}
		/>
	);
}

function ProgressColumn({
	fillHeight,
	trackHeight,
	color,
	connectTop = true,
}: {
	fillHeight: string;
	trackHeight: string;
	color: string;
	connectTop?: boolean;
}) {
	return (
		<div
			className={clsx('rd-progress', !connectTop && 'rd-progress--standalone')}
			style={{ height: trackHeight }}
			aria-hidden
		>
			<div
				className="rd-progress-border"
				style={{ '--rd-color': color } as React.CSSProperties}
			>
				<div className="rd-progress-outer">
					<div className="rd-progress-fill" style={{ height: fillHeight }}>
						<div
							className="rd-progress-highlight"
							style={{ '--rd-color': color } as React.CSSProperties}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Slot Row ────────────────────────────────────────────────────────────────

interface SlotRowProps {
	slotIdx: number;
	runes: DdragonRune[];
	selectedId: number | null;
	isOpen: boolean;
	prevFilled: boolean;
	gradId: string;
	color: string;
	color2: string;
	onSelect: (id: number) => void;
	onToggle: () => void;
	isMobile?: boolean;
}

function SlotRow({
	slotIdx,
	runes,
	selectedId,
	isOpen,
	prevFilled,
	gradId,
	color,
	color2,
	onSelect,
	onToggle,
	isMobile,
}: SlotRowProps) {
	const isKs = slotIdx === 0;
	const sel = runes.find((r) => r.id === selectedId) ?? null;
	const placeholder = isKs
		? 'Select Keystone'
		: slotIdx === 1
			? 'Select Greater Rune'
			: 'Select Rune';

	const circleBtn = (
		<PerkBtn
			gradId={gradId}
			size={isKs ? 'lg' : 'md'}
			rune={sel ?? undefined}
			isActive={isOpen && !sel}
			onClick={onToggle}
		/>
	);

	return (
		<div
			className={clsx(
				'rd-slot',
				isKs && 'rd-slot--ks',
				isOpen && 'rd-slot--open',
				isMobile && 'rd-slot--mobile'
			)}
		>
			<div className="rd-slot-l">
				<div className="rd-circle-wrap">
					{sel && !isOpen && !isMobile ? (
						<RunePopover rune={sel} side="right" triggerClassName="flex">
							{circleBtn}
						</RunePopover>
					) : (
						circleBtn
					)}
				</div>
			</div>

			{/* Right: drawer or placeholder — keep icon row visible after pick */}
			<div className="rd-slot-r">
				{isOpen || sel ? (
					isMobile ? (
						<MobileRuneList
							runes={runes}
							selectedId={selectedId}
							gradId={gradId}
							color={color}
							isKs={isKs}
							onSelect={onSelect}
						/>
					) : (
						<div className={clsx('rd-drawer', isKs && 'rd-drawer--ks')}>
							{isKs && (
								<KsFlourish color={color} color2={color2} gradId={gradId} inline />
							)}
							<div className="rd-drawer-row">
								{runes.map((rune) => (
									<RunePopover key={rune.id} rune={rune} side="top">
										<PerkBtn
											gradId={gradId}
											size={isKs ? 'md' : 'sm'}
											rune={rune}
											isSelected={rune.id === selectedId}
											isMuted={selectedId != null && rune.id !== selectedId}
											onClick={() => onSelect(rune.id)}
										/>
									</RunePopover>
								))}
							</div>
							{isKs && (
								<KsFlourish color={color} color2={color2} gradId={gradId} inline />
							)}
						</div>
					)
				) : (
					<p className="rd-placeholder">{placeholder}</p>
				)}
			</div>

			{/* Separator at bottom (except for last slot) */}
			{slotIdx < 3 &&
				(isKs ? (
					!isOpen && <KsFlourish color={color} color2={color2} gradId={gradId} />
				) : (
					<NormalFlourish color={color} />
				))}
		</div>
	);
}

// ─── Secondary rune grid ─────────────────────────────────────────────────────

type SecPick = { rowIdx: number; runeId: number };

function SecRuneGrid({
	secData,
	secPicks,
	onSelect,
	fillHeight,
	trackHeight,
	isMobile,
}: {
	secData: DdragonRunePath;
	secPicks: SecPick[];
	onSelect: (id: number, rowIdx: number) => void;
	fillHeight: string;
	trackHeight: string;
	isMobile?: boolean;
}) {
	const sc = cfgFor(secData.key);
	const rows = [1, 2, 3] as const;

	const getRune = (pick: SecPick | undefined) =>
		pick ? secData.slots[pick.rowIdx]?.runes.find((r) => r.id === pick.runeId) : undefined;

	const getSelectedId = (rowIdx: number) => secPicks.find((p) => p.rowIdx === rowIdx)?.runeId;

	const circleBtn = (slotIdx: number, rune: DdragonRune | undefined) => {
		if (rune) {
			const btn = <PerkBtn gradId={sc.gradId} size="md" rune={rune} />;
			return isMobile ? (
				btn
			) : (
				<RunePopover rune={rune} side="left" triggerClassName="flex">
					{btn}
				</RunePopover>
			);
		}
		return <PerkBtn gradId={sc.gradId} size="md" />;
	};

	return (
		<div className={clsx('rd-sec-picker', isMobile && 'rd-sec-picker--mobile')}>
			<div className="rd-sec-track-col">
				<ProgressColumn
					fillHeight={fillHeight}
					trackHeight={trackHeight}
					color={sc.color}
				/>
				{[0, 1].map((slotIdx) => (
					<div key={slotIdx} className="rd-sec-track-slot" data-slot={slotIdx}>
						{circleBtn(slotIdx, getRune(secPicks[slotIdx]))}
					</div>
				))}
			</div>
			<div className="rd-sec-grid">
				{rows.map((rowIdx) => {
					const rowRunes = secData.slots[rowIdx]?.runes ?? [];
					const selectedId = getSelectedId(rowIdx);
					return (
						<div key={rowIdx}>
							<div className="rd-sec-grid-row">
								{rowRunes.map((rune) => {
									const btn = (
										<PerkBtn
											gradId={sc.gradId}
											size="sm"
											rune={rune}
											isSelected={rune.id === selectedId}
											isMuted={selectedId != null && rune.id !== selectedId}
											onClick={() => onSelect(rune.id, rowIdx)}
										/>
									);

									if (isMobile) {
										return <div key={rune.id}>{btn}</div>;
									}

									return (
										<RunePopover key={rune.id} rune={rune} side="left">
											{btn}
										</RunePopover>
									);
								})}
							</div>
							{rowIdx <= 2 && (
								<div
									className={clsx('h-[1px] my-4', isMobile && 'hidden')}
									style={
										{
											'--rd-color': sc.color,
											background:
												'linear-gradient(90deg, transparent, var(--rd-color), transparent)',
										} as React.CSSProperties
									}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ShardHoverContent({ shard }: { shard: RuneShardPerk }) {
	const longText = stripRuneMarkupToText(shard.longDesc || shard.shortDesc);

	return (
		<div className="w-[min(18rem,calc(100vw-2rem))] p-3">
			<div className="flex items-center gap-2">
				<img
					src={runeShardImgUrl(shard.iconPath)}
					alt={shard.name}
					className="size-12 rounded-full object-contain"
				/>
				<p className="display text-sm font-semibold text-hex-gold lg:text-base">
					{shard.name}
				</p>
			</div>
			<p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-foreground lg:text-sm">
				{longText}
			</p>
		</div>
	);
}

function RuneShardGrid({
	shards,
	gradId,
	color,
	isMobile,
}: {
	shards: RuneShardPerk[];
	gradId: string;
	color: string;
	isMobile?: boolean;
}) {
	const rows = useMemo(() => {
		const chunked: RuneShardPerk[][] = [];
		for (let i = 0; i < shards.length; i += 3) {
			chunked.push(shards.slice(i, i + 3));
		}
		return chunked;
	}, [shards]);

	const [shardPicks, setShardPicks] = useState<(number | null)[]>(() =>
		Array.from({ length: rows.length }, () => null)
	);

	useEffect(() => {
		setShardPicks(Array.from({ length: rows.length }, () => null));
	}, [rows.length]);

	const shardTrackHeight = '160px';

	const handleSelect = (rowIdx: number, colIdx: number) => {
		setShardPicks((prev) => {
			const next = [...prev];
			next[rowIdx] = prev[rowIdx] === colIdx ? null : colIdx;
			return next;
		});
	};

	const trackBtn = (shard: RuneShardPerk | undefined) => {
		if (!shard) return <PerkBtn gradId={gradId} size="sm" />;
		const btn = (
			<PerkBtn
				gradId={gradId}
				size="sm"
				iconSrc={runeShardImgUrl(shard.iconPath)}
				iconAlt={shard.name}
				isSelected
			/>
		);
		return isMobile ? (
			btn
		) : (
			<HoverPopover
				align="center"
				side="left"
				sideOffset={8}
				closeDelayMs={0}
				triggerClassName="flex"
				content={<ShardHoverContent shard={shard} />}
				contentClassName="rounded-none border-hex-gold/50 bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
			>
				{btn}
			</HoverPopover>
		);
	};

	if (rows.length === 0) return null;

	return (
		<div className={clsx('rd-shard-picker', isMobile && 'rd-shard-picker--mobile')}>
			<div className="rd-shard-track-col">
				<ProgressColumn
					fillHeight={shardTrackHeight}
					trackHeight={shardTrackHeight}
					color={color}
					connectTop={false}
				/>
				{rows.map((row, rowIdx) => {
					const colIdx = shardPicks[rowIdx];
					const selected = colIdx != null ? row[colIdx] : undefined;
					return (
						<div key={rowIdx} className="rd-shard-track-slot" data-slot={rowIdx}>
							{trackBtn(selected)}
						</div>
					);
				})}
			</div>
			<div className="rd-shard-grid">
				{rows.map((row, rowIdx) => {
					const selectedCol = shardPicks[rowIdx];
					return (
						<div key={rowIdx}>
							<div className="rd-shard-grid-row">
								{row.map((shard, colIdx) => {
									const btn = (
										<PerkBtn
											gradId={gradId}
											size="sm"
											iconSrc={runeShardImgUrl(shard.iconPath)}
											iconAlt={shard.name}
											isSelected={selectedCol === colIdx}
											isMuted={selectedCol == null || selectedCol !== colIdx}
											onClick={() => handleSelect(rowIdx, colIdx)}
										/>
									);

									if (isMobile) {
										return <div key={`${rowIdx}-${colIdx}`}>{btn}</div>;
									}

									return (
										<HoverPopover
											key={`${rowIdx}-${colIdx}`}
											align="center"
											side="left"
											sideOffset={8}
											closeDelayMs={0}
											triggerClassName="flex"
											content={<ShardHoverContent shard={shard} />}
											contentClassName="rounded-none border-hex-gold/50 bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
										>
											{btn}
										</HoverPopover>
									);
								})}
							</div>
							{rowIdx < rows.length - 1 && (
								<div
									className={clsx('h-[1px] my-4', isMobile && 'hidden')}
									style={
										{
											'--rd-color': color,
											background:
												'linear-gradient(90deg, transparent, var(--rd-color), transparent)',
										} as React.CSSProperties
									}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function SecSplashRow({
	slotIdx,
	gradId,
	color,
}: {
	slotIdx: number;
	gradId: string;
	color: string;
}) {
	const isLast = slotIdx === 1;

	return (
		<div className="rd-splash-row">
			<div className="rd-slot-l">
				<div className="rd-circle-wrap">
					<PerkBtn gradId={gradId} size="md" isActive={false} />
				</div>
			</div>
			<div className="rd-splash-text">
				<div className="rd-splash-title">SPLASH</div>
				<p className="rd-splash-desc">Select your secondary path above to choose runes</p>
			</div>
			{!isLast && <NormalFlourish color={color} />}
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface RuneDetailProps {
	onClose: () => void;
	onPathChange: (pathKey: string) => void;
	activePathData: DdragonRunePath | null;
	allPaths: DdragonRunePath[];
	runeShards?: RuneShardPerk[];
	isMobile?: boolean;
}

export default function RuneDetail({
	onClose,
	onPathChange,
	activePathData,
	allPaths,
	runeShards = [],
	isMobile,
}: RuneDetailProps) {
	const [selectedKs, setSelectedKs] = useState<number | null>(null);
	const [selectedSlots, setSelectedSlots] = useState<(number | null)[]>([null, null, null]);
	const [openSlot, setOpenSlot] = useState<number>(0);
	const [secPathKey, setSecPathKey] = useState<string | null>(null);
	const [secPicks, setSecPicks] = useState<SecPick[]>([]);
	const [showSecDropdown, setShowSecDropdown] = useState<boolean>(false);
	const [showPrimaryDropdown, setShowPrimaryDropdown] = useState<boolean>(false);

	useEffect(() => {
		setSecPicks([]);
	}, [secPathKey]);

	useEffect(() => {
		if (secPicks.length === 2) {
			setShowSecDropdown(false);
		}
	}, [secPicks]);

	if (!activePathData) return null;

	const cfg = cfgFor(activePathData.key);
	const subtitle = PATH_SUBTITLES[activePathData.key] ?? '';
	const secPaths = allPaths.filter((p) => p.key !== activePathData.key);
	const secData = allPaths.find((p) => p.key === secPathKey) ?? null;

	const ks = activePathData.slots[0]?.runes ?? [];
	const s1 = activePathData.slots[1]?.runes ?? [];
	const s2 = activePathData.slots[2]?.runes ?? [];
	const s3 = activePathData.slots[3]?.runes ?? [];

	const handleKsSelect = (id: number) => {
		setSelectedKs(id);
		setOpenSlot(1);
	};

	const handleSlotSelect = (idx: number, id: number) => {
		const next = [...selectedSlots];
		next[idx - 1] = id;
		setSelectedSlots(next);
		setOpenSlot(idx < 3 ? idx + 1 : -1);
	};

	const handleSecSelect = (runeId: number, rowIdx: number) => {
		setSecPicks((prev) => {
			const k1 = prev[0];
			const k2 = prev[1];

			if (k1?.rowIdx === rowIdx && k1.runeId === runeId) {
				return k2 ? [k2] : [];
			}
			if (k2?.rowIdx === rowIdx && k2.runeId === runeId) {
				return k1 ? [k1] : [];
			}

			const pick = { rowIdx, runeId };

			if (k1?.rowIdx === rowIdx) {
				return k2 ? [pick, k2] : [pick];
			}
			if (k2?.rowIdx === rowIdx) {
				return k1 ? [k1, pick] : [pick];
			}

			if (!k1) return [pick];
			if (!k2) return [k1, pick];
			return [k1, pick];
		});
	};

	const toggleSlot = (idx: number) => setOpenSlot((prev) => (prev === idx ? -1 : idx));

	const handlePrimaryPathSelect = (pathKey: string) => {
		if (pathKey !== activePathData.key) {
			onPathChange(pathKey);
		}
		setShowPrimaryDropdown(false);
	};

	let primLevel = 0;
	if (selectedKs != null) primLevel = 1;
	if (primLevel === 1 && selectedSlots[0] != null) primLevel = 2;
	if (primLevel === 2 && selectedSlots[1] != null) primLevel = 3;
	if (primLevel === 3 && selectedSlots[2] != null) primLevel = 4;
	// const primHeights = [107, 220, 316, 364, 412];
	// const primHeight = `${primHeights[primLevel]}px`;
	const primTrackHeight = '342px';

	const selectedCount = secPicks.length;
	const secFillHeights = ['0px', '74px', '200px'];
	const secFillHeight = secFillHeights[selectedCount] || '0px';
	const secTrackHeight = '200px';
	const splashTrackHeight = '200px';

	const artLayer = (
		<>
			<img
				className="rd-main-bg"
				src={`/images/runes/${activePathData.key.toLowerCase()}.png`}
				alt=""
			/>
			<img
				src={`/images/runes/construct-${cfg.shortKey}.png`}
				alt=""
				className="rd-construct-img"
				draggable={false}
			/>
			{secData && (
				<img
					src={secondaryConstructUrl(activePathData.id, secData.id)}
					alt=""
					className="rd-secondary-construct-img"
					draggable={false}
				/>
			)}
			{selectedKs && (
				<img
					src={constructKsUrl(activePathData.id, selectedKs)}
					alt=""
					className="rd-construct-ks"
					draggable={false}
				/>
			)}
		</>
	);

	return (
		<div className={clsx('rd-root', isMobile && 'rd-root--mobile')}>
			{isMobile ? (
				<div className="rd-mobile-art" aria-hidden>
					{artLayer}
				</div>
			) : (
				artLayer
			)}
			<SvgDefs pathKey={activePathData.key} />
			{secData && <SvgDefs pathKey={secData.key} />}

			{!isMobile && (
				<button
					type="button"
					className="rd-close"
					onClick={onClose}
					aria-label="Back to path selection"
				>
					<Undo2 className="size-4 text-hex-gold/80" />
				</button>
			)}

			<div className={clsx(isMobile ? 'rd-mobile-body' : 'flex gap-2')}>
				{/* ── Primary column ─────────────────────────────────────────── */}
				<div className="rd-primary">
					<div className="rd-primary-header">
						{isMobile ? (
							<div className="rd-path-header">
								<PathCircleBtn pathKey={activePathData.key} />
								<div className="rd-path-info py-2">
									<div className="rd-path-name" style={{ color: cfg.color }}>
										{activePathData.name.toUpperCase()}
									</div>
									<p className="rd-path-sub">{subtitle}</p>
								</div>
							</div>
						) : (
							<>
								<button
									type="button"
									onClick={() => setShowPrimaryDropdown((prev) => !prev)}
									className="rd-path-header cursor-pointer text-left bg-transparent border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
								>
									<PathCircleBtn pathKey={activePathData.key} />
								</button>
								{showPrimaryDropdown ? (
									<div className="rd-path-dropdown items-center">
										{allPaths.map((p) => {
											const pc = cfgFor(p.key);
											return (
												<button
													key={p.key}
													type="button"
													className={clsx(
														'rd-sec-path-btn',
														activePathData.key === p.key &&
															'rd-sec-path-btn--active'
													)}
													onClick={() => handlePrimaryPathSelect(p.key)}
													title={p.name}
												>
													<img
														src={`/images/runes/icon-${pc.shortKey}-36x36.png`}
														alt={p.name}
														draggable={false}
													/>
												</button>
											);
										})}
									</div>
								) : (
									<div className="rd-path-info py-2">
										<div className="rd-path-name" style={{ color: cfg.color }}>
											{activePathData.name.toUpperCase()}
										</div>
										<p className="rd-path-sub">{subtitle}</p>
									</div>
								)}
							</>
						)}
					</div>

					<div className="rd-slots">
						<ProgressColumn
							fillHeight={primTrackHeight}
							trackHeight={primTrackHeight}
							color={cfg.color}
						/>

						{/* Ngọc siêu cấp */}
						<SlotRow
							slotIdx={0}
							runes={ks}
							selectedId={selectedKs}
							isOpen={openSlot === 0}
							prevFilled={true}
							gradId={cfg.gradId}
							color={cfg.color}
							color2={cfg.color2}
							onSelect={handleKsSelect}
							onToggle={() => toggleSlot(0)}
							isMobile={isMobile}
						/>
						{([s1, s2, s3] as DdragonRune[][]).map((sr, i) => (
							<SlotRow
								key={i + 1}
								slotIdx={i + 1}
								runes={sr}
								selectedId={selectedSlots[i] ?? null}
								isOpen={openSlot === i + 1}
								prevFilled={
									i === 0 ? selectedKs != null : selectedSlots[i - 1] != null
								}
								gradId={cfg.gradId}
								color={cfg.color}
								color2={cfg.color2}
								onSelect={(id) => handleSlotSelect(i + 1, id)}
								onToggle={() => toggleSlot(i + 1)}
								isMobile={isMobile}
							/>
						))}
					</div>
				</div>

				{/* ── Secondary column ───────────────────────────────────────── */}
				<div className="rd-secondary">
					<button
						onClick={() => setShowSecDropdown((prev) => !prev)}
						className="rd-path-header cursor-pointer text-left w-full bg-transparent border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
					>
						<PathCircleBtn pathKey={secData?.key} fallbackGradId={cfg.gradId} />
						{showSecDropdown ? (
							<div className="flex gap-4 flex-wrap">
								{secPaths.map((p) => {
									const sc = cfgFor(p.key);
									return (
										<button
											key={p.key}
											type="button"
											className={clsx(
												'rd-sec-path-btn',
												secPathKey === p.key && 'rd-sec-path-btn--active'
											)}
											onClick={(e) => {
												e.stopPropagation();
												setSecPathKey((prev) =>
													prev === p.key ? null : p.key
												);
											}}
											title={p.name}
										>
											<img
												src={`/images/runes/icon-${sc.shortKey}-36x36.png`}
												alt={p.name}
												draggable={false}
											/>
										</button>
									);
								})}
							</div>
						) : (
							<div className="rd-path-info">
								<div
									className="rd-path-name"
									style={{
										color: secData ? cfgFor(secData.key).color : cfg.color,
									}}
								>
									{secData ? secData.name.toUpperCase() : 'SELECT SECONDARY'}
								</div>
								{isMobile && secData && (
									<p className="rd-path-sub">
										{PATH_SUBTITLES[secData.key] ?? ''}
									</p>
								)}
							</div>
						)}
					</button>

					{/* <div className={clsx('rd-sec-div', isMobile && 'rd-sec-div--visible')} /> */}

					{secData ? (
						<SecRuneGrid
							secData={secData}
							secPicks={secPicks}
							onSelect={handleSecSelect}
							fillHeight={secFillHeight}
							trackHeight={secTrackHeight}
							isMobile={isMobile}
						/>
					) : (
						<div className="rd-splash-rows">
							<ProgressColumn
								fillHeight="70px"
								trackHeight={splashTrackHeight}
								color={cfg.color}
							/>
							{[0, 1].map((i) => (
								<SecSplashRow
									key={i}
									slotIdx={i}
									gradId={cfg.gradId}
									color={cfg.color}
								/>
							))}
						</div>
					)}

					{runeShards.length > 0 && (
						<RuneShardGrid
							shards={runeShards}
							gradId={cfg.gradId}
							// color="#c8aa6e"
							color={cfg.color}
							isMobile={isMobile}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
