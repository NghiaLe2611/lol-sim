import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	runePerkImgUrl,
	stripRuneMarkupToText,
	type DdragonRune,
	type DdragonRunePath,
} from '@/pages/runes/utils';
import RunePopover from './RunePopover';
import './rune-detail.scss';

// ─── Config ───────────────────────────────────────────────────────────────────

const PATH_CFG: Record<string, { color: string; color2: string; gradId: string; shortKey: string }> =
	{
		Precision:   { color: '#c8aa6e', color2: '#aea789', gradId: 'precision',   shortKey: 'p' },
		Domination:  { color: '#d44242', color2: '#dc4747', gradId: 'domination',  shortKey: 'd' },
		Sorcery:     { color: '#9faafc', color2: '#6c75f5', gradId: 'sorcery',     shortKey: 's' },
		Resolve:     { color: '#a1d586', color2: '#a4d08d', gradId: 'resolve',     shortKey: 'r' },
		Inspiration: { color: '#49aab9', color2: '#48b4be', gradId: 'inspiration', shortKey: 'i' },
	};

const PATH_SUBTITLES: Record<string, string> = {
	Precision:   'Improved attacks and sustained damage',
	Domination:  'Burst damage and target access',
	Sorcery:     'Empowered abilities and resource manipulation',
	Resolve:     'Durability and crowd control',
	Inspiration: 'Creative tools and rule bending',
};

function cfgFor(key: string) {
	return PATH_CFG[key] ?? PATH_CFG['Precision']!;
}

function constructKsUrl(pathId: number, ksId: number) {
	return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/perks/images/construct/${pathId}/keystones/${ksId}.png`;
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

function PathCircleBtn({ pathKey, fallbackGradId }: { pathKey?: string, fallbackGradId?: string }) {
	const { shortKey, gradId } = pathKey ? cfgFor(pathKey) : { shortKey: null, gradId: fallbackGradId || 'precision' };
	return (
		<div className="rd-path-btn" aria-hidden>
			<svg className="rd-path-circles" viewBox="0 0 84 84">
				<circle cx="50%" cy="50%" r="43%" fill="none" strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`} className="rd-circ-a" />
				<circle cx="50%" cy="50%" r="43%" fill="none" strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`} className="rd-circ-b" />
				<circle cx="50%" cy="50%" r="43%" fill="none" strokeWidth="2"
					stroke={`url(#rd-c-${gradId})`} className="rd-circ-c" />
			</svg>
			<svg className="rd-path-cup" viewBox="0 0 84 84">
				<circle cx="50%" cy="50%" r="47.6%" fill="none" strokeWidth="2"
					stroke={`url(#rd-cup-${gradId})`} />
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
	isActive?: boolean;
	isSelected?: boolean;
	onClick?: () => void;
	className?: string;
}

function PerkBtn({ gradId, size = 'md', rune, isActive, isSelected, onClick, className }: PerkBtnProps) {
	const gid = `rd-g-${gradId}`;
	const isLg = size === 'lg';
	const arc = isLg ? 'M 31 1.5 A 29.5 29.5 0 0 0 31 60.5' : 'M 23.5 1 A 22.5 22.5 0 0 0 23.5 46';
	const vb  = isLg ? '0 0 62 62' : '0 0 47 47';
	const cx = isLg ? 31 : 23.5;
	const rOuter = isLg ? 29.5 : 22.5;
	const rInner = isLg ? 23.5 : 18;

	return (
		<button
			type="button"
			className={clsx(
				'rd-perk-btn',
				`rd-perk-btn--${size}`,
				isActive && 'rd-perk-btn--active',
				isSelected && 'rd-perk-btn--selected',
				rune && 'rd-perk-btn--has-rune',
				className
			)}
			onClick={onClick}
		>
			{/* Outer gradient ring */}
			<svg className="rd-perk-outer" viewBox={vb} aria-hidden>
				<circle cx={cx} cy={cx} r={rOuter} strokeWidth={isLg ? 3 : 2} fill="none" stroke={`url(#${gid})`} />
			</svg>
			{/* Icon */}
			{rune && (
				<img className="rd-perk-icon" src={runePerkImgUrl(rune.icon)} alt={rune.name} draggable={false} />
			)}
			{/* Inner gradient ring */}
			{rune && (
				<svg className="rd-perk-inner" viewBox={vb} aria-hidden>
					<circle cx={cx} cy={cx} r={rInner} strokeWidth="2" fill="none" stroke={`url(#${gid})`} />
				</svg>
			)}
			{/* Spinner arc (visible only when --active) */}
			<svg className="rd-perk-spinner" viewBox={vb} aria-hidden>
				<path fill="none" strokeLinecap="round" strokeWidth="2" stroke="url(#rd-w)" d={arc} />
				<ellipse cx="50%" cy="1.5" fill="#fff" rx="4" ry="2" />
			</svg>
		</button>
	);
}

