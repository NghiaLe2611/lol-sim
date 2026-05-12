import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DDRAGON_LIST_STALE_MS, cdragonChampionSquareUrl } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { getChampions } from '@/services/api';
import { matchesDisplayNamePrefix } from '@/utils/common';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ChampionListRow = {
	id: string;
	name: string;
	title: string;
	tags: string[];
};

type ChampionsApiPayload = {
	data: Record<string, ChampionListRow>;
};

// ['All', 'Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank']

/** Lane / role filter */
export type ChampionRoleFilter = 'All' | 'Top' | 'Jungle' | 'Mid' | 'AD' | 'Support';

function championsFromPayload(payload: ChampionsApiPayload): ChampionListRow[] {
	return Object.values(payload.data).sort((a, b) => a.name.localeCompare(b.name));
}

function hasTag(tags: string[], t: string) {
	return tags.includes(t);
}

/** Top: Fighter hoặc Tank */
function matchesRoleTop(tags: string[]): boolean {
	return hasTag(tags, 'Fighter') || (hasTag(tags, 'Tank') && !hasTag(tags, 'Support'));
}

/**
 * Jungle: Assassin hoặc Tank hoặc (Fighter và Mage) hoặc (Fighter và Tank).
 */
function matchesRoleJungle(tags: string[]): boolean {
	return (
		hasTag(tags, 'Assassin') ||
		hasTag(tags, 'Tank') ||
		(hasTag(tags, 'Fighter') && hasTag(tags, 'Mage')) ||
		(hasTag(tags, 'Fighter') && hasTag(tags, 'Tank'))
	);
}

/** Mid: tag đầu tiên của API phải là Mage (Mage ở vị trí thứ hai không hợp lệ). */
function matchesRoleMid(tags: string[]): boolean {
	return tags[0] === 'Mage' || hasTag(tags, 'Assassin');
}

/** AD (Bot): có Marksman */
function matchesRoleAD(tags: string[]): boolean {
	return hasTag(tags, 'Marksman');
}

/** Support */
function matchesRoleSupport(tags: string[]): boolean {
	return hasTag(tags, 'Support');
}

function matchesRole(filter: ChampionRoleFilter, tags: string[]): boolean {
	switch (filter) {
		case 'All':
			return true;
		case 'Top':
			return matchesRoleTop(tags);
		case 'Jungle':
			return matchesRoleJungle(tags);
		case 'Mid':
			return matchesRoleMid(tags);
		case 'AD':
			return matchesRoleAD(tags);
		case 'Support':
			return matchesRoleSupport(tags);
		default:
			return true;
	}
}

const ROLE_BAR_ITEMS: readonly {
	id: ChampionRoleFilter;
	iconSrc: string;
	tooltip: string;
}[] = [
	{ id: 'All', iconSrc: '/images/icons/all.svg', tooltip: 'All champions' },
	{ id: 'Top', iconSrc: '/images/icons/top.svg', tooltip: 'Top lane' },
	{ id: 'Jungle', iconSrc: '/images/icons/jungle.svg', tooltip: 'Jungle' },
	{ id: 'Mid', iconSrc: '/images/icons/mid.svg', tooltip: 'Mid lane' },
	{ id: 'AD', iconSrc: '/images/icons/ad.svg', tooltip: 'Bot / ADC' },
	{ id: 'Support', iconSrc: '/images/icons/support.svg', tooltip: 'Support' },
];

