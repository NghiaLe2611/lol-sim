import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STALE_MS, getSquareChampImg } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { getBonusChampions, getChampions } from '@/services/api';
import { matchesDisplayNamePrefix } from '@/utils/common';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
	ChampionRoleFilter,
	ROLE_BAR_ITEMS,
	fallbackLanePositionsFromTags,
	getLanePositions,
	matchesChampionRoleFilter,
	selectBonusChampionMeta,
} from './role-filter';
import { Grid2x2, Grid3x3, TableProperties } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import clsx from 'clsx';
import HoverPopover from '@/components/HoverPopover';
import { ChampionClassTags, ChampionLanePositionTags } from '../champion-detail';
import { ChampionListRow, ChampionsApiPayload } from '@/types/champions';

// ['All', 'Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank']

function championsFromPayload(payload: ChampionsApiPayload): ChampionListRow[] {
	return Object.values(payload.data);
}

type SortType = 'ascending' | 'descending' | 'oldest' | 'latest';

function compareReleaseDate(
	a: ChampionListRow,
	b: ChampionListRow,
	releaseDates: Record<string, string>,
	direction: 'oldest' | 'latest'
): number {
	const dateA = releaseDates[a.id];
	const dateB = releaseDates[b.id];

	if (!dateA && !dateB) return a.name.localeCompare(b.name);
	if (!dateA) return 1;
	if (!dateB) return -1;

	const cmp = dateA.localeCompare(dateB);
	if (cmp !== 0) return direction === 'oldest' ? cmp : -cmp;
	return a.name.localeCompare(b.name);
}

function sortChampions(
	champions: ChampionListRow[],
	sort: SortType,
	releaseDates: Record<string, string>,
	bonusAvailable: boolean
): ChampionListRow[] {
	const items = [...champions];

	switch (sort) {
		case 'descending':
			return items.sort((a, b) => b.name.localeCompare(a.name));
		case 'oldest':
			if (!bonusAvailable) {
				return items.sort((a, b) => a.name.localeCompare(b.name));
			}
			return items.sort((a, b) => compareReleaseDate(a, b, releaseDates, 'oldest'));
		case 'latest':
			if (!bonusAvailable) {
				return items.sort((a, b) => a.name.localeCompare(b.name));
			}
			return items.sort((a, b) => compareReleaseDate(a, b, releaseDates, 'latest'));
		case 'ascending':
		default:
			return items.sort((a, b) => a.name.localeCompare(b.name));
	}
}

/** Tags icon */
const TAG_CLASS_ICON: Record<string, { src: string; label: string }> = {
	Fighter: { src: '/images/icons/roles/fighter.svg', label: 'Fighter' },
	Tank: { src: '/images/icons/roles/tank.svg', label: 'Tank' },
	Mage: { src: '/images/icons/roles/mage.svg', label: 'Mage' },
	Marksman: { src: '/images/icons/roles/marksman.svg', label: 'Marksman' },
	Assassin: { src: '/images/icons/roles/assassin.svg', label: 'Assassin' },
	Support: { src: '/images/icons/roles/support.svg', label: 'Support' },
};