// ─── Keystone Flourish separator ────────────────────────────────────────────

function KsFlourish({ gradId, color, color2 }: { gradId: string; color: string; color2: string }) {
	const gradIdLocal = `rd-fl-sep-${gradId}`;
	return (
		<svg className="rd-flourish" viewBox="0 0 286 9" preserveAspectRatio="none" aria-hidden>
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
		<div className="rd-normal-flourish" style={{ '--rd-color': color } as React.CSSProperties} />
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
}: SlotRowProps) {
	const isKs = slotIdx === 0;
	const sel = runes.find(r => r.id === selectedId) ?? null;
	const placeholder = isKs ? 'Select Keystone' : slotIdx === 1 ? 'Select Greater Rune' : 'Select Rune';

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
		<div className={clsx('rd-slot', isKs && 'rd-slot--ks', isOpen && 'rd-slot--open')}>
			{/* Left: progress bar + circle */}
			<div className="rd-slot-l">
				<div className="rd-progress-track rd-progress-track--top">
					<div className={clsx('rd-progress-bar', prevFilled && 'rd-progress-bar--filled')} style={{ '--rd-color': color } as React.CSSProperties} />
				</div>
				{slotIdx < 3 && (
					<div className="rd-progress-track rd-progress-track--bottom">
						<div className={clsx('rd-progress-bar', sel != null && 'rd-progress-bar--filled')} style={{ '--rd-color': color } as React.CSSProperties} />
					</div>
				)}
				<div className="rd-circle-wrap">
					{sel && !isOpen
						? <RunePopover rune={sel} side="right">{circleBtn}</RunePopover>
						: circleBtn
					}
				</div>
			</div>

			{/* Right: drawer or description */}
			<div className="rd-slot-r">
				{isOpen ? (
					<div className={clsx('rd-drawer', isKs && 'rd-drawer--ks')}>
						<div className="rd-drawer-row">
							{runes.map(rune => (
								<RunePopover key={rune.id} rune={rune} side="top">
									<PerkBtn
										gradId={gradId}
										size={isKs ? 'md' : 'sm'}
										rune={rune}
										isSelected={rune.id === selectedId}
										onClick={() => onSelect(rune.id)}
									/>
								</RunePopover>
							))}
						</div>
					</div>
				) : sel ? (
					<div className={clsx('rd-desc', isKs && 'rd-desc--ks')}>
						<div className="rd-desc-name" style={{ color }}>{sel.name.toUpperCase()}</div>
						<p className="rd-desc-text">{stripRuneMarkupToText(sel.shortDesc)}</p>
					</div>
				) : (
					<p className="rd-placeholder">{placeholder}</p>
				)}
			</div>

			{/* Separator at bottom (except for last slot) */}
			{slotIdx < 3 && (
				isKs
					? <KsFlourish gradId={gradId} color={color} color2={color2} />
					: <NormalFlourish color={color} />
			)}
		</div>
	);
}

// ─── Secondary Slot Row ───────────────────────────────────────────────────────

