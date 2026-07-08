import { useAppContext } from '@/contexts/AppContext';
import {
	getBonusChampionDetail,
	getBonusChampions,
	getBonusItems,
	getChampionSkills,
	getChampions,
	getItems,
} from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Coins, Plus, X, Search } from 'lucide-react';
import clsx from 'clsx';
import { matchesChampionRoleFilter, selectBonusPositionsOnly } from '@/pages/champions/role-filter';
import {
	applyBonusToSrItemMap,
	applyBonusToSrItems,
	parseDdragonItemMap,
	parseDdragonItems,
	selectBonusItemsById,
	isBuildableItem,
	matchesBuildCategory,
	ITEM_TAG_FILTERS,
	matchesItemTagFilterForItem,
	type DdragonItemsPayload,
	type SrItem,
} from '@/pages/items/utils';
import { itemImgUrl, STALE_MS } from '@/constants/common';
import ItemPopover from '@/pages/items/components/ItemPopover';
import './level-slider.scss';
import { type ChampionListRow } from '@/types/champions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	BonusAbility,
	bonusStatAbbreviation,
	type BonusChampionDetail,
} from '@/pages/champion-detail/utils';
import { useCustomToast } from '@/hooks/useCustomToast';
import { capitalizeText } from '@/utils/common';
import {
	accumulateItemStatsFromBuild,
	applyItemStatsToChampion,
	BuildComputedStats,
	type ChampionBaseStats,
	type ItemBonusStatBlock,
} from '@/pages/build/item-stats';
import {
	EMPTY_SKILL_LEVELS,
	SKILL_KEYS,
	canLevelSkill,
	clampSkillLevels,
	dotCountForSkill,
	levelUpSkill,
	type SkillKey,
	type SkillLevels,
} from '@/pages/build/skill-levels';
import './build.scss';
import SkillPopover from './SkillPopover';
import { Button } from '@/components/ui/button';
import SimulateDialog from './SimulateDialog';

type HudResourceBarKind = 'mana' | 'energy' | 'shield';

function resolveHudResourceBarKind(
	bonusResource?: string | null,
	ddragonPartype?: string | null
): HudResourceBarKind {
	const raw = (bonusResource ?? ddragonPartype ?? 'MANA').trim();
	const normalized = raw.replace(/_/g, ' ').toLowerCase();

	if (normalized === 'mana') return 'mana';
	if (normalized === 'energy') return 'energy';
	return 'shield';
}

function hudResourceBarClass(kind: HudResourceBarKind): string {
	switch (kind) {
		case 'mana':
			return 'mana-bar';
		case 'energy':
			return 'energy-bar';
		default:
			return 'shield-bar';
	}
}

// Category definition matching standard LoL items
type ItemCategory = 'all' | 'attack' | 'magic' | 'defense' | 'support' | 'boots';

const ITEM_CATEGORIES: { id: ItemCategory; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'attack', label: 'Attack' },
	{ id: 'magic', label: 'Magic' },
	{ id: 'defense', label: 'Defense' },
	{ id: 'support', label: 'Support' },
	{ id: 'boots', label: 'Boots' },
];

// Lane/role filters for champions selection
type ChampLaneFilter = 'ALL' | 'TOP' | 'JG' | 'MID' | 'ADC' | 'SP';

const LANE_FILTERS: { id: ChampLaneFilter; label: string; mappedKey: string }[] = [
	{ id: 'ALL', label: 'All', mappedKey: 'All' },
	{ id: 'TOP', label: 'TOP', mappedKey: 'Top' },
	{ id: 'JG', label: 'JG', mappedKey: 'Jungle' },
	{ id: 'MID', label: 'MID', mappedKey: 'Mid' },
	{ id: 'ADC', label: 'ADC', mappedKey: 'AD' },
	{ id: 'SP', label: 'SP', mappedKey: 'Support' },
];

const OVERVIEW_STAT_KEYS = [
	'attackDamage',
	'abilityPower',
	'armor',
	'magicResistance',
	'attackSpeed',
	'abilityHaste',
	'criticalStrikeChance',
	'movespeed',
] as const;

const STAT_ICON_BASE =
	'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/fonts/texticons/lol/statsicon';