function ChampionCardTagIcons({ tags }: { tags: string[] }) {
	return (
		<div className="flex flex-wrap gap-2">
			{tags.map((tg) => {
				const meta = TAG_CLASS_ICON[tg];
				if (!meta) return null;
				return (
					<Tooltip key={tg}>
						<TooltipTrigger asChild>
							{/* border-border/80 border size-7 rounded bg-muted/30  */}
							<span className="inline-flex items-center justify-center">
								<img
									alt="role"
									className="size-[14px] object-contain filter-icon"
									src={meta.src}
									height={14}
									width={14}
								/>
							</span>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="bg-yellow-700 dark:bg-[#624e1e] text-xs text-white"
						>
							{meta.label}
						</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}

function ChampionCardLaneIcons({ positions }: { positions: string[] }) {
	const lanes = getLanePositions(positions);
	if (lanes.length === 0) return null;

	return (
		<div className="absolute top-0 left-0 w-full p-2 hidden group-hover:block">
			<div className="flex flex-col items-end gap-2">
				{lanes.map((laneId) => {
					const item = ROLE_BAR_ITEMS.find((x) => x.id === laneId);
					if (!item) return null;
					return (
						<Tooltip key={laneId}>
							<TooltipTrigger asChild>
								<span className="inline-flex rounded-sm p-1 bg-[#bb9301e6] dark:bg-[#082639bd]">
									<img
										alt={`role-${laneId}`}
										className="size-[24px] lg:size-[16px] object-contain filter-white"
										src={item.iconSrc}
										height={24}
										width={24}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="bg-yellow-700 dark:bg-[#624e1e] text-xs text-white select-none pointer-events-none"
							>
								{item.tooltip}
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</div>
	);
}

type ViewType = 'small-grid' | 'large-grid' | 'table';

export default function ChampionsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { patchVersion: version } = useAppContext();
	const { data, isPending, isError } = useQuery({
		queryKey: ['champions'],
		queryFn: () => getChampions(version!),
		enabled: Boolean(version),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const {
		data: bonusMeta,
		isPending: bonusPositionsPending,
		isError: bonusPositionsError,
	} = useQuery({
		queryKey: ['champ_positions_bonus'],
		queryFn: () => getBonusChampions(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: selectBonusChampionMeta,
		retry: false,
	});

	const bonusPositionsMap = bonusMeta?.positions ?? {};
	const bonusReleaseDates = bonusMeta?.releaseDates ?? {};
	const bonusPositionsAvailable = !bonusPositionsPending && !bonusPositionsError;

	const list = useMemo(() => {
		if (!data || typeof data !== 'object' || !('data' in data)) return [];
		const rows = championsFromPayload(data as ChampionsApiPayload);
		const posMap = bonusPositionsMap ?? {};
		return rows.map((row) => {
			const fromBonus = posMap[row.id];
			const positions =
				Array.isArray(fromBonus) && fromBonus.length > 0
					? fromBonus
					: fallbackLanePositionsFromTags(row.tags);
			return { ...row, positions };
		});
	}, [data, bonusPositionsMap]);

	const [search, setSearch] = useState('');
	const [roleFilter, setRoleFilter] = useState<ChampionRoleFilter>('All');
	const [view, setView] = useState<ViewType>('small-grid');
	const [sort, setSort] = useState<SortType>('ascending');

	useEffect(() => {
		if (!bonusPositionsAvailable && (sort === 'oldest' || sort === 'latest')) {
			setSort('ascending');
		}
	}, [bonusPositionsAvailable, sort]);

	/*
    const [tag, setTag] = useState<string>('All');

    const tags = useMemo(() => {
        const unique = new Set<string>();
        for (const c of list) {
            for (const t of c.tags) unique.add(t);
        }
        return ['All', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
    }, [list]);
    */

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		const matched = list.filter((c) => {
			const matchesSearch = matchesDisplayNamePrefix(q, c.name);
			const matchesRolePick = matchesChampionRoleFilter(
				roleFilter,
				c.tags,
				c.positions,
				bonusPositionsAvailable
			);
			return matchesSearch && matchesRolePick;
		});

		return sortChampions(matched, sort, bonusReleaseDates, bonusPositionsAvailable);
	}, [list, search, roleFilter, bonusPositionsAvailable, sort, bonusReleaseDates]);

	const patchAndListLoading = !isError && (!version || Boolean(version && isPending));
	const showChampionGrid = Boolean(version) && !isPending && !isError && data;

	const gridContent = useMemo(() => {
		if (!version) return null;
		if (view === 'large-grid') {
			return filtered.map((c) => (
				<Link
					key={c.id}
					className="hex-border group hover:border-hex-gold overflow-hidden rounded-md border-2 self-start"
					to={`/champions/${c.id}`}
				>
					<div className="aspect-square overflow-hidden bg-secondary relative">
						<img
							alt={c.name}
							loading="lazy"
							// lg:group-hover:opacity-40 backface-hidden
							className="h-full w-full object-cover transition-transform group-hover:scale-[1.1]"
							src={getSquareChampImg(version, (c as any).key)}
							// c.id, c.name c.key
						/>
						<ChampionCardLaneIcons positions={c.positions} />
					</div>
					<div className="p-2 lg:py-2 space-y-2">
						<h5 className="display text-sm lg:text-base 5xl:text-lg font-bold text-hex-gold">
							{c.name}
						</h5>
						<div className="space-y-1">
							<ChampionCardTagIcons tags={c.tags} />
							{/* <ChampionCardLaneIcons positions={c.positions} /> */}
						</div>
					</div>
					{/* <div className="hidden lg:flex p-3 absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex-col justify-between">
                            <div className="space-y-1 flex justify-end">
                                <ChampionCardTagIcons tags={c.tags} />
                            </div>
                            <h5 className="display text-base font-bold text-hex-gold">
                                {c.name}
                            </h5>
                        </div> */}
					{/* {c.tags.map((tg) => (
                                <Badge
                                    key={tg}
                                    className="border-hex-blue/40 text-[10px] text-hex-blue-glow"
                                    variant="outline"
                                >
                                    {tg}
                                </Badge>
                            ))} */}
				</Link>
			));
		}

		if (view === 'small-grid') {
			return filtered.map((c) => (
				<Link
					key={c.id}
					className="aspect-square hex-border group hover:border-hex-gold w-full overflow-hidden rounded-md border-2"
					// self-start
					to={`/champions/${c.id}`}
				>
					<HoverPopover
						side="bottom"
						triggerClassName="block w-full"
						contentClassName="!transition-none"
						content={({ open }) => (
							<div className="min-w-48 rounded-md border border-border bg-background from-background p-2 4xl:p-3 shadow-lg">
								<h3 className="text-sm lg:text-base font-medium">{c.name}</h3>
								<p className="text-xs 4xl:text-sm text-muted-foreground capitalize italic mb-3">
									{c.title}
								</p>
								<div className="space-y-1">
									<div className="flex items-center flex-wrap gap-2 text-xs 4xl:text-sm">
										<span>Roles:</span>
										<ChampionLanePositionTags positions={c.positions} />
									</div>
									<div className="flex items-center flex-wrap gap-2 text-xs 4xl:text-sm">
										<span>Classes:</span>
										<ChampionClassTags tags={c.tags} />
									</div>
								</div>
							</div>
						)}
					>
						<div className="relative aspect-square w-full overflow-hidden bg-secondary">
							<img
								alt={c.name}
								width={48}
								height={48}
								loading="lazy"
								decoding="async"
								src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`}
								className="absolute inset-0 h-full w-full object-cover"
							/>
						</div>
					</HoverPopover>
				</Link>
			));
		}

		if (view === 'table') {
			return <div>Table</div>;
		}

		return null;
	}, [filtered, view]);

	return (
		<div className="mx-auto w-full max-w-container px-6 py-12">
			<div className="flex flex-col h-full">
				<header className="mb-8">
					<h1 className="display gold-text text-4xl">Champions</h1>
					<p className="text-muted-foreground mt-2">
						Click any champion for detailed stats and abilities.
					</p>
				</header>

				<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
					<div className="flex flex-1">
						{/* Search */}
						<div className="flex w-full min-w-0 items-center lg:max-w-md lg:flex-1">
							<SearchAutocomplete
								getLabel={(c) => c.name}
								getImgUrl={(item) =>
									`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png`
								}
								inputClassName="h-8 w-full shrink-0 py-0 text-sm md:h-10 leading-normal"
								items={list}
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
						</div>
					</div>
					<div className="flex items-center gap-3">
						{/* Filter roles */}
						<div
							// border-hex-gold-dark dark:border-border
							className="self-start bg-card/60 border-yellow-700/20 dark:border-border inline-flex shrink-0 overflow-hidden rounded-md border"
							role="toolbar"
							aria-label="Filter by role"
						>
							{ROLE_BAR_ITEMS.map((item, index) => {
								const selected = roleFilter === item.id;
								return (
									<Fragment key={item.id}>
										{index > 0 ? (
											<div
												// bg-yellow-700 dark:bg-border
												className="w-px self-stretch dark:bg-border bg-yellow-700/20"
												aria-hidden
											/>
										) : null}
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-pressed={selected}
													className={
														'hover:opacity-80 text-muted-foreground hover:bg-secondary/80 flex items-center justify-center transition-colors size-8 md:size-10 ' +
														(selected
															? 'dark:bg-hex-gold bg-yellow-700 text-primary-foreground hover:opacity-85'
															: '')
													}
													onClick={() => setRoleFilter(item.id)}
												>
													<img
														alt=""
														className={
															selected
																? 'size-5 shrink-0 brightness-0 invert md:size-6'
																: 'size-5 shrink-0 opacity-[0.82] md:size-6 dark:brightness-0 dark:invert dark:opacity-[0.42]'
														}
														src={item.iconSrc}
														height={24}
														width={24}
													/>
												</button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="bg-yellow-700 dark:bg-[#624e1e] text-white select-none pointer-events-none"
											>
												{item.tooltip}
											</TooltipContent>
										</Tooltip>
									</Fragment>
								);
							})}
						</div>
						{/* View */}
						<div className="flex items-center gap-3">
							<div className="inline-flex rounded-md -space-x-px" role="group">
								<button
									title="Small grid"
									type="button"
									onClick={() => setView('small-grid')}
									className={clsx(
										'text-muted-foreground hover:text-foreground flex items-center justify-center rounded-l-md border border-yellow-700/20 dark:border-border focus:outline-none size-8 md:size-10',
										view === 'small-grid' &&
											'!text-white dark:bg-hex-gold bg-yellow-700'
									)}
								>
									<Grid2x2 size={18} />
								</button>
								<button
									title="Large grid"
									type="button"
									onClick={() => setView('large-grid')}
									className={clsx(
										'text-muted-foreground hover:text-foreground flex items-center justify-center border border-yellow-700/18 dark:border-border focus:outline-none size-8 md:size-10',
										view === 'large-grid' &&
											'!text-white dark:bg-hex-gold bg-yellow-700'
									)}
								>
									<Grid3x3 size={18} />
								</button>
								<button
									title="Table"
									type="button"
									onClick={() => setView('table')}
									className={clsx(
										'text-muted-foreground hover:text-foreground flex items-center justify-center rounded-r-md border border-yellow-700/20 dark:border-border focus:outline-none size-8 md:size-10',
										view === 'table' &&
											'!text-white dark:bg-hex-gold bg-yellow-700'
									)}
								>
									<TableProperties size={20} />
								</button>
							</div>
						</div>
						{/* Sort */}
						<Select
							value={sort}
							onValueChange={(value) => {
								setSort(value as SortType);
							}}
						>
							<SelectTrigger className="size-8 md:size-10 w-full min-w-32 border-yellow-700/20 dark:border-border !bg-transparent !bg-white dark:!bg-neutral-900">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{/* <SelectLabel>Sort</SelectLabel> */}
									<SelectItem value="ascending">A-&gt;Z</SelectItem>
									<SelectItem value="descending">Z-&gt;A</SelectItem>
									<SelectItem value="oldest" disabled={!bonusPositionsAvailable}>
										Oldest
									</SelectItem>
									<SelectItem value="latest" disabled={!bonusPositionsAvailable}>
										Latest
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>

				{isError && (
					<p className="text-muted-foreground py-12 text-center">
						Could not load champions.
					</p>
				)}

				{patchAndListLoading && (
					<div
						className={clsx(
							'grid',
							view === 'large-grid' &&
								'gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8',
							view === 'small-grid' &&
								'gap-1 grid-cols-6 md:grid-cols-12 lg:grid-cols-16'
						)}
					>
						{Array.from({
							length: view === 'small-grid' ? 72 : 30,
						}).map((_, i) =>
							view === 'small-grid' ? (
								<div
									key={i}
									className="hex-border w-full animate-pulse overflow-hidden rounded-md border-2 border-border/60 bg-card/40"
								>
									<Skeleton className="aspect-square w-full rounded-none" />
								</div>
							) : (
								<div
									key={i}
									className="hex-border animate-pulse overflow-hidden rounded-md border-2 border-border/60 bg-card/40"
								>
									<Skeleton className="aspect-square w-full rounded-none" />
									<div className="space-y-2 p-2 lg:py-2">
										<Skeleton className="h-5 w-3/4" />
										<Skeleton className="h-4 w-full" />
									</div>
								</div>
							)
						)}
					</div>
				)}

				{showChampionGrid && version && (
					<>
						{/* <p className="text-xs font-medium text-right text-hex-gold-dark mb-4">
							*{t('common.championNote')}
						</p> */}
						<div
							className={clsx(
								'grid',
								view === 'large-grid' &&
									'gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8',
								view === 'small-grid' &&
									'gap-1 grid-cols-6 md:grid-cols-12 lg:grid-cols-16'
							)}
						>
							{gridContent}
							{filtered.length === 0 && (
								<div className="flex items-center justify-center text-muted-foreground col-span-full py-1">
									<div>
										<img
											src="/images/bee.webp"
											alt="No results"
											className="size-20 2xl:size-28 mx-auto mb-2"
										/>
										<span className="text-sm lg:text-base 5xl:text-lg">
											No champions match your search.
										</span>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