function SecSlotRow({
	runes,
	rowIdx,
	slotIdx,
	selectedId,
	prevFilled,
	isMaxed,
	gradId,
	color,
	onSelect,
}: {
	runes: DdragonRune[];
	rowIdx: number;
	slotIdx: number;
	selectedId: number | undefined;
	prevFilled: boolean;
	isMaxed: boolean;
	gradId: string;
	color: string;
	onSelect: (id: number, rowIdx: number) => void;
}) {
	const sel = runes.find(r => r.id === selectedId);
	const isLast = slotIdx === 2;

	const circleBtn = sel ? (
		<RunePopover rune={sel} side="left">
			<PerkBtn gradId={gradId} size="md" rune={sel} onClick={() => onSelect(sel.id, rowIdx)} />
		</RunePopover>
	) : (
		<PerkBtn gradId={gradId} size="md" isActive={false} />
	);

	return (
		<div className={clsx('rd-slot', isMaxed && !selectedId && 'rd-sec-slot--dimmed')}>
			<div className="rd-slot-l">
				<div className="rd-progress-track rd-progress-track--top">
					<div
						className={clsx('rd-progress-bar', prevFilled && 'rd-progress-bar--filled')}
						style={{ '--rd-color': color } as React.CSSProperties}
					/>
				</div>
				{!isLast && (
					<div className="rd-progress-track rd-progress-track--bottom">
						<div
							className={clsx('rd-progress-bar', sel != null && 'rd-progress-bar--filled')}
							style={{ '--rd-color': color } as React.CSSProperties}
						/>
					</div>
				)}
				<div className="rd-circle-wrap">{circleBtn}</div>
			</div>
			<div className="rd-sec-slot-r">
				<div className="rd-sec-options">
					{runes.map(rune => (
						<RunePopover key={rune.id} rune={rune} side="top">
							<PerkBtn
								gradId={gradId}
								size="sm"
								rune={rune}
								isSelected={rune.id === selectedId}
								onClick={() => onSelect(rune.id, rowIdx)}
								className={isMaxed && rune.id !== selectedId ? 'rd-perk-btn--dimmed' : undefined}
							/>
						</RunePopover>
					))}
				</div>
			</div>
			{!isLast && <NormalFlourish color={color} />}
		</div>
	);
}

