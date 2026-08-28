import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { itemImgUrl, STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { useCustomToast } from '@/hooks/useCustomToast';
import { cn } from '@/lib/utils';
import {
	bonusStatAbbreviation,
	type BonusChampionDetail,
} from '@/pages/champion-detail/utils';
import ItemPopover from '@/pages/items/components/ItemPopover';
import type { SrItem } from '@/pages/items/utils';
import {
	getBonusChampionDetail,
	getBonusChampions,
	getChampionSkills,
	getChampions,
} from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import clsx from 'clsx';
import { ArrowLeftRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ROLE_BAR_ITEMS,
	selectBonusPositionsOnly,
	type ChampionRoleFilter,
} from '../champions/role-filter';
import ChampionList from './ChampionList';
import { championsFromQueryData, filterChampionListRows } from './champion-list-filter';
import { buildStatsToShow, type BuildStatRow } from './build-stats-show';
import { computeBuildStats } from './compute-build-stats';
import SimulateComboSection from './SimulateComboSection';
import SimulateItemPickerDialog from './SimulateItemPickerDialog';
import SimulateSkillsSection from './SimulateSkillsSection';
import type { ComboStepKey } from './simulate-combo';
import {
	canSelectSkillRank,
	clampSkillLevels,
	EMPTY_SKILL_LEVELS,
	type SkillKey,
	type SkillLevels,
} from './skill-levels';
import './level-slider.scss';

const EMPTY_BUILD: (string | null)[] = Array(6).fill(null);

type SimulateSide = 'attacker' | 'target';

type SideState = {
	level: number;
	build: (string | null)[];
	skillLevels: SkillLevels;
};

interface SimulateDialogProps {
	attackerId: string | null;
	initialAttackerLevel: number;
	initialAttackerBuild: (string | null)[];
	initialAttackerSkillLevels: SkillLevels;
	itemsById: Record<string, SrItem>;
	srItems: SrItem[];
	hasBonusItems: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type SimulateChampionPanelProps = {
	titleBorderCls: string;
	champions: ReturnType<typeof filterChampionListRows>;
	loading: boolean;
	selectedId: string | null;
	onSelect: (id: string) => void;
	getImageUrl: (championId: string) => string;
	search: string;
	onSearchChange: (value: string) => void;
	activeRole: ChampionRoleFilter;
	onRoleChange: (role: ChampionRoleFilter) => void;
	buildSection: {
		level: number;
		onLevelChange: (level: number) => void;
		statsToShow: BuildStatRow[];
		items: (SrItem | null)[];
		itemsById: Record<string, SrItem>;
		patchVersion: string | null;
		onAddItem: () => void;
		onRemoveItem: (index: number) => void;
	};
	skillsSection: {
		championLevel: number;
		skillLevels: SkillLevels;
		onSkillLevelChange: (skill: SkillKey, rank: number) => void;
		bonusDetail?: BonusChampionDetail | null;
		skillsPayload?: Record<string, unknown>;
		totalAd: number;
		totalAp: number;
		bonusHealth: number;
		accentBorderCls: string;
		accentActiveCls: string;
		bgClass: string;
	};
};

function buildEquippedItems(
	build: (string | null)[],
	itemsById: Record<string, SrItem>
): (SrItem | null)[] {
	return build.map((itemId) => (itemId ? (itemsById[itemId] ?? null) : null));
}

function SimulateBuildSection({
	level,
	onLevelChange,
	statsToShow,
	items,
	itemsById,
	patchVersion,
	onAddItem,
	onRemoveItem,
}: SimulateChampionPanelProps['buildSection']) {
	return (
		<>
			<div className="flex items-center gap-2 bg-card-foreground p-4 rounded-sm border border-input">
				<span className="text-xs text-hex-gold uppercase font-semibold tracking-wider shrink-0">
					Level
				</span>
				<Slider
					value={[level]}
					onValueChange={(val) => onLevelChange(val[0])}
					min={1}
					max={18}
					step={1}
					className="build-level-slider py-2"
				/>
				<span className="ml-4 text-sm 2xl:text-base font-semibold shrink-0">{level}</span>
			</div>

			<div className="bg-card-foreground p-4 rounded-sm border border-input space-y-3">
				<h5 className="text-xs text-hex-gold font-semibold uppercase tracking-wider">
					Stats (Lv {level})
				</h5>
				<div className="grid grid-cols-2 gap-x-4 3xl:gap-x-8 gap-y-2 text-xs">
					{statsToShow.map((item) => {
						const { short, label } = bonusStatAbbreviation(item.key);
						return (
							<div
								key={item.key}
								className="flex justify-between items-center gap-2 py-0.5 border-b border-hex-gold/5 last:border-0"
							>
								<Tooltip delayDuration={0}>
									<TooltipTrigger asChild>
										<span className="text-muted-foreground hover:cursor-help truncate">
											{short}
										</span>
									</TooltipTrigger>
									<TooltipContent className="pointer-events-none select-none bg-yellow-700 text-xs text-white dark:bg-[#624e1e] border border-hex-gold/30">
										{label}
									</TooltipContent>
								</Tooltip>
								<span className={cn('font-semibold shrink-0', item.colorClass)}>
									{item.format(item.value)}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Items */}
			<div className="bg-card-foreground p-4 rounded-sm border border-input space-y-3">
				<h5 className="text-xs text-hex-gold font-semibold uppercase tracking-wider">
					Items
				</h5>
				<div className="flex flex-wrap justify-between gap-2">
					<div className="grid grid-cols-6 gap-2 max-w-max">
						{items.map((item, index) => (
							<div
								key={index}
								className="group relative aspect-square w-10 border border-hex-gold/30 rounded-sm bg-zinc-200 dark:bg-zinc-900/40 p-0.5"
								onContextMenu={(e) => {
									e.preventDefault();
									if (item) onRemoveItem(index);
								}}
							>
								{item && patchVersion ? (
									<>
										<ItemPopover
											item={item}
											itemsById={itemsById}
											showTree={false}
											triggerClassName="w-full h-full"
										>
											<div className="w-full h-full relative flex flex-col items-center justify-center">
												<img
													src={itemImgUrl(patchVersion, item.id)}
													alt={item.name}
													className="w-full h-full object-cover"
												/>
											</div>
										</ItemPopover>
										{/* <button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												onRemoveItem(index);
											}}
											className="hidden group-hover:flex absolute -top-1 -right-1 size-4 rounded-full hover:opacity-95 items-center justify-center bg-red-500/80 text-white z-10"
											title="Remove item"
										>
											<X className="size-2" />
										</button> */}
									</>
								) : null}
							</div>
						))}
					</div>
					<Button
						type="button"
						variant="ghost"
						onClick={onAddItem}
						className="text-xs text-muted-foreground !bg-transparent hover:opacity-80 shrink-0"
					>
						+ Add Item
					</Button>
				</div>
			</div>
		</>
	);
}

function SimulateChampionPanel({
	titleBorderCls,
	champions,
	loading,
	selectedId,
	onSelect,
	getImageUrl,
	search,
	onSearchChange,
	activeRole,
	onRoleChange,
	buildSection,
	skillsSection,
}: SimulateChampionPanelProps) {
	const selectedChampion = champions.find((champ) => champ.id === selectedId);

	return (
		<div className="flex flex-col h-full space-y-3 animate-fade-up min-w-0 duration-75 self-start">
			<div className="relative overflow-hidden h-24 bg-zinc-900 rounded-sm">
				<div className="z-[1] absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10"></div>
				{selectedId ? (
					<img
						alt={`${selectedId}-splash`}
						className="absolute inset-0 w-full h-full object-cover"
						src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedId}_0.jpg`}
						style={{ objectPosition: '55% 20%' }}
					/>
				) : null}
				<div className="z-[2] absolute h-full w-full p-2 flex items-center gap-2">
					<div className="flex items-center gap-2">
						{selectedId ? (
							<img
								alt={`${selectedId}-square`}
								src={getImageUrl(selectedId)}
								className={clsx(
									'size-9 rounded-sm border shadow-sm',
									titleBorderCls
								)}
							/>
						) : (
							<div
								className={clsx(
									'size-9 rounded-sm border bg-zinc-800',
									titleBorderCls
								)}
							/>
						)}
						<span className="text-xs 2xl:text-sm font-medium">
							{selectedChampion?.name ?? 'Select champion'}
						</span>
					</div>
				</div>
			</div>

			<div className="space-y-1.5 mb-2">
				<Input
					placeholder="Search champion..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="bg-card-foreground w-full !text-xs placeholder:dark:text-gray-400 rounded-sm border-input focus-visible:border-hex-gold/50 focus-visible:ring-2 ring-hex-gold/20"
				/>
				<div className="flex gap-2">
					{ROLE_BAR_ITEMS.map((item) => {
						const isActive = activeRole === item.id;
						return (
							<button
								key={item.id}
								type="button"
								title={item.tooltip}
								onClick={() => onRoleChange(item.id)}
								className={clsx(
									item.id === 'All'
										? 'min-h-full w-9 border border-input rounded-sm p-1 text-xs bg-gray-200/70 hover:bg-gray-300 dark:bg-stone-900 hover:dark:bg-zinc-700'
										: 'h-full w-9 border border-input rounded-sm p-1 bg-gray-200/70 hover:bg-gray-300 dark:bg-stone-900 hover:dark:bg-zinc-700 group',
									isActive &&
										'border-hex-gold/50 !bg-zinc-300 dark:!bg-stone-700 text-hex-gold'
								)}
							>
								{item.id === 'All' ? (
									<span className="text-gray-500 dark:text-gray-400">All</span>
								) : (
									<img
										alt={item.tooltip}
										src={item.iconSrc}
										className={clsx(
											'mx-auto brightness-75 dark:brightness-50 group-hover:dark:brightness-100 group-hover:brightness-50',
											isActive && '!brightness-50 dark:!brightness-100'
										)}
										height={20}
										width={20}
									/>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<ChampionList
				champions={champions}
				loading={loading}
				selectedId={selectedId}
				onSelect={onSelect}
				getImageUrl={getImageUrl}
				wrapperCls="h-[320px] border border-input rounded !bg-card-foreground"
				containerCls="lg:!grid-cols-6 2xl:!grid-cols-8 border-none items-start"
				skeletonCount={8}
			/>

			<SimulateBuildSection {...buildSection} />

			<SimulateSkillsSection
				championId={selectedId}
				championLevel={skillsSection.championLevel}
				skillLevels={skillsSection.skillLevels}
				onSkillLevelChange={skillsSection.onSkillLevelChange}
				bonusDetail={skillsSection.bonusDetail}
				skillsPayload={skillsSection.skillsPayload}
				totalAd={skillsSection.totalAd}
				totalAp={skillsSection.totalAp}
				bonusHealth={skillsSection.bonusHealth}
				accentBorderCls={skillsSection.accentBorderCls}
				accentActiveCls={skillsSection.accentActiveCls}
				bgClass={skillsSection.bgClass}
			/>
		</div>
	);
}

function findNextEmptySlot(build: (string | null)[], start = 0): number {
	for (let i = start; i < build.length; i++) {
		if (!build[i]) return i;
	}
	for (let i = 0; i < start; i++) {
		if (!build[i]) return i;
	}
	return Math.min(start, build.length - 1);
}

const SimulateDialog = ({
	attackerId,
	initialAttackerLevel,
	initialAttackerBuild,
	initialAttackerSkillLevels,
	itemsById,
	srItems,
	hasBonusItems,
	open,
	onOpenChange,
}: SimulateDialogProps) => {
	const { patchVersion, isPatchReady } = useAppContext();
	const { showToast } = useCustomToast();

	const [attackerSearch, setAttackerSearch] = useState('');
	const [attackerRole, setAttackerRole] = useState<ChampionRoleFilter>('All');
	const [targetSearch, setTargetSearch] = useState('');
	const [targetRole, setTargetRole] = useState<ChampionRoleFilter>('All');
	const [attackerChampionId, setAttackerChampionId] = useState<string | null>(attackerId);
	const [targetChampionId, setTargetChampionId] = useState<string | null>(null);
	const [attacker, setAttacker] = useState<SideState>({
		level: initialAttackerLevel,
		build: [...initialAttackerBuild],
		skillLevels: clampSkillLevels(initialAttackerSkillLevels, initialAttackerLevel),
	});
	const [target, setTarget] = useState<SideState>({
		level: 1,
		build: [...EMPTY_BUILD],
		skillLevels: { ...EMPTY_SKILL_LEVELS },
	});
	const [itemPickerSide, setItemPickerSide] = useState<SimulateSide | null>(null);
	const [editingSlot, setEditingSlot] = useState(0);
	const [comboSteps, setComboSteps] = useState<ComboStepKey[]>([]);

	const championsQuery = useQuery({
		queryKey: ['champions', patchVersion],
		queryFn: () => getChampions(patchVersion!),
		enabled: isPatchReady,
	});

	const bonusQuery = useQuery({
		queryKey: ['champions_bonus'],
		queryFn: () => getBonusChampions(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const attackerBonusQuery = useQuery({
		queryKey: ['championBonusDetail', attackerChampionId],
		queryFn: () => getBonusChampionDetail(attackerChampionId!) as Promise<BonusChampionDetail>,
		enabled: Boolean(attackerChampionId) && open,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const targetBonusQuery = useQuery({
		queryKey: ['championBonusDetail', targetChampionId],
		queryFn: () => getBonusChampionDetail(targetChampionId!) as Promise<BonusChampionDetail>,
		enabled: Boolean(targetChampionId) && open,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const attackerSkillsQuery = useQuery({
		queryKey: ['champion-skills', attackerChampionId],
		queryFn: () => getChampionSkills(attackerChampionId!),
		enabled: Boolean(attackerChampionId) && open,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const targetSkillsQuery = useQuery({
		queryKey: ['champion-skills', targetChampionId],
		queryFn: () => getChampionSkills(targetChampionId!),
		enabled: Boolean(targetChampionId) && open,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const bonusPositionsMap = useMemo(
		() => selectBonusPositionsOnly(bonusQuery.data),
		[bonusQuery.data]
	);

	const allChampions = useMemo(
		() => championsFromQueryData(championsQuery.data),
		[championsQuery.data]
	);

	const championsById = useMemo(() => championsQuery.data?.data ?? {}, [championsQuery.data]);

	const championsLoading =
		!championsQuery.isError &&
		(!isPatchReady ||
			championsQuery.isPending ||
			(championsQuery.isFetching && championsQuery.data === undefined));

	const filterOptions = useMemo(
		() => ({
			bonusPositionsMap,
			hasBonusData: Boolean(bonusQuery.data),
		}),
		[bonusPositionsMap, bonusQuery.data]
	);

	const filteredAttackers = useMemo(
		() =>
			filterChampionListRows(allChampions, {
				search: attackerSearch,
				role: attackerRole,
				...filterOptions,
			}),
		[allChampions, attackerSearch, attackerRole, filterOptions]
	);

	const filteredTargets = useMemo(
		() =>
			filterChampionListRows(allChampions, {
				search: targetSearch,
				role: targetRole,
				...filterOptions,
			}),
		[allChampions, targetSearch, targetRole, filterOptions]
	);

	const getChampImgUrl = useCallback(
		(champId: string) =>
			`https://ddragon.leagueoflegends.com/cdn/${patchVersion || '14.23.1'}/img/champion/${champId}.png`,
		[patchVersion]
	);

	const attackerStats = useMemo(
		() =>
			computeBuildStats({
				level: attacker.level,
				build: attacker.build,
				itemsById,
				champBonus: attackerBonusQuery.data,
				champDdr: attackerChampionId
					? (championsById[attackerChampionId] as Parameters<
							typeof computeBuildStats
						>[0]['champDdr'])
					: null,
			}),
		[
			attacker.level,
			attacker.build,
			itemsById,
			attackerBonusQuery.data,
			attackerChampionId,
			championsById,
		]
	);

	const targetStats = useMemo(
		() =>
			computeBuildStats({
				level: target.level,
				build: target.build,
				itemsById,
				champBonus: targetBonusQuery.data,
				champDdr: targetChampionId
					? (championsById[targetChampionId] as Parameters<
							typeof computeBuildStats
						>[0]['champDdr'])
					: null,
			}),
		[
			target.level,
			target.build,
			itemsById,
			targetBonusQuery.data,
			targetChampionId,
			championsById,
		]
	);

	const attackerStatsToShow = useMemo(() => buildStatsToShow(attackerStats), [attackerStats]);
	const targetStatsToShow = useMemo(() => buildStatsToShow(targetStats), [targetStats]);

	const attackerItems = useMemo(
		() => buildEquippedItems(attacker.build, itemsById),
		[attacker.build, itemsById]
	);
	const targetItems = useMemo(
		() => buildEquippedItems(target.build, itemsById),
		[target.build, itemsById]
	);

	const activePickerBuild = itemPickerSide === 'target' ? target.build : attacker.build;

	const updateSideBuild = useCallback(
		(side: SimulateSide, updater: (build: (string | null)[]) => (string | null)[]) => {
			const setter = side === 'attacker' ? setAttacker : setTarget;
			setter((prev) => ({ ...prev, build: updater(prev.build) }));
		},
		[]
	);

	const handleOpenItemPicker = useCallback(
		(side: SimulateSide) => {
			const build = side === 'attacker' ? attacker.build : target.build;
			setEditingSlot(findNextEmptySlot(build));
			setItemPickerSide(side);
		},
		[attacker.build, target.build]
	);

	const handleItemSelect = useCallback(
		(itemId: string) => {
			if (!itemPickerSide) return;

			const build = itemPickerSide === 'attacker' ? attacker.build : target.build;
			const selectedItem = itemsById[itemId];

			if (selectedItem?.group) {
				const hasSameGroup = build.some((otherItemId, index) => {
					if (index === editingSlot) return false;
					if (!otherItemId) return false;
					const otherItem = itemsById[otherItemId];
					return otherItem?.group === selectedItem.group;
				});

				if (hasSameGroup) {
					showToast({
						message: `Limited to 1 ${selectedItem.group.toUpperCase()} item.`,
						severity: 'error',
						dedupeKey: `simulate-item-group-${selectedItem.group}`,
					});
					return;
				}
			}

			updateSideBuild(itemPickerSide, (prev) => {
				const next = [...prev];
				next[editingSlot] = itemId;
				setEditingSlot(findNextEmptySlot(next, editingSlot + 1));
				return next;
			});
		},
		[
			itemPickerSide,
			attacker.build,
			target.build,
			itemsById,
			editingSlot,
			showToast,
			updateSideBuild,
		]
	);

	const handleRemoveItem = useCallback(
		(side: SimulateSide, index: number) => {
			updateSideBuild(side, (prev) => {
				const next = [...prev];
				next[index] = null;
				return next;
			});
		},
		[updateSideBuild]
	);

	const handleSkillLevelChange = useCallback(
		(side: SimulateSide, skill: SkillKey, rank: number) => {
			const setter = side === 'attacker' ? setAttacker : setTarget;
			const championLevel = side === 'attacker' ? attacker.level : target.level;
			const skillLevels = side === 'attacker' ? attacker.skillLevels : target.skillLevels;

			if (skillLevels[skill] === rank) {
				setter((prev) => ({
					...prev,
					skillLevels: { ...prev.skillLevels, [skill]: 0 },
				}));
				return;
			}

			if (!canSelectSkillRank(skill, rank, championLevel, skillLevels)) return;

			setter((prev) => ({
				...prev,
				skillLevels: { ...prev.skillLevels, [skill]: rank },
			}));
		},
		[attacker.level, attacker.skillLevels, target.level, target.skillLevels]
	);

	const handleAttackerChampionSelect = useCallback(
		(id: string) => {
			if (id !== attackerChampionId) {
				setAttacker((prev) => ({
					...prev,
					skillLevels: clampSkillLevels(EMPTY_SKILL_LEVELS, prev.level),
				}));
			}
			setAttackerChampionId(id);
		},
		[attackerChampionId]
	);

	const handleTargetChampionSelect = useCallback(
		(id: string) => {
			if (id !== targetChampionId) {
				setTarget((prev) => ({
					...prev,
					skillLevels: clampSkillLevels(EMPTY_SKILL_LEVELS, prev.level),
				}));
			}
			setTargetChampionId(id);
		},
		[targetChampionId]
	);

	useEffect(() => {
		if (!open) return;
		setAttackerChampionId(attackerId);
		setAttacker({
			level: initialAttackerLevel,
			build: [...initialAttackerBuild],
			skillLevels: clampSkillLevels(initialAttackerSkillLevels, initialAttackerLevel),
		});
		setTarget({
			level: 1,
			build: [...EMPTY_BUILD],
			skillLevels: { ...EMPTY_SKILL_LEVELS },
		});
		setAttackerSearch('');
		setAttackerRole('All');
		setTargetSearch('');
		setTargetRole('All');
		setItemPickerSide(null);
		setComboSteps([]);
	}, [open, attackerId, initialAttackerLevel, initialAttackerBuild, initialAttackerSkillLevels]);

	useEffect(() => {
		if (!open || filteredAttackers.length === 0) return;
		if (!attackerChampionId || !filteredAttackers.some((c) => c.id === attackerChampionId)) {
			setAttackerChampionId(filteredAttackers[0].id);
		}
	}, [open, filteredAttackers, attackerChampionId]);

	useEffect(() => {
		if (!open || filteredTargets.length === 0) return;
		if (!targetChampionId || !filteredTargets.some((c) => c.id === targetChampionId)) {
			setTargetChampionId(filteredTargets[0].id);
		}
	}, [open, filteredTargets, targetChampionId]);

	const handleSwapChampions = () => {
		setAttackerChampionId(targetChampionId);
		setTargetChampionId(attackerChampionId);
		setAttacker({
			level: target.level,
			build: [...target.build],
			skillLevels: { ...target.skillLevels },
		});
		setTarget({
			level: attacker.level,
			build: [...attacker.build],
			skillLevels: { ...attacker.skillLevels },
		});
		setComboSteps([]);
	};

	const attackerBonusHealth = Math.max(0, attackerStats.totalHp - attackerStats.baseHp);
	const targetBonusHealth = Math.max(0, targetStats.totalHp - targetStats.baseHp);

	const targetChampionName =
		filteredTargets.find((champ) => champ.id === targetChampionId)?.name ??
		targetChampionId ??
		'Target';

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className="outline:none w-full h-full max-w-[95vw] 2xl:max-w-container max-h-[95vh] gap-3 !ring-0 dark:bg-[#0c0c0c] !border-none shadow-[0_0_10px] shadow-hex-gold/50 overflow-y-auto custom-scrollbar"
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<VisuallyHidden.Root>
						<DialogTitle>Simulate Damage</DialogTitle>
						<DialogDescription>Simulate Damage</DialogDescription>
					</VisuallyHidden.Root>
					<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)] gap-4 pt-8">
						<SimulateChampionPanel
							titleBorderCls="border-blue-500 shadow-blue-500"
							champions={filteredAttackers}
							loading={championsLoading}
							selectedId={attackerChampionId}
							onSelect={handleAttackerChampionSelect}
							getImageUrl={getChampImgUrl}
							search={attackerSearch}
							onSearchChange={setAttackerSearch}
							activeRole={attackerRole}
							onRoleChange={setAttackerRole}
							buildSection={{
								level: attacker.level,
								onLevelChange: (nextLevel) =>
									setAttacker((prev) => ({
										...prev,
										level: nextLevel,
										skillLevels: clampSkillLevels(prev.skillLevels, nextLevel),
									})),
								statsToShow: attackerStatsToShow,
								items: attackerItems,
								itemsById,
								patchVersion,
								onAddItem: () => handleOpenItemPicker('attacker'),
								onRemoveItem: (index) => handleRemoveItem('attacker', index),
							}}
							skillsSection={{
								championLevel: attacker.level,
								skillLevels: attacker.skillLevels,
								onSkillLevelChange: (skill, rank) =>
									handleSkillLevelChange('attacker', skill, rank),
								bonusDetail: attackerBonusQuery.data,
								skillsPayload: attackerSkillsQuery.data,
								totalAd: attackerStats.totalAd,
								totalAp: attackerStats.totalAp,
								bonusHealth: attackerBonusHealth,
								accentBorderCls: 'border-blue-500/50',
								accentActiveCls: 'bg-blue-500',
								bgClass: 'bg-blue-500/10',
							}}
						/>

						<div className="flex-col items-center gap-3 w-full animate-fade-up hidden lg:flex duration-100">
							<div className="h-24 w-full flex flex-col">
								<div className="flex flex-1 items-center gap-3">
									<div className="flex-1 h-px bg-hex-gold/20"></div>
									<div className="text-lg font-bold text-muted-foreground">
										VS
									</div>
									<div className="flex-1 h-px bg-hex-gold/20"></div>
								</div>
								<div className="text-center">
									<Button
										onClick={handleSwapChampions}
										variant="outline"
										className="border-input hover:border-hex-gold/50 text-xs 4xl:text-sm text-muted-foreground bg-transparent hover:bg-transparent"
									>
										<ArrowLeftRight className="!size-3.5" />
										Swap
									</Button>
								</div>
							</div>
							<div className="w-full bg-card-foreground p-4 rounded-sm border border-input">
								<div className="text-xs 2xl:text-sm font-semibold space-x-1 mb-3">
									<span className="text-blue-400">{attackerChampionId}</span>
									<var>→</var>
									<span className="text-red-400">{targetChampionId}</span>
								</div>
								<SimulateComboSection
									attackerChampionId={attackerChampionId}
									targetChampionName={targetChampionName}
									targetMaxHp={targetStats.totalHp}
									attackerLevel={attacker.level}
									attackerSkillLevels={attacker.skillLevels}
									attackerBonusHealth={attackerBonusHealth}
									totalAd={attackerStats.totalAd}
									totalAp={attackerStats.totalAp}
									skillsPayload={attackerSkillsQuery.data}
									bonusDetail={attackerBonusQuery.data}
									comboSteps={comboSteps}
									onComboStepsChange={setComboSteps}
								/>
							</div>
						</div>

						<div className="hidden lg:block self-start">
							<SimulateChampionPanel
								titleBorderCls="border-red-500 shadow-red-500"
								champions={filteredTargets}
								loading={championsLoading}
								selectedId={targetChampionId}
								onSelect={handleTargetChampionSelect}
								getImageUrl={getChampImgUrl}
								search={targetSearch}
								onSearchChange={setTargetSearch}
								activeRole={targetRole}
								onRoleChange={setTargetRole}
								buildSection={{
									level: target.level,
									onLevelChange: (nextLevel) =>
										setTarget((prev) => ({
											...prev,
											level: nextLevel,
											skillLevels: clampSkillLevels(
												prev.skillLevels,
												nextLevel
											),
										})),
									statsToShow: targetStatsToShow,
									items: targetItems,
									itemsById,
									patchVersion,
									onAddItem: () => handleOpenItemPicker('target'),
									onRemoveItem: (index) => handleRemoveItem('target', index),
								}}
								skillsSection={{
									championLevel: target.level,
									skillLevels: target.skillLevels,
									onSkillLevelChange: (skill, rank) =>
										handleSkillLevelChange('target', skill, rank),
									bonusDetail: targetBonusQuery.data,
									skillsPayload: targetSkillsQuery.data,
									totalAd: targetStats.totalAd,
									totalAp: targetStats.totalAp,
									bonusHealth: targetBonusHealth,
									accentBorderCls: 'border-red-500/50',
									accentActiveCls: 'bg-red-500',
									bgClass: 'bg-red-500/10',
								}}
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<SimulateItemPickerDialog
				open={itemPickerSide !== null}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) setItemPickerSide(null);
				}}
				srItems={srItems}
				itemsById={itemsById}
				build={activePickerBuild}
				hasBonusItems={hasBonusItems}
				patchVersion={patchVersion}
				onItemSelect={handleItemSelect}
			/>
		</>
	);
};

export default SimulateDialog;
