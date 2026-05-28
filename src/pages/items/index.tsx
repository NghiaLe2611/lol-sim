import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { itemImgUrl, STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import {
	applyBonusToSrItemMap,
	applyBonusToSrItems,
	matchesItemCategoryFilter,
	parseDdragonItemMap,
	parseDdragonItems,
	selectBonusItemsById,
	type DdragonItemsPayload,
	type ItemCategoryFilter,
} from '@/pages/items/utils';
import { getBonusItems, getItems } from '@/services/api';
import { capitalizeText, rankDisplayNameSearch } from '@/utils/common';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import ItemPopover from './components/ItemPopover';
import clsx from 'clsx';

const FILTER_CATEGORIES: ItemCategoryFilter[] = ['all', 'attack', 'magic', 'defense', 'boots'];
const FILTER_TAGS = [
	'attack speed',
	'critical',
	'life steel',
	'HP',
	'mana',
	'armor',
	'magic resistance',
	'ability haste',
	'lethality',
	'movement speed',
];

export default function ItemsPage() {
	const { patchVersion, isPatchReady } = useAppContext();
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState<ItemCategoryFilter>('all');
	const [tag, setTag] = useState<string | null>(null);

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

	const bonusItemsQuery = useQuery({
		queryKey: ['items_bonus'],
		queryFn: () => getBonusItems(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: selectBonusItemsById,
		retry: false,
	});

	const bonusById = bonusItemsQuery.data ?? {};

	const srItems = useMemo(() => {
		const items = itemsQuery.data?.items ?? [];
		return applyBonusToSrItems(items, bonusById);
	}, [itemsQuery.data?.items, bonusById]);

	const itemsById = useMemo(() => {
		const byId = itemsQuery.data?.byId ?? {};
		return applyBonusToSrItemMap(byId, bonusById);
	}, [itemsQuery.data?.byId, bonusById]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		const byCategory = srItems.filter((item) =>
			matchesItemCategoryFilter(category, item.tags)
		);

		if (!q) return byCategory;

		return byCategory
			.map((item) => ({ item, rank: rankDisplayNameSearch(q, item.name) }))
			.filter((row) => row.rank != null)
			.sort((a, b) => {
				if (a.rank! !== b.rank!) return a.rank! - b.rank!;
				return a.item.name.localeCompare(b.item.name);
			})
			.map((row) => row.item);
	}, [srItems, search, category]);

	const isLoading = !isPatchReady || itemsQuery.isPending;
	return (
		<div className="mx-auto w-full max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">List of items</h1>
				<p className="text-muted-foreground mt-2">
					All in-game items for League of Legends (Summoner's Rift).
				</p>
			</header>

			<div className="mb-6 flex flex-col gap-2">
				<div className="flex flex-col lg:flex-row gap-4">
					<div className="w-full lg:w-96">
						<SearchAutocomplete
							getImgUrl={(item) => itemImgUrl(patchVersion!, item.id) as string}
							getLabel={(item) => item.name}
							items={srItems}
							matchIncludes
							onChange={setSearch}
							placeholder="Search items..."
							value={search}
						/>
					</div>
					<div className="flex flex-wrap items-center">
						{FILTER_CATEGORIES.map((cate) => (
							<button
								key={cate}
								onClick={() => {
									setCategory(cate);
									setTag(null);
								}}
								type="button"
								className={clsx(
									'text-muted-foreground text-xs lg:text-sm hover:opacity-80 py-1 px-3 border-b-2 border-transparent',
									{
										'!text-hex-gold font-medium bg-hex-gold/10 !border-hex-gold':
											cate === category,
									}
								)}
							>
								{capitalizeText(cate)}
							</button>
						))}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{FILTER_TAGS.map((t) => (
						<button
							key={t}
							onClick={() => setTag(t)}
							type="button"
							className={clsx(
								'bg-background text-muted-foreground text-xs 5xl:text-sm hover:opacity-80 py-1 px-3 border border-neutral-400/50 dark:border-hex-gold/50 rounded-sm',
								{
									'!text-hex-gold font-medium bg-hex-gold/10 !border-hex-gold':
										t === tag,
								}
							)}
						>
							{capitalizeText(t)}
						</button>
					))}
				</div>
			</div>

			{isLoading ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
					<Spinner type="default" className="size-10 text-hex-gold" />
					<Skeleton className="h-4 w-48" />
				</div>
			) : itemsQuery.isError ? (
				<p className="text-muted-foreground py-12 text-center">Failed to load items.</p>
			) : (
				<div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-[repeat(18,minmax(0,1fr))] 2xl:grid-cols-[repeat(24,minmax(0,1fr))] gap-2">
					{filtered.map((item) => (
						<ItemPopover
							key={item.id}
							item={item}
							itemsById={itemsById}
							patchVersion={patchVersion!}
						>
							<button
								type="button"
								className="hover:scale-105 w-full overflow-hidden bg-muted/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
								aria-label={item.name}
							>
								<div className="aspect-square">
									<img
										alt={item.name}
										className="h-full w-full object-cover rounded-md hex-border border-2"
										loading="lazy"
										src={itemImgUrl(patchVersion as string, item.id)}
									/>
								</div>
								<p className="text-muted-foreground text-center text-xs lg:text-sm font-medium">
									{item.goldTotal ? item.goldTotal : <>&nbsp;</>}
								</p>
							</button>
						</ItemPopover>
					))}
					{filtered.length === 0 ? (
						<p className="text-muted-foreground col-span-full py-12 text-center">
							No items match your filters.
						</p>
					) : null}
				</div>
			)}
		</div>
	);
}

/*
"HealthRegen",
"ManaRegen",
"OnHit"
"Consumable",
"Lane",
"Jungle"
"Active",
"Trinket",
"Vision"
*/
