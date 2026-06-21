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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
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
									className="filter-icon size-[14px] object-contain"
									src={meta.src}
									height={14}
									width={14}
								/>
							</span>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							className="bg-yellow-700 text-xs text-white dark:bg-[#624e1e]"
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
		<div className="absolute left-0 top-0 hidden w-full p-2 group-hover:block">
			<div className="flex flex-col items-end gap-2">
				{lanes.map((laneId) => {
					const item = ROLE_BAR_ITEMS.find((x) => x.id === laneId);
					if (!item) return null;
					return (
						<Tooltip key={laneId}>
							<TooltipTrigger asChild>
								<span className="inline-flex rounded-sm bg-[#bb9301e6] p-1 dark:bg-[#082639bd]">
									<img
										alt={`role-${laneId}`}
										className="filter-white size-[24px] object-contain lg:size-[16px]"
										src={item.iconSrc}
										height={24}
										width={24}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								className="pointer-events-none select-none bg-yellow-700 text-xs text-white dark:bg-[#624e1e]"
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

function formatReleaseDateDisplay(date?: string): string {
	if (!date) return '';
	const parsed = new Date(`${date}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return date;
	return parsed.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function ChampionsTableView({
	champions,
	releaseDates,
}: {
	champions: ChampionListRow[];
	releaseDates: Record<string, string>;
}) {
	const { patchVersion: version } = useAppContext();
	return (
		<div className="hex-border overflow-hidden rounded-md border-2">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-transparent [&_th]:text-center">
						<TableHead className="min-w-[10rem] px-4">Name</TableHead>
						<TableHead className="min-w-[8rem] px-4">Roles</TableHead>
						<TableHead className="min-w-[8rem] px-4">Classes</TableHead>
						<TableHead className="min-w-[7rem] px-4">Released</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{champions.map((c) => {
						const releaseDate = releaseDates[c.id];
						return (
							<TableRow key={c.id} className="hover:bg-muted/30">
								<TableCell className="px-4 py-3">
									<Link
										to={`/champions/${c.id}`}
										className="group flex min-w-0 items-center gap-2 px-4"
									>
										<img
											alt={c.name}
											className="size-8 shrink-0 rounded-full object-contain lg:size-10"
											src={getSquareChampImg(version!, (c as any).key)}
										/>
										<div className="block">
											<p className="text-sm font-semibold text-hex-gold group-hover:underline">
												{c.name}
											</p>
											{c.title ? (
												<p className="mt-0.5 text-xs capitalize italic text-muted-foreground">
													{c.title}
												</p>
											) : null}
										</div>
									</Link>
								</TableCell>
								<TableCell className="px-4 py-3">
									<div className="flex justify-center">
										<ChampionLanePositionTags positions={c.positions} />
									</div>
								</TableCell>
								<TableCell className="px-4 py-3">
									<div className="flex justify-center gap-2">
										<ChampionClassTags tags={c.tags} />
									</div>
								</TableCell>
								<TableCell className="px-4 py-3 text-center text-sm tabular-nums text-muted-foreground">
									{releaseDate ? formatReleaseDateDisplay(releaseDate) : null}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}

export default function ChampionsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { patchVersion: version, isPatchReady } = useAppContext();
	const { data, isPending, isFetching, isError } = useQuery({
		queryKey: ['champions', version],
		queryFn: () => getChampions(version!),
		enabled: isPatchReady,
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

	const patchAndListLoading =
		!isError && (!isPatchReady || isPending || (isFetching && data === undefined));
	const showChampionGrid = isPatchReady && !isPending && !isError && Boolean(data);

	const gridContent = useMemo(() => {
		if (!version) return null;
		if (view === 'large-grid') {
			return filtered.map((c) => (
				<Link
					key={c.id}
					className="hex-border group self-start overflow-hidden rounded-md border-2 hover:border-hex-gold"
					to={`/champions/${c.id}`}
				>
					<div className="relative aspect-square overflow-hidden bg-secondary">
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
					<div className="space-y-2 p-2 lg:py-2">
						<h5 className="display text-sm font-bold text-hex-gold lg:text-base 5xl:text-lg">
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
					className="hex-border group aspect-square w-full overflow-hidden rounded-md border-2 hover:border-hex-gold"
					// self-start
					to={`/champions/${c.id}`}
				>
					<HoverPopover
						side="bottom"
						triggerClassName="block w-full"
						contentClassName="!transition-none"
						content={({ open }) => (
							<div className="min-w-48 rounded-md border border-border bg-background from-background p-2 shadow-lg 4xl:p-3">
								<h3 className="text-sm font-medium lg:text-base">{c.name}</h3>
								<p className="mb-3 text-xs capitalize italic text-muted-foreground 4xl:text-sm">
									{c.title}
								</p>
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2 text-xs 4xl:text-sm">
										<span>Roles:</span>
										<ChampionLanePositionTags positions={c.positions} />
									</div>
									<div className="flex flex-wrap items-center gap-2 text-xs 4xl:text-sm">
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

		return null;
	}, [filtered, view, version]);

	return (
		<div className="mx-auto w-full max-w-container px-6 py-12">
			<div className="flex h-full flex-col">
				<header className="mb-8">
					<h1 className="display gold-text text-4xl">Champions</h1>
					<p className="mt-2 text-xs text-muted-foreground lg:text-sm">
						Click any champion for detailed stats and abilities.
					</p>
				</header>

				<div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
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
							className="bg-card/60 inline-flex shrink-0 self-start overflow-hidden rounded-md border border-yellow-700/20 dark:border-border"
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
												className="w-px self-stretch bg-yellow-700/20 dark:bg-border"
												aria-hidden
											/>
										) : null}
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													aria-pressed={selected}
													className={
														'hover:bg-secondary/80 flex size-8 items-center justify-center text-muted-foreground transition-colors hover:opacity-80 md:size-10 ' +
														(selected
															? 'bg-yellow-700 text-primary-foreground hover:opacity-85 dark:bg-hex-gold'
															: '')
													}
													onClick={() => setRoleFilter(item.id)}
												>
													<img
														alt=""
														className={
															selected
																? 'size-5 shrink-0 brightness-0 invert md:size-6'
																: 'size-5 shrink-0 opacity-[0.82] dark:opacity-[0.42] dark:brightness-0 dark:invert md:size-6'
														}
														src={item.iconSrc}
														height={24}
														width={24}
													/>
												</button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="pointer-events-none select-none bg-yellow-700 text-white dark:bg-[#624e1e]"
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
							<div className="inline-flex -space-x-px rounded-md" role="group">
								<button
									title="Small grid"
									type="button"
									onClick={() => setView('small-grid')}
									className={clsx(
										'flex size-8 items-center justify-center rounded-l-md border border-yellow-700/20 text-muted-foreground hover:text-foreground focus:outline-none dark:border-border md:size-10',
										view === 'small-grid' &&
											'bg-yellow-700 !text-white dark:bg-hex-gold'
									)}
								>
									<Grid2x2 size={18} />
								</button>
								<button
									title="Large grid"
									type="button"
									onClick={() => setView('large-grid')}
									className={clsx(
										'border-yellow-700/18 flex size-8 items-center justify-center border text-muted-foreground hover:text-foreground focus:outline-none dark:border-border md:size-10',
										view === 'large-grid' &&
											'bg-yellow-700 !text-white dark:bg-hex-gold'
									)}
								>
									<Grid3x3 size={18} />
								</button>
								<button
									title="Table"
									type="button"
									onClick={() => setView('table')}
									className={clsx(
										'flex size-8 items-center justify-center rounded-r-md border border-yellow-700/20 text-muted-foreground hover:text-foreground focus:outline-none dark:border-border md:size-10',
										view === 'table' &&
											'bg-yellow-700 !text-white dark:bg-hex-gold'
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
							<SelectTrigger className="size-8 w-full min-w-32 border-yellow-700/20 !bg-transparent !bg-white dark:border-border dark:!bg-neutral-900 md:size-10">
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
					<p className="py-12 text-center text-muted-foreground">
						Could not load champions.
					</p>
				)}

				{patchAndListLoading && view === 'table' && (
					<div className="hex-border overflow-hidden rounded-md border-2">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="px-4">Name</TableHead>
									<TableHead className="px-4">Roles</TableHead>
									<TableHead className="px-4">Classes</TableHead>
									<TableHead className="px-4">Released</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from({ length: 12 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell className="px-4 py-3">
											<Skeleton className="h-5 w-32" />
											<Skeleton className="mt-2 h-3 w-24" />
										</TableCell>
										<TableCell className="px-4 py-3">
											<Skeleton className="h-5 w-20" />
										</TableCell>
										<TableCell className="px-4 py-3">
											<Skeleton className="h-6 w-28" />
										</TableCell>
										<TableCell className="px-4 py-3">
											<Skeleton className="h-4 w-24" />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}

				{patchAndListLoading && view !== 'table' && (
					<div
						className={clsx(
							'grid',
							view === 'large-grid' &&
								'grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8',
							view === 'small-grid' &&
								'lg:grid-cols-16 grid-cols-6 gap-1 md:grid-cols-12'
						)}
					>
						{Array.from({
							length: view === 'small-grid' ? 72 : 30,
						}).map((_, i) =>
							view === 'small-grid' ? (
								<div
									key={i}
									className="hex-border border-border/60 bg-card/40 w-full animate-pulse overflow-hidden rounded-md border-2"
								>
									<Skeleton className="aspect-square w-full rounded-none" />
								</div>
							) : (
								<div
									key={i}
									className="hex-border border-border/60 bg-card/40 animate-pulse overflow-hidden rounded-md border-2"
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
						{view === 'table' ? (
							<>
								{filtered.length > 0 ? (
									<ChampionsTableView
										champions={filtered}
										releaseDates={bonusReleaseDates}
									/>
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
										<img
											src="/images/bee.webp"
											alt="No results"
											className="mx-auto mb-2 size-20 2xl:size-28"
										/>
										<span className="text-sm lg:text-base 5xl:text-lg">
											No champions match your search.
										</span>
									</div>
								)}
							</>
						) : (
							<div
								className={clsx(
									'grid',
									view === 'large-grid' &&
										'grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8',
									view === 'small-grid' &&
										'lg:grid-cols-16 grid-cols-6 gap-1 md:grid-cols-12'
								)}
							>
								{gridContent}
								{filtered.length === 0 && (
									<div className="col-span-full flex items-center justify-center py-1 text-muted-foreground">
										<div>
											<img
												src="/images/bee.webp"
												alt="No results"
												className="mx-auto mb-2 size-20 2xl:size-28"
											/>
											<span className="text-sm lg:text-base 5xl:text-lg">
												No champions match your search.
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
