import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { itemImgUrl, STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { ItemGridCell } from '@/pages/items/ItemGridCell';
import {
	parseDdragonItemMap,
	parseDdragonItems,
	type DdragonItemsPayload,
} from '@/pages/items/utils';
import { getItems } from '@/services/api';
import { rankDisplayNameSearch } from '@/utils/common';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export default function ItemsPage() {
	const [search, setSearch] = useState('');
	const { patchVersion, isPatchReady } = useAppContext();

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

	const srItems = itemsQuery.data?.items ?? [];
	const itemsById = itemsQuery.data?.byId ?? {};

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return srItems;
		return srItems
			.map((item) => ({ item, rank: rankDisplayNameSearch(q, item.name) }))
			.filter((row) => row.rank != null)
			.sort((a, b) => {
				if (a.rank! !== b.rank!) return a.rank! - b.rank!;
				return a.item.name.localeCompare(b.item.name);
			})
			.map((row) => row.item);
	}, [srItems, search]);

	const isLoading = !isPatchReady || itemsQuery.isPending;

	return (
		<div className="mx-auto w-full max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">List of items</h1>
				<p className="text-muted-foreground mt-2">
					All in-game items for League of Legends (Summoner's Rift).
				</p>
			</header>

			<div className="mb-8 flex flex-col gap-4 md:flex-row">
				<div className="md:w-96">
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
			</div>

			{isLoading ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
					<Spinner type="default" className="size-10 text-hex-gold" />
					<Skeleton className="h-4 w-48" />
				</div>
			) : itemsQuery.isError ? (
				<p className="text-muted-foreground py-12 text-center">Failed to load items.</p>
			) : (
				<div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-[repeat(18,minmax(0,1fr))] 2xl:grid-cols-[repeat(24,minmax(0,1fr))] gap-0.5">
					{filtered.map((item) => (
						<ItemGridCell
							key={item.id}
							item={item}
							itemsById={itemsById}
							patchVersion={patchVersion!}
						/>
					))}
					{filtered.length === 0 ? (
						<p className="text-muted-foreground col-span-full py-12 text-center">
							No items match your search.
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