export default function BuildPage() {
	const { patchVersion, isPatchReady } = useAppContext();

	// Champion Select states
	const [championSearch, setChampionSearch] = useState('');
	const [activeLane, setActiveLane] = useState<ChampLaneFilter>('ALL');
	const [selectedChampionId, setSelectedChampionId] = useState<string | null>(null);

	const [level, setLevel] = useState<number>(1);
	const [skillLevels, setSkillLevels] = useState<SkillLevels>(EMPTY_SKILL_LEVELS);

	// Build slots states
	const [build, setBuild] = useState<(string | null)[]>(Array(6).fill(null));
	const [editingSlot, setEditingSlot] = useState<number | null>(0); // Default active Slot 1

	// Item list filter states
	const [itemSearch, setItemSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<ItemCategory>('all');
	const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);

	const [simulateDialogOpen, setSimulateDialogOpen] = useState(false);

	const searchInputRef = useRef<HTMLInputElement>(null);

	const { showToast } = useCustomToast();

	// Fetch Champions list
	const championsQuery = useQuery({
		queryKey: ['champions', patchVersion],
		queryFn: () => getChampions(patchVersion!),
		enabled: isPatchReady,
	});

	// Fetch Champions bonus lane metadata
	const bonusQuery = useQuery({
		queryKey: ['champions_bonus'],
		queryFn: () => getBonusChampions(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	// Fetch Champion detail for selected champion (from DDragon and Meraki)
	const championBonusDetailQuery = useQuery({
		queryKey: ['championBonusDetail', selectedChampionId],
		queryFn: () => getBonusChampionDetail(selectedChampionId!) as Promise<BonusChampionDetail>,
		enabled: Boolean(selectedChampionId),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const championSkillsQuery = useQuery({
		queryKey: ['champion-skills', selectedChampionId],
		queryFn: () => getChampionSkills(selectedChampionId!),
		enabled: Boolean(selectedChampionId),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	// Fetch Items list
	const itemsQuery = useQuery({
		queryKey: ['items', patchVersion],
		queryFn: () => getItems(patchVersion!),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: DdragonItemsPayload) => ({
			items: parseDdragonItems(raw),
			byId: parseDdragonItemMap(raw),
		}),
	});

	// Fetch Items bonus metadata
	const bonusItemsQuery = useQuery({
		queryKey: ['items_bonus'],
		queryFn: () => getBonusItems(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: selectBonusItemsById,
	});

	const bonusPositionsMap = useMemo(() => {
		return selectBonusPositionsOnly(bonusQuery.data);
	}, [bonusQuery.data]);

	const bonusItemsById = useMemo(() => {
		return bonusItemsQuery.data ?? {};
	}, [bonusItemsQuery.data]);

	const hasBonusItems = Boolean(
		bonusItemsQuery.isSuccess && Object.keys(bonusItemsById).length > 0
	);

	const srItems = useMemo(() => {
		const itemsList = itemsQuery.data?.items ?? [];
		return applyBonusToSrItems(itemsList, bonusItemsById);
	}, [itemsQuery.data?.items, bonusItemsById]);

	const itemsById = useMemo(() => {
		const byId = itemsQuery.data?.byId ?? {};
		return applyBonusToSrItemMap(byId, bonusItemsById);
	}, [itemsQuery.data?.byId, bonusItemsById]);

	// Filter champions list based on lane and search term
	const filteredChampions = useMemo(() => {
		const list = Object.values(championsQuery.data?.data || {}) as ChampionListRow[];
		let filtered = list;

		if (championSearch.trim()) {
			const q = championSearch.toLowerCase().trim();
			filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
		}

		if (activeLane !== 'ALL') {
			const mappedLane = LANE_FILTERS.find((lf) => lf.id === activeLane)?.mappedKey || 'All';
			filtered = filtered.filter((c) => {
				const positions = bonusPositionsMap[c.id] || [];
				return matchesChampionRoleFilter(
					mappedLane as any,
					c.tags || [],
					positions,
					Boolean(bonusQuery.data)
				);
			});
		}

		return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
	}, [championsQuery.data, championSearch, activeLane, bonusPositionsMap, bonusQuery.data]);

	const championsGridLoading =
		!championsQuery.isError &&
		(!isPatchReady ||
			championsQuery.isPending ||
			(championsQuery.isFetching && championsQuery.data === undefined));

	// Automatically select the first champion on load
	useEffect(() => {
		if (filteredChampions.length > 0 && !selectedChampionId) {
			setSelectedChampionId(filteredChampions[0].id);
		}
	}, [filteredChampions, selectedChampionId]);

	useEffect(() => {
		setSkillLevels(EMPTY_SKILL_LEVELS);
	}, [selectedChampionId]);

	useEffect(() => {
		setSkillLevels((prev) => clampSkillLevels(prev, level));
	}, [level]);

	const currentChampDdr = useMemo(() => {
		if (!selectedChampionId) return null;
		return (championsQuery.data?.data || {})[selectedChampionId];
	}, [championsQuery.data, selectedChampionId]);

	const currentChampBonus = championBonusDetailQuery.data;

	const handleSkillLevelUp = (skill: SkillKey) => {
		setSkillLevels((prev) => levelUpSkill(skill, prev, level));
	};

	const resourceBarClass = useMemo(
		() =>
			hudResourceBarClass(
				resolveHudResourceBarKind(
					currentChampBonus?.resource ?? null,
					typeof (currentChampDdr as { partype?: string } | null)?.partype === 'string'
						? (currentChampDdr as { partype: string }).partype
						: null
				)
			),
		[currentChampBonus?.resource, currentChampDdr]
	);

	// Dynamically compute counts for item categories
	const itemCategoryCounts = useMemo(() => {
		const buildableItems = srItems.filter(isBuildableItem);
		return {
			all: buildableItems.length,
			attack: buildableItems.filter((item) => matchesBuildCategory('attack', item.tags))
				.length,
			magic: buildableItems.filter((item) => matchesBuildCategory('magic', item.tags)).length,
			defense: buildableItems.filter((item) => matchesBuildCategory('defense', item.tags))
				.length,
			support: buildableItems.filter((item) => matchesBuildCategory('support', item.tags))
				.length,
			boots: buildableItems.filter((item) => matchesBuildCategory('boots', item.tags)).length,
		};
	}, [srItems]);

	// Filter items based on category, sub-tag chip, and search
	const filteredItems = useMemo(() => {
		const q = itemSearch.trim().toLowerCase();

		let list = srItems.filter(isBuildableItem);

		list = list.filter((item) => matchesBuildCategory(activeCategory, item.tags));

		if (activeSubFilter) {
			list = list.filter((item) =>
				matchesItemTagFilterForItem(activeSubFilter, item, {
					bonusAvailable: hasBonusItems,
				})
			);
		}

		if (q) {
			list = list.filter(
				(item) =>
					item.name.toLowerCase().includes(q) ||
					(item.plaintext && item.plaintext.toLowerCase().includes(q))
			);
		}

		return list;
	}, [srItems, itemSearch, activeCategory, activeSubFilter, hasBonusItems]);
	console.log({ filteredItems });

	const itemsGridLoading =
		!itemsQuery.isError &&
		(!isPatchReady ||
			itemsQuery.isPending ||
			(itemsQuery.isFetching && itemsQuery.data === undefined));

	// Stats calculations
	const calculatedStats = useMemo(() => {
		const lv = level - 1;
		const factor = lv * (0.7025 + 0.0175 * lv); // Riot's official per-level factor

		// 1. Champion base stats at selected level
		let baseHp = 0;
		let baseMana = 0;
		let baseAd = 0;
		let baseArmor = 0;
		let baseMr = 0;
		let baseAsRatio = 0.625;
		let baseAsGrowth = 0;
		let baseMs = 330;
		let baseCritPct = 0;
		let baseCritDamagePct = 175;

		if (currentChampBonus && currentChampBonus.stats) {
			const s = currentChampBonus.stats as Record<string, ItemBonusStatBlock | undefined>;
			baseHp = s.health?.flat ?? 0;
			baseHp += (s.health?.perLevel ?? 0) * factor;

			baseMana = s.mana?.flat ?? 0;
			baseMana += (s.mana?.perLevel ?? 0) * factor;

			baseAd = s.attackDamage?.flat ?? 0;
			baseAd += (s.attackDamage?.perLevel ?? 0) * factor;

			baseArmor = s.armor?.flat ?? 0;
			baseArmor += (s.armor?.perLevel ?? 0) * factor;

			baseMr = s.magicResistance?.flat ?? 0;
			baseMr += (s.magicResistance?.perLevel ?? 0) * factor;

			baseAsRatio = s.attackSpeed?.flat ?? 0.625;
			baseAsGrowth = s.attackSpeed?.perLevel ?? s.attackSpeed?.percentPerLevel ?? 0;

			baseMs = s.movespeed?.flat ?? 330;

			baseCritPct = s.criticalStrikeChance?.percent ?? s.criticalStrikeChance?.flat ?? 0;

			const critDmgBlock = s.criticalStrikeDamage;
			if (critDmgBlock && typeof critDmgBlock === 'object' && 'flat' in critDmgBlock) {
				const flatVal = critDmgBlock.flat ?? 175;
				baseCritDamagePct = flatVal > 10 ? flatVal : flatVal * 100;
			}
		} else if (currentChampDdr && currentChampDdr.stats) {
			const s = currentChampDdr.stats;
			baseHp = (s.hp ?? 0) + (s.hpperlevel ?? 0) * factor;
			baseMana = (s.mp ?? 0) + (s.mpperlevel ?? 0) * factor;
			baseAd = (s.attackdamage ?? 0) + (s.attackdamageperlevel ?? 0) * factor;
			baseArmor = (s.armor ?? 0) + (s.armorperlevel ?? 0) * factor;
			baseMr = (s.spellblock ?? 0) + (s.spellblockperlevel ?? 0) * factor;
			baseAsRatio = s.attackspeed ?? 0.625;
			baseAsGrowth = s.attackspeedperlevel ?? 0;
			baseMs = s.movespeed ?? 330;
		}

		const levelBonusAsPct = baseAsGrowth * factor;
		const asAtLevel = baseAsRatio * (1 + levelBonusAsPct / 100);

		const championBase: ChampionBaseStats = {
			hp: baseHp,
			mana: baseMana,
			ad: baseAd,
			armor: baseArmor,
			mr: baseMr,
			as: asAtLevel,
			ms: baseMs,
			critPct: baseCritPct,
			critDamagePct: baseCritDamagePct,
		};

		// 2. Collect equipped items + cost
		const equippedItems: SrItem[] = [];
		let totalCost = 0;
		let itemCount = 0;

		build.forEach((itemId) => {
			if (!itemId) return;
			const item = itemsById[itemId];
			if (!item) return;
			equippedItems.push(item);
			totalCost += item.goldTotal;
			itemCount++;
		});

		// 3. Parse item stats (bonus API) and apply onto champion base
		const itemStats = accumulateItemStatsFromBuild(equippedItems);
		const computed = applyItemStatsToChampion(championBase, itemStats);

		const critChance = computed.totalCritPct / 100;
		computed.dps =
			computed.totalAd * computed.totalAs * (1 + critChance * (computed.totalCritDamage - 1));
		computed.totalCost = totalCost;
		computed.itemCount = itemCount;

		return computed;
	}, [currentChampBonus, currentChampDdr, level, build, itemsById]);

	// Add item to build slot
	const handleItemSelect = (itemId: string) => {
		if (editingSlot === null) return;

		// Check group restriction
		const selectedItem = itemsById[itemId];
		if (selectedItem?.group) {
			// Find if there's any other slot already containing an item from the same group
			const hasSameGroup = build.some((otherItemId, index) => {
				// Allow replacing the item in the current editing slot
				if (index === editingSlot) return false;
				if (!otherItemId) return false;

				const otherItem = itemsById[otherItemId];
				return otherItem && otherItem.group === selectedItem.group;
			});

			if (hasSameGroup) {
				// Only 1 item of this group is allowed
				showToast({
					message: `Limited to 1 ${selectedItem.group.toUpperCase()} item.`,
					severity: 'error',
					dedupeKey: `item-group-${selectedItem.group}`,
				});
				return;
			}
		}

		setBuild((prev) => {
			const next = [...prev];
			next[editingSlot] = itemId;
			return next;
		});

		// Auto set editing slot to next slot
		setEditingSlot((prev) => {
			if (prev === null) return 0;
			return prev < 5 ? prev + 1 : prev;
		});
	};

	// Remove item from a slot
	const handleRemoveItem = (index: number) => {
		setBuild((prev) => {
			const next = [...prev];
			next[index] = null;
			return next;
		});
	};

	// Right click slot to remove item
	const handleContextMenu = (e: React.MouseEvent, index: number) => {
		e.preventDefault();
		handleRemoveItem(index);
	};

	const getChampImgUrl = (champId: string) => {
		return `https://ddragon.leagueoflegends.com/cdn/${patchVersion || '14.23.1'}/img/champion/${champId}.png`;
	};

	const statsToShow = useMemo(() => {
		return [
			{
				key: 'health',
				value: calculatedStats.totalHp,
				colorClass: 'text-green-500 dark:text-green-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'mana',
				value: calculatedStats.totalMana,
				colorClass: 'text-sky-500 dark:text-sky-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'attackDamage',
				value: calculatedStats.totalAd,
				icon: 'scalead',
				colorClass: 'text-orange-500 dark:text-orange-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'abilityPower',
				value: calculatedStats.totalAp,
				icon: 'scaleap',
				colorClass: 'text-fuchsia-500 dark:text-fuchsia-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'attackSpeed',
				value: calculatedStats.totalAs,
				icon: 'scaleas',
				colorClass: 'text-yellow-500 dark:text-yellow-400',
				format: (v: number) => v.toFixed(2),
			},
			{
				key: 'armor',
				value: calculatedStats.totalArmor,
				icon: 'scalearmor',
				colorClass: 'text-blue-500 dark:text-blue-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'magicResistance',
				value: calculatedStats.totalMr,
				icon: 'scalemr',
				colorClass: 'text-purple-500 dark:text-purple-400',
				format: (v: number) => v.toFixed(0),
			},
			{
				key: 'movespeed',
				value: calculatedStats.totalMs,
				icon: 'scalems',
				colorClass: 'text-teal-500 dark:text-teal-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'criticalStrikeChance',
				value: calculatedStats.totalCritPct,
				icon: 'scalecrit',
				colorClass: 'text-red-500 dark:text-red-400',
				format: (v: number) => Math.round(v) + '%',
			},
			{
				key: 'criticalStrikeDamage',
				value: calculatedStats.totalCritDamagePct,
				colorClass: 'text-pink-500 dark:text-pink-600',
				format: (v: number) => Math.round(v) + '%',
			},
			{
				key: 'abilityHaste',
				value: calculatedStats.totalAbilityHaste,
				icon: 'scalecooldown',
				colorClass: 'text-indigo-500 dark:text-indigo-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'lethality',
				value: calculatedStats.totalLethality,
				colorClass: 'text-rose-500 dark:text-rose-400',
				format: (v: number) => Math.round(v).toString(),
			},
			{
				key: 'omnivamp',
				value: calculatedStats.totalOmnivampPct,
				colorClass: 'text-pink-500 dark:text-pink-400',
				format: (v: number) => Math.round(v) + '%',
			},
		];
	}, [calculatedStats]);

	const statsByKey = useMemo(
		() => Object.fromEntries(statsToShow.map((stat) => [stat.key, stat])),
		[statsToShow]
	);

	const abilityData = useCallback(
		(skill: string) => {
			if (!currentChampBonus) return null;
			return (currentChampBonus.abilities as Record<string, { name?: string }[]>)?.[
				skill
			]?.[0];
		},
		[currentChampBonus]
	);

	const clearInputValue = () => {
		if (searchInputRef.current) {
			searchInputRef.current.value = '';
		}
	};

	return (
		<div className="mx-auto w-full max-w-container px-6 py-12 relative">
			<header className="flex items-center justify-between mb-12">
				<div>
					<h1 className="display gold-text text-4xl">BUILD CALCULATOR</h1>
					<p className="mt-2 text-xs text-muted-foreground lg:text-sm">
						Pick a champion, set your level, allocate skill points and equip items.
					</p>
				</div>
				{/* Mobile */}
				{/* {selectedChampionId ? (
					<div className="text-center xl:hidden flex flex-col items-center shrink-0 ml-4">
						<img
							src={getChampImgUrl(selectedChampionId)}
							alt={(currentChampBonus?.name as string) || 'champion'}
							className="w-10 h-10 rounded-full mx-auto"
						/>
						<span className="text-xs font-bold mt-1">{selectedChampionId}</span>
					</div>
				) : null} */}
			</header>

			{/* {selectedChampionId ? (
				<div className="absolute top-12 3xl:top-0 bottom-12 w-20 pointer-events-none hidden xl:block z-[10] right-6">
					<div className="sticky top-24 pointer-events-auto text-center flex flex-col items-center">
						<img
							src={getChampImgUrl(selectedChampionId)}
							alt={(currentChampBonus?.name as string) || 'champion'}
							className="mb-1 w-12 h-12 3xl:w-20 3xl:h-20 rounded-full mx-auto border-2 border-hex-gold shadow-gold bg-[#040a10]"
						/>
						<span className="text-xs font-bold text-hex-gold px-2 py-0.5 block truncate max-w-full">
							{selectedChampionId}
						</span>
					</div>
				</div>
			) : null} */}

			{/* Main Layout Grid */}
			<div className="grid gap-3 xl:gap-6 grid-cols-1 lg:grid-cols-[320px_1fr]">
				{/* Overview */}
				<div className="col-span-full flex flex-col lg:flex-row lg:items-center">
					{/* corner-top-shape: scoop; */}
					<div className="flex items-center justify-center lg:justify-start">
						{/* Stats */}
						<div className="stats-box">
							{OVERVIEW_STAT_KEYS.map((key) => {
								const stat = statsByKey[key];
								if (!stat?.icon) return null;

								return (
									<div key={key} className="flex items-center gap-2">
										<img
											src={`${STAT_ICON_BASE}/${stat.icon}.png`}
											alt={key}
											className="w-4 h-4"
										/>
										<span className="text-xs font-medium 4xl:text-sm text-hext-gold">
											{stat.format(stat.value)}
										</span>
									</div>
								);
							})}
						</div>
						{/* Skills */}
						<div className="hud-frame skill-frame">
							<div className="outer-frame absolute -left-20 top-1/2 -translate-y-1/2">
								<div className="trapezoid"></div>
								<div className="inner-frame relative">
									{selectedChampionId && (
										<img
											src={getChampImgUrl(selectedChampionId || '')}
											alt={(selectedChampionId as string) || 'champion'}
											className="rounded-full border-2 border-hex-gold/50 mx-auto absolute top-0 left-0 aspect-square object-contain hover:opacity-80 hover:scale-105"
										/>
									)}
								</div>
								<div className="lv-frame">{level}</div>
							</div>
							<div
								className={clsx('flex flex-wrap gap-2 z-10 relative', {
									'opacity-80': championBonusDetailQuery.isFetching,
								})}
							>
								<div className="w-10 h-10 border-2 dark:border-yellow-100">
									{selectedChampionId ? (
										<SkillPopover
											champion={selectedChampionId ?? null}
											item={abilityData('P') as BonusAbility}
											skill={'P'}
											skillsPayload={championSkillsQuery.data}
											totalAd={calculatedStats.totalAd}
											totalAp={calculatedStats.totalAp}
											championLevel={level}
											bonusHealth={Math.max(
												0,
												calculatedStats.totalHp - calculatedStats.baseHp
											)}
										>
											<img
												alt={`${selectedChampionId}-P`}
												src={`https://cdn.communitydragon.org/latest/champion/${selectedChampionId}/ability-icon/p.png`}
											/>
										</SkillPopover>
									) : (
										<div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
									)}
								</div>
								<div className="flex-1 grid grid-cols-4 gap-2">
									{SKILL_KEYS.map((skill) => {
										const rank = skillLevels[skill];
										const canUp = canLevelSkill(skill, skillLevels, level);
										const dotCount = dotCountForSkill(skill);

										return (
											<div key={skill} className="flex flex-col relative">
												<div className="aspect-square border-2 dark:border-yellow-100 mb-1">
													{selectedChampionId ? (
														<SkillPopover
															champion={selectedChampionId || ''}
															item={
																abilityData(skill) as BonusAbility
															}
															skill={skill}
															skillLv={rank}
															skillsPayload={championSkillsQuery.data}
															totalAd={calculatedStats.totalAd}
															totalAp={calculatedStats.totalAp}
															championLevel={level}
															bonusHealth={Math.max(
																0,
																calculatedStats.totalHp -
																	calculatedStats.baseHp
															)}
															triggerClassName="h-full w-full"
														>
															<img
																alt={`${selectedChampionId}-${skill}`}
																src={`https://cdn.communitydragon.org/latest/champion/${selectedChampionId}/ability-icon/${skill.toLowerCase()}.png`}
																className={cn(
																	'w-full h-full object-cover',
																	rank === 0 && 'grayscale-[95%]'
																)}
															/>
														</SkillPopover>
													) : (
														<div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
													)}
													{/* '!grayscale pointer-events-none': !canUp, */}
													{canUp ? (
														<button
															type="button"
															className="group transition-all active:translate-y-0.5 absolute -top-[90%] left-0 w-full aspect-square bg-transparent cursor-pointer outline-none"
															onClick={() =>
																handleSkillLevelUp(skill)
															}
															title={`Level up ${skill}`}
															aria-label={`Level up ${skill}`}
														>
															<img
																src="/images/icons/skillup.svg"
																alt=""
																className="w-full h-full pointer-events-none"
															/>
															<div className="hidden group-hover:block w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(at_center,#ffffff75,#dfe5635c)]"></div>
														</button>
													) : null}
												</div>
												{skill === 'R' ? (
													<div className="flex justify-center gap-0.5">
														{Array.from({ length: dotCount }).map(
															(_, index) => (
																<div
																	key={index}
																	className={cn(
																		'w-2 h-2 rounded-full',
																		index < rank
																			? 'bg-hex-gold/80'
																			: 'bg-gray-300 dark:bg-gray-700'
																	)}
																/>
															)
														)}
													</div>
												) : (
													<div className="grid grid-cols-5 gap-0.5">
														{Array.from({ length: dotCount }).map(
															(_, index) => (
																<div
																	key={index}
																	className={cn(
																		'w-2 h-2 rounded-full',
																		index < rank
																			? 'bg-hex-gold/80'
																			: 'bg-gray-300 dark:bg-gray-700'
																	)}
																/>
															)
														)}
													</div>
												)}
											</div>
										);
									})}
								</div>
								<div className="w-full flex flex-col gap-1">
									<div className="hud-bar health-bar">
										{Math.round(calculatedStats.totalHp)}/
										{Math.round(calculatedStats.totalHp)}
									</div>
									<div className={cn('hud-bar', resourceBarClass)}>
										{calculatedStats.totalMana > 0 ? (
											<>
												{Math.round(calculatedStats.totalMana)}/
												{Math.round(calculatedStats.totalMana)}
											</>
										) : null}
									</div>
								</div>
							</div>
						</div>
						{/* Items */}
						<div className="hud-frame items-frame">
							<div className="grid grid-cols-3 gap-1 w-full">
								{build.map((itemId, index) => {
									const item = itemId ? itemsById[itemId] : null;
									return (
										<div
											key={index}
											className="aspect-square border-2 border-hex-gold/40 z-[3] p-1"
											onContextMenu={(e) => handleContextMenu(e, index)}
										>
											{item ? (
												<ItemPopover
													item={item}
													itemsById={itemsById}
													showTree={false}
													triggerClassName="w-full h-full"
												>
													<div className="w-full h-full relative flex flex-col items-center justify-center">
														<img
															src={itemImgUrl(patchVersion!, item.id)}
															alt={item.name}
															className="w-full h-full object-cover"
														/>
													</div>
												</ItemPopover>
											) : null}
										</div>
									);
								})}
							</div>
						</div>
					</div>

					<Button
						className="w-full mt-4 lg:mt-0 lg:ml-auto lg:w-auto text-white hover:opacity-85"
						onClick={() => setSimulateDialogOpen(true)}
					>
						Simulate damage
					</Button>
					<SimulateDialog
						data={{
							build: build,
							stats: {
								...calculatedStats,
								level,
							},
							skills: skillLevels,
						}}
						open={simulateDialogOpen}
						onOpenChange={setSimulateDialogOpen}
					/>
				</div>

				{/* Left column */}
				<div className="space-y-3 xl:space-y-6 shrink-0">
					{/* Champion Selection Panel */}
					<div className="hex-border rounded-md">
						<h3 className="text-xs text-hex-gold font-bold tracking-wider uppercase rounded-t-md p-3 border-b border-hex-gold/30 bg-neutral-200 dark:bg-[#07131b]">
							Champion Selection
						</h3>
						<div className="p-3 space-y-3">
							<div className="relative group">
								<Input
									ref={searchInputRef}
									className="w-full border border-hex-gold/30 dark:bg-[#070f19] text-xs h-9 transition-none"
									placeholder="Search by name..."
									value={championSearch}
									onChange={(e) => setChampionSearch(e.target.value)}
								/>
								<X
									size={14}
									className={clsx(
										'absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hidden',
										{
											'group-hover:block': championSearch.length > 0,
										}
									)}
									onClick={clearInputValue}
								/>
							</div>

							{/* Lane Filters */}
							<div className="grid grid-cols-6 gap-1">
								{LANE_FILTERS.map((filter) => (
									<button
										key={filter.id}
										onClick={() => {
											setActiveLane(filter.id);
										}}
										type="button"
										className={clsx(
											'text-[10px] py-1 border rounded-sm font-bold text-center uppercase',
											activeLane === filter.id
												? 'bg-hex-gold/25 border-hex-gold text-hex-gold font-bold'
												: 'border-hex-gold/20 text-muted-foreground bg-transparent hover:border-hex-gold/30 hover:text-gray-300'
										)}
									>
										{filter.id}
									</button>
								))}
							</div>

							{/* Champions grid list */}
							<div className="h-[300px] custom-scrollbar">
								<div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 p-2 border border-hex-gold/20 rounded dark:bg-[#0b1319]">
									{championsGridLoading ? (
										Array.from({ length: 16 }).map((_, i) => (
											<div
												key={i}
												className="aspect-square bg-gray-200 dark:bg-gray-900 rounded animate-pulse border border-hex-gold/10"
											/>
										))
									) : filteredChampions.length === 0 ? (
										<div className="col-span-full text-center py-8 text-xs text-muted-foreground">
											No champions found
										</div>
									) : (
										filteredChampions.map((champ) => {
											const isSelected = selectedChampionId === champ.id;
											return (
												<button
													key={champ.id}
													type="button"
													onClick={() => setSelectedChampionId(champ.id)}
													className={clsx(
														'flex flex-col items-center justify-center p-0.5 rounded border-2 bg-gray-200 dark:bg-[#08111a] overflow-hidden',
														isSelected
															? 'border-hex-gold ring-1 ring-hex-gold/40'
															: 'border-transparent hover:border-hex-gold/30'
													)}
													title={champ.name}
												>
													<img
														src={getChampImgUrl(champ.id)}
														alt={champ.name}
														className="w-full aspect-square object-cover hover:scale-105"
													/>
													<span
														className={clsx(
															'text-[9px] mt-1 truncate w-full text-center px-0.5',
															isSelected
																? 'text-hex-gold'
																: 'text-muted-foreground'
														)}
													>
														{champ.name}
													</span>
												</button>
											);
										})
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="hex-border rounded-md p-4 space-y-6">
						{/* Level Slider Panel */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<span className="text-xs uppercase text-hex-gold font-bold tracking-wider">
									Level
								</span>
								<span className="text-sm text-hex-gold font-bold">Lv {level}</span>
							</div>
							<Slider
								value={[level]}
								onValueChange={(val) => setLevel(val[0])}
								min={1}
								max={18}
								step={1}
								className="build-level-slider py-2"
							/>
						</div>
						{/* Base Stats Panel */}
						<div>
							<h4 className="text-xs uppercase text-hex-gold font-bold tracking-wider border-b border-hex-gold/10 pb-2 mb-3">
								Base Stat (Lv {level})
							</h4>
							<div className="space-y-2 text-xs">
								{statsToShow.map((item) => {
									const { short, label } =
										item.key === 'level'
											? { short: 'Lv', label: 'Level' }
											: bonusStatAbbreviation(item.key);
									return (
										<div
											key={item.key}
											className={clsx(
												'flex justify-between items-center py-1 border-b border-hex-gold/5 last:border-0',
												item.key === 'level' &&
													'border-t border-hex-gold/10 mt-2 pt-2'
											)}
										>
											<Tooltip delayDuration={0}>
												<TooltipTrigger asChild>
													<span className="text-muted-foreground hover:cursor-help ">
														{short}
													</span>
												</TooltipTrigger>
												<TooltipContent className="pointer-events-none select-none bg-yellow-700 text-xs text-white dark:bg-[#624e1e] border border-hex-gold/30">
													{label}
												</TooltipContent>
											</Tooltip>
											<span className={cn('font-semibold', item.colorClass)}>
												{item.format(item.value)}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
				{/* Right column */}
				<div className="space-y-3 xl:space-y-6">
					{/* Build Slots Panel */}
					<div className="hex-border rounded-md">
						<div className="w-full flex justify-between items-center rounded-t-md p-3 border-b border-hex-gold/30 bg-neutral-200 dark:bg-[#07131b]">
							<h3 className="text-xs text-hex-gold font-bold tracking-wider uppercase">
								Build Slots
								{/* {editingSlot !== null && (
								<span className="text-[10px] px-2 py-0.5 border border-hex-gold/30 rounded text-muted-foreground font-semibold bg-hex-gold/10">
									EDITING SLOT {editingSlot + 1}
								</span>
							)} */}
							</h3>
							{build.some((item) => item !== null) ? (
								<div className="flex items-center gap-2">
									<span className="text-xs text-hex-gold font-semibold">
										Total: {calculatedStats.totalCost.toLocaleString()}g
									</span>
									<button
										type="button"
										className="text-destructive hover:opacity-80"
										title="Clear build"
										onClick={() => setBuild(Array(6).fill(null))}
									>
										<X size={16} />
									</button>
								</div>
							) : null}
						</div>

						{/* Slots Row Grid */}
						<div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-4">
							{build.map((itemId, index) => {
								const item = itemId ? itemsById[itemId] : null;
								const isActive = editingSlot === index;

								return (
									<div
										key={index}
										onContextMenu={(e) => handleContextMenu(e, index)}
										onClick={() => setEditingSlot(index)}
										className={clsx(
											'relative aspect-square flex flex-col items-center justify-center border rounded-md cursor-pointer bg-gray-200/60 hover:bg-gray-200 dark:bg-[#0b1319] hover:dark:bg-[#09111b] overflow-hidden group',
											isActive
												? 'border-hex-gold ring-1 ring-hex-gold/50 dark:bg-[#0c202e]'
												: 'border-hex-gold/20 hover:border-hex-gold/40'
										)}
									>
										{item ? (
											<div className="flex items-center justify-center h-full w-full">
												<ItemPopover
													item={item}
													itemsById={itemsById}
													showTree={false}
													triggerClassName="w-full h-full"
												>
													<div className="w-full h-full relative flex flex-col items-center justify-center">
														<img
															src={itemImgUrl(patchVersion!, item.id)}
															alt={item.name}
															className="aspect-square object-cover rounded-md mb-1.5 max-w-12 2xl:max-w-[initial]"
														/>
														<span className="text-xs text-muted-foreground w-full text-center font-medium px-2">
															{item.name}
														</span>
													</div>
												</ItemPopover>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														handleRemoveItem(index);
													}}
													className="hidden group-hover:flex absolute top-1.5 right-1.5 size-4 rounded-full hover:opacity-80 items-center justify-center bg-red-500/80 text-white z-10 transition-colors"
													title="Remove item"
												>
													<X className="size-3" />
												</button>
											</div>
										) : (
											<div className="text-muted-foreground flex flex-col items-center justify-center gap-1.5 p-2 text-center">
												<Plus className="size-5 text-hex-gold/40 transition-transform group-hover:scale-110" />
												{/* <span className="text-[10px] text-hex-gold/55 font-semibold">
													Slot {index + 1}
												</span> */}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Item Selection list with categories and tags */}
					<div className="hex-border rounded-md p-4 space-y-4">
						<div className="flex flex-col">
							{/* Item search bar */}
							<div className="relative mb-2">
								<Input
									className="w-full border border-hex-gold/30 dark:bg-[#070f19] text-xs h-9 pl-9 transition-none"
									placeholder="Search by item name..."
									value={itemSearch}
									onChange={(e) => setItemSearch(e.target.value)}
								/>
								<Search className="size-4 text-hex-gold/45 absolute left-3 top-2.5" />
							</div>

							{/* Main category filter row */}
							<div className="flex flex-wrap items-center gap-2 border-b border-hex-gold/20 mb-2">
								{ITEM_CATEGORIES.map((cat) => {
									const count = itemCategoryCounts[cat.id];
									const isActive = activeCategory === cat.id;
									return (
										<button
											key={cat.id}
											onClick={() => {
												setActiveCategory(cat.id);
												setActiveSubFilter(null); // Reset subtag filter when main changes
											}}
											type="button"
											className={clsx(
												'p-1 text-xs border-b-2 font-medium hover:opacity-80',
												isActive
													? 'border-hex-gold text-hex-gold font-semibold'
													: 'border-transparent text-muted-foreground'
											)}
										>
											{cat.label} ({count})
										</button>
									);
								})}
							</div>

							{/* Sub-tag filters — same chips as items page */}
							<div className="flex flex-wrap gap-1.5 p-1">
								{ITEM_TAG_FILTERS.map((tagChip) => {
									const isActive = activeSubFilter === tagChip;
									return (
										<button
											key={tagChip}
											type="button"
											onClick={() => {
												setActiveSubFilter((prev) =>
													prev === tagChip ? null : tagChip
												);
											}}
											className={clsx(
												'capitalize rounded-sm border border-neutral-400/50 bg-background px-3 py-1 text-xs text-muted-foreground hover:opacity-80 dark:border-hex-gold/50 5xl:text-sm',
												{
													'!border-hex-gold bg-hex-gold/10 font-medium !text-hex-gold':
														isActive,
												}
											)}
										>
											{capitalizeText(tagChip)}
										</button>
									);
								})}
							</div>
						</div>

						{/* Items list grid container */}
						<div
							className={clsx(
								'p-3 grid grid-cols-3 md:grid-cols-6 2xl:grid-cols-10 gap-3 max-h-[360px] border border-hex-gold/20 rounded dark:bg-[#0b1319] custom-scrollbar',
								itemsGridLoading && '!overflow-y-hidden'
							)}
						>
							{itemsGridLoading ? (
								Array.from({ length: 24 }).map((_, i) => (
									<div
										key={i}
										className="aspect-[4/5] bg-gray-200 dark:bg-gray-900 rounded animate-pulse border border-hex-gold/10"
									/>
								))
							) : filteredItems.length === 0 ? (
								<div className="col-span-full text-center py-12 text-xs text-muted-foreground">
									No items found matching the filters
								</div>
							) : (
								filteredItems.map((item) => (
									<ItemPopover
										key={item.id}
										item={item}
										itemsById={itemsById}
										showTree={false}
									>
										<button
											type="button"
											onClick={() => handleItemSelect(item.id)}
											className={clsx(
												'w-full grid border border-hex-gold/20 bg-gray-200/60 hover:bg-gray-200 dark:bg-[#09111b] hover:dark:bg-[#0f1b27] hover:border-hex-gold/50 text-center aspect-[5/6] min-w-0',
												build.includes(item.id)
													? '!bg-hex-gold/20 dark:!bg-hex-gold/10'
													: ''
											)}
										>
											<div className="flex flex-col items-center p-2 w-full h-full">
												{/* lg:block */}
												<div className="flex-1 flex flex-col items-center justify-center">
													<img
														src={itemImgUrl(patchVersion!, item.id)}
														alt={item.name}
														className="size-10 object-cover rounded-md mb-1 mx-auto hover:scale-110"
													/>
													{/* truncate */}
													<div className="text-[10px] font-semibold text-muted-foreground w-full px-0.5">
														{item.name}
													</div>
												</div>
												<div className="text-[10px] text-hex-gold/80 font-bold">
													{item.goldTotal}g
												</div>
											</div>
										</button>
									</ItemPopover>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ─── BOTTOM SECTION: Dashboard Summary Cards ───────────────── */}
			{/* <div className="mt-8 border-t border-hex-gold/10 pt-8">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							Total AD
						</div>
						<div className="text-3xl text-hex-gold font-bold my-1">
							{Math.round(calculatedStats.totalAd)}
						</div>
						<div className="text-[9px] text-muted-foreground">
							Base {Math.round(calculatedStats.baseAd)} + Items +
							{Math.round(calculatedStats.itemAd)}
						</div>
					</div>

					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							Total AP
						</div>
						<div className="text-3xl text-purple-400 font-bold my-1">
							{Math.round(calculatedStats.totalAp)}
						</div>
						<div className="text-[9px] text-muted-foreground">Magic Attack Power</div>
					</div>

					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							Effective HP (Physical)
						</div>
						<div className="text-3xl text-green-400 font-bold my-1">
							{Math.round(calculatedStats.effectiveHpPhys).toLocaleString()}
						</div>
						<div className="text-[9px] text-muted-foreground">HP * (1 + Armor/100)</div>
					</div>

					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							Effective HP (Magic)
						</div>
						<div className="text-3xl text-blue-400 font-bold my-1">
							{Math.round(calculatedStats.effectiveHpMagic).toLocaleString()}
						</div>
						<div className="text-[9px] text-muted-foreground">HP * (1 + MR/100)</div>
					</div>

					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							DPS (AA)
						</div>
						<div className="text-3xl text-red-400 font-bold my-1">
							{Math.round(calculatedStats.dps)}
						</div>
						<div className="text-[9px] text-muted-foreground">
							AD * AS * Expected Clear Value
						</div>
					</div>

					<div className="bg-[#050b11] border border-hex-gold/20 p-4 rounded-md text-center shadow-lg transition-all hover:border-hex-gold/30">
						<div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
							Build Cost
						</div>
						<div className="text-3xl text-yellow-500 font-bold my-1">
							{calculatedStats.totalCost.toLocaleString()}
						</div>
						<div className="text-[9px] text-muted-foreground">
							{calculatedStats.itemCount} Items equipped
						</div>
					</div>
				</div>
			</div> */}
		</div>
	);
}
