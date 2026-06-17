import {
	runePerkImgUrl,
	stripRuneMarkupToText,
	type DdragonRune,
	type DdragonRunePath,
} from '@/pages/runes/utils';
import clsx from 'clsx';
import { Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
	isActive,
	isSelected,
	isMuted,
	onClick,
	className,
	static: isStatic,
}: PerkBtnProps) {
	const Tag = isStatic ? 'div' : 'button';
	const gid = `rd-g-${gradId}`;
	const gidOuter = `rd-go-${gradId}`;
	const isLg = size === 'lg';
	const arc = isLg ? 'M 31 1.5 A 29.5 29.5 0 0 0 31 60.5' : 'M 23.5 1 A 22.5 22.5 0 0 0 23.5 46';
	const vb = isLg ? '0 0 62 62' : '0 0 47 47';
	const cx = isLg ? 31 : 23.5;
	const rOuter = isLg ? 29.5 : 22.5;
	const rInner = isLg ? 27.5 : 20.5;

	return (
		<Tag
			{...(isStatic ? {} : { type: 'button' as const })}
			className={clsx(
				'rd-perk-btn',
				`rd-perk-btn--${size}`,
				isActive && 'rd-perk-btn--active',
				isSelected && 'rd-perk-btn--selected',
				rune && 'rd-perk-btn--has-rune',
				isMuted && 'rd-perk-btn--muted',
				className
			)}
			onClick={isStatic ? undefined : onClick}
		>
			<svg className="rd-perk-inner" viewBox={vb} aria-hidden>
				<circle
					cx={cx}
					cy={cx}
					r={rInner}
					strokeWidth="2"
					fill="none"
					stroke={`url(#${gid})`}
				/>
			</svg>
			{rune && (
				<img
					className="rd-perk-icon"
					src={runePerkImgUrl(rune.icon)}
					alt={rune.name}
					draggable={false}
				/>
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
}: {
	fillHeight: string;
	trackHeight: string;
	color: string;
}) {
	return (
		<div className="rd-progress" style={{ height: trackHeight }} aria-hidden>
			<div className="rd-progress-border">
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

			{/* Right: drawer or description */}
			<div className="rd-slot-r">
				{isOpen ? (
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
						</div>
					)
				) : sel ? (
					<div className={clsx('rd-desc', isKs && 'rd-desc--ks')}>
						<div className="rd-desc-name" style={{ color }}>
							{sel.name.toUpperCase()}
						</div>
						<p className={clsx('rd-desc-text', isMobile && 'rd-desc-text--full')}>
							{stripRuneMarkupToText(sel.shortDesc)}
						</p>
					</div>
				) : (
					<p className="rd-placeholder">{placeholder}</p>
				)}
			</div>

			{/* Separator at bottom (except for last slot) */}
			{slotIdx < 3 &&
				(isKs ? (
					<KsFlourish gradId={gradId} color={color} color2={color2} />
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
	const [gridOpen, setGridOpen] = useState(true);

	useEffect(() => {
		if (secPicks.length === 2) {
			setGridOpen(false);
		} else {
			setGridOpen(true);
		}
	}, [secPicks]);

	const getRune = (pick: SecPick | undefined) =>
		pick ? secData.slots[pick.rowIdx]?.runes.find((r) => r.id === pick.runeId) : undefined;

	const getSelectedId = (rowIdx: number) => secPicks.find((p) => p.rowIdx === rowIdx)?.runeId;

	const canToggleGrid = secPicks.length === 2;
	const showGrid = gridOpen || secPicks.length < 2;

	const circleBtn = (slotIdx: number, rune: DdragonRune | undefined) => {
		if (rune) {
			const btn = (
				<PerkBtn
					gradId={sc.gradId}
					size="md"
					rune={rune}
					onClick={canToggleGrid ? () => setGridOpen((prev) => !prev) : undefined}
				/>
			);
			return canToggleGrid || isMobile ? (
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
			{showGrid ? (
				<div className="rd-sec-grid">
					{rows.map((rowIdx) => {
						const rowRunes = secData.slots[rowIdx]?.runes ?? [];
						const selectedId = getSelectedId(rowIdx);
						return (
							<div key={rowIdx}>
								<div className="rd-sec-grid-row">
									{rowRunes.map((rune) => (
										<PerkBtn
											key={rune.id}
											gradId={sc.gradId}
											size="sm"
											rune={rune}
											isSelected={rune.id === selectedId}
											isMuted={selectedId != null && rune.id !== selectedId}
											onClick={() => onSelect(rune.id, rowIdx)}
										/>
									))}
								</div>
								{rowIdx <= 2 && (
									<div
                                        className={clsx("h-[1px] my-4", isMobile && 'hidden')}
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
			) : (
				<div className="rd-sec-summary">
					{secPicks.map((pick, idx) => {
						const rune = getRune(pick);
						if (!rune) return null;
						return (
							<div key={idx} className="rd-sec-summary-row">
								<div className="rd-desc">
									<div className="rd-desc-name" style={{ color: sc.color }}>
										{rune.name.toUpperCase()}
									</div>
									<p
										className={clsx(
											'rd-desc-text',
											isMobile && 'rd-desc-text--full'
										)}
									>
										{stripRuneMarkupToText(rune.shortDesc)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			)}
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
	isMobile?: boolean;
}

export default function RuneDetail({
	onClose,
	onPathChange,
	activePathData,
	allPaths,
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
	const primTrackHeight = '412px';

	const selectedCount = secPicks.length;
	const secFillHeights = ['0px', '90px', '186px'];
	const secFillHeight = secFillHeights[selectedCount] || '0px';
	const secTrackHeight = '186px';
	const splashTrackHeight = '186px';

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

			<div className={clsx(isMobile ? 'rd-mobile-body' :'flex gap-2')}>
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
							<div className="flex gap-2 flex-wrap">
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
								fillHeight="90px"
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
				</div>
			</div>
		</div>
	);
}