function SecSplashRow({
	slotIdx,
	prevFilled,
	gradId,
	color,
}: {
	slotIdx: number;
	prevFilled: boolean;
	gradId: string;
	color: string;
}) {
	const isLast = slotIdx === 1;

	return (
		<div className="rd-splash-row">
			<div className="rd-slot-l">
				<div className="rd-progress-track rd-progress-track--top">
					<div
						className={clsx('rd-progress-bar', prevFilled && 'rd-progress-bar--filled')}
						style={{ '--rd-color': color } as React.CSSProperties}
					/>
				</div>
				{!isLast && (
					<div className="rd-progress-track rd-progress-track--bottom">
						<div className="rd-progress-bar" style={{ '--rd-color': color } as React.CSSProperties} />
					</div>
				)}
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
	activePathData: DdragonRunePath | null;
	allPaths: DdragonRunePath[];
}

export default function RuneDetail({ onClose, activePathData, allPaths }: RuneDetailProps) {
	const [selectedKs,    setSelectedKs]    = useState<number | null>(null);
	const [selectedSlots, setSelectedSlots] = useState<(number | null)[]>([null, null, null]);
	const [openSlot,      setOpenSlot]      = useState<number>(0);
	const [secPathKey,    setSecPathKey]    = useState<string | null>(null);
	const [secSelected,   setSecSelected]   = useState<Record<number, number>>({});

	useEffect(() => { setSecSelected({}); }, [secPathKey]);

	if (!activePathData) return null;

	const cfg      = cfgFor(activePathData.key);
	const subtitle = PATH_SUBTITLES[activePathData.key] ?? '';
	const secPaths = allPaths.filter(p => p.key !== activePathData.key);
	const secData  = allPaths.find(p => p.key === secPathKey) ?? null;

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
		setSecSelected(prev => {
			const next = { ...prev };
			if (next[rowIdx] === runeId) { delete next[rowIdx]; return next; }
			if (rowIdx in next) { next[rowIdx] = runeId; return next; }
			if (Object.keys(next).length >= 2) {
				const oldest = Math.min(...Object.keys(next).map(Number));
				delete next[oldest];
			}
			next[rowIdx] = runeId;
			return next;
		});
	};

	const toggleSlot = (idx: number) => setOpenSlot(prev => prev === idx ? -1 : idx);
	const secCount   = Object.keys(secSelected).length;

	return (
		<div className="rd-root">
			<img className="rd-main-bg" src={`/images/runes/${activePathData.key.toLowerCase()}.png`} alt="" />
			<SvgDefs pathKey={activePathData.key} />
			{secData && <SvgDefs pathKey={secData.key} />}

			{/* Back button */}
			<button
				type="button"
				className="rd-close"
				onClick={onClose}
				aria-label="Back to path selection"
			>
				<Undo2 className="size-4 text-hex-gold/80" />
			</button>

			{/* ── Primary column ─────────────────────────────────────────── */}
			<div className="rd-primary">
				<div className="rd-path-header">
					<PathCircleBtn pathKey={activePathData.key} />
					<div className="rd-path-info">
						<div className="rd-path-name" style={{ color: cfg.color }}>
							{activePathData.name.toUpperCase()}
						</div>
						<p className="rd-path-sub">{subtitle}</p>
					</div>
				</div>

				<div className="rd-slots">
					<SlotRow
						slotIdx={0} runes={ks}
						selectedId={selectedKs} isOpen={openSlot === 0}
						prevFilled={true}
						gradId={cfg.gradId} color={cfg.color} color2={cfg.color2}
						onSelect={handleKsSelect} onToggle={() => toggleSlot(0)}
					/>
					{([s1, s2, s3] as DdragonRune[][]).map((sr, i) => (
						<SlotRow
							key={i + 1}
							slotIdx={i + 1} runes={sr}
							selectedId={selectedSlots[i] ?? null} isOpen={openSlot === i + 1}
							prevFilled={i === 0 ? selectedKs != null : selectedSlots[i - 1] != null}
							gradId={cfg.gradId} color={cfg.color} color2={cfg.color2}
							onSelect={id => handleSlotSelect(i + 1, id)}
							onToggle={() => toggleSlot(i + 1)}
						/>
					))}
				</div>
			</div>

			{/* ── Secondary column ───────────────────────────────────────── */}
			<div className="rd-secondary">
				<Popover.Root>
					<Popover.Trigger asChild>
						<button className="rd-path-header cursor-pointer text-left w-full bg-transparent border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60">
							<PathCircleBtn pathKey={secData?.key} fallbackGradId={cfg.gradId} />
							<div className="rd-path-info">
								<div className="rd-path-name" style={{ color: secData ? cfgFor(secData.key).color : cfg.color }}>
									{secData ? secData.name.toUpperCase() : 'SELECT SECONDARY'}
								</div>
							</div>
						</button>
					</Popover.Trigger>
					<Popover.Portal>
						<Popover.Content side="right" sideOffset={10} className="z-[100] rounded-md border border-border bg-popover p-2 shadow-md">
							<div className="flex gap-2">
								{secPaths.map(p => {
									const sc = cfgFor(p.key);
									return (
										<button
											key={p.key}
											type="button"
											className={clsx('rd-sec-path-btn', secPathKey === p.key && 'rd-sec-path-btn--active')}
											onClick={() => setSecPathKey(prev => prev === p.key ? null : p.key)}
											title={p.name}
										>
											<img src={`/images/runes/icon-${sc.shortKey}-36x36.png`} alt={p.name} draggable={false} />
										</button>
									);
								})}
							</div>
						</Popover.Content>
					</Popover.Portal>
				</Popover.Root>

				<div className="rd-sec-div" />

				{secData ? (
					<div className="rd-sec-slots">
						{([1, 2, 3] as const).map((rowIdx, slotIdx) => {
							const sc = cfgFor(secData.key);
							const rowRunes = secData.slots[rowIdx]?.runes ?? [];
							const prevFilled = slotIdx === 0
								? true
								: secSelected[[1, 2, 3][slotIdx - 1]!] != null;
							return (
								<SecSlotRow
									key={rowIdx}
									runes={rowRunes}
									rowIdx={rowIdx}
									slotIdx={slotIdx}
									selectedId={secSelected[rowIdx]}
									prevFilled={prevFilled}
									isMaxed={secCount >= 2}
									gradId={sc.gradId}
									color={sc.color}
									onSelect={handleSecSelect}
								/>
							);
						})}
					</div>
				) : (
					<div className="rd-splash-rows">
						{[0, 1].map(i => (
							<SecSplashRow
								key={i}
								slotIdx={i}
								prevFilled={i === 0}
								gradId={cfg.gradId}
								color={cfg.color}
							/>
						))}
					</div>
				)}
			</div>

			{/* ── Construct (right panel) ─────────────────────────────────── */}
			<div className="rd-construct">
				<div className="rd-construct-wrap">
					<img
						src={`/images/runes/construct-${cfg.shortKey}.png`}
						alt=""
						className="rd-construct-img"
						draggable={false}
					/>
					<img
						src={`/images/runes/icon-${cfg.shortKey}-36x36.png`}
						alt=""
						className="rd-construct-path-icon"
						draggable={false}
					/>
					{selectedKs && (
						<img
							src={constructKsUrl(activePathData.id, selectedKs)}
							alt=""
							className="rd-construct-ks"
							draggable={false}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