export default function ChampionsPage() {
	const { patchVersion: version } = useAppContext();
	const { data, isPending, isError } = useQuery({
		queryKey: ['champions', version],
		queryFn: () => getChampions(version!),
		enabled: Boolean(version),
		staleTime: DDRAGON_LIST_STALE_MS,
		gcTime: DDRAGON_LIST_STALE_MS,
	});

	const list = useMemo(() => {
		if (!data || typeof data !== 'object' || !('data' in data)) return [];
		return championsFromPayload(data as ChampionsApiPayload);
	}, [data]);

	const [search, setSearch] = useState('');
	const [roleFilter, setRoleFilter] = useState<ChampionRoleFilter>('All');

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
		return list.filter((c) => {
			const matchesSearch = matchesDisplayNamePrefix(q, c.name);
			/*
			const matchesTag = tag === 'All' || c.tags.includes(tag);
			return matchesSearch && matchesTag;
			*/
			const matchesRolePick = matchesRole(roleFilter, c.tags);
			return matchesSearch && matchesRolePick;
		});
	}, [list, search, roleFilter]);

	const patchAndListLoading = !isError && (!version || Boolean(version && isPending));

	const showChampionGrid = Boolean(version) && !isPending && !isError && data;

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">Champions</h1>
				<p className="text-muted-foreground mt-2">
					Click any champion for detailed stats and abilities.
				</p>
			</header>

			<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
				<div className="flex w-full min-w-0 items-center lg:max-w-md lg:flex-1">
					<SearchAutocomplete
						getLabel={(c) => c.name}
						inputClassName="h-8 w-full shrink-0 py-0 text-sm md:h-10 leading-normal"
						items={list}
						onChange={setSearch}
						placeholder="Search champions..."
						value={search}
					/>
				</div>

				<TooltipProvider delayDuration={200}>
					<div
						// border-hex-gold-dark dark:border-border
						className="bg-card/60 border-yellow-700/20 dark:border-border inline-flex shrink-0 overflow-hidden rounded-md border"
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
													'hover:opacity-80 text-muted-foreground hover:bg-secondary/80 flex size-8 items-center justify-center transition-colors md:size-10 ' +
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
										<TooltipContent side="bottom">
											{item.tooltip}
										</TooltipContent>
									</Tooltip>
								</Fragment>
							);
						})}
					</div>
				</TooltipProvider>

				{/*
				<div className="flex flex-wrap gap-2">
					{tags.map((tg) => (
						<button
							key={tg}
							className={
								'rounded-md border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ' +
								(tag === tg
									? 'font-medium border-hex-gold bg-hex-gold/10 text-hex-gold'
									: 'border-border text-muted-foreground hover:text-foreground')
							}
							onClick={() => setTag(tg)}
							type="button"
						>
							{tg}
						</button>
					))}
				</div>
				*/}
			</div>

			{isError && (
				<p className="text-muted-foreground py-12 text-center">Could not load champions.</p>
			)}

			{patchAndListLoading && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-10">
					{Array.from({ length: 30 }).map((_, i) => (
						<div
							key={i}
							className="hex-border animate-pulse overflow-hidden rounded-md border-border/60 bg-card/40"
						>
							<Skeleton className="aspect-square w-full rounded-none" />
							<div className="space-y-2 p-3">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-3 w-full" />
								<div className="flex gap-1 pt-1">
									<Skeleton className="h-5 w-14" />
									<Skeleton className="h-5 w-14" />
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{showChampionGrid && version && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-10">
					{filtered.map((c) => (
						<Link
							key={c.id}
							className="hex-border group hover:border-hex-gold relative overflow-hidden rounded-md border-2 transition-all hover:-translate-y-1"
							to={`/champions/${c.id}`}
						>
							<div className="aspect-square overflow-hidden bg-secondary">
								<img
									alt={c.name}
									className="h-full w-full rounded-t-md object-cover transition-transform group-hover:scale-[1.05]"
									loading="lazy"
									src={cdragonChampionSquareUrl(version, c.id)}
								/>
							</div>
							<div className="p-2">
								<h5 className="display text-base font-medium italic text-hex-gold">
									{c.name}
								</h5>
								<div className="mt-2 flex flex-wrap gap-1">
									{c.tags.map((tg) => (
										<Badge
											key={tg}
											className="border-hex-blue/40 text-[10px] text-hex-blue-glow"
											variant="outline"
										>
											{tg}
										</Badge>
									))}
								</div>
							</div>
						</Link>
					))}
					{filtered.length === 0 && (
						<div className="text-muted-foreground col-span-full py-12 text-center">
							No champions match your search.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
