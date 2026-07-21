import {
	isBuildableItem,
	matchesBuildCategory,
	matchesItemTagFilterForItem,
	type SrItem,
} from '@/pages/items/utils';

export type BuildItemCategory = 'all' | 'attack' | 'magic' | 'defense' | 'support' | 'boots';

export const BUILD_ITEM_CATEGORIES: { id: BuildItemCategory; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'attack', label: 'Attack' },
	{ id: 'magic', label: 'Magic' },
	{ id: 'defense', label: 'Defense' },
	{ id: 'support', label: 'Support' },
	{ id: 'boots', label: 'Boots' },
];

export function countBuildItemsByCategory(srItems: SrItem[]) {
	const buildableItems = srItems.filter(isBuildableItem);
	return {
		all: buildableItems.length,
		attack: buildableItems.filter((item) => matchesBuildCategory('attack', item.tags)).length,
		magic: buildableItems.filter((item) => matchesBuildCategory('magic', item.tags)).length,
		defense: buildableItems.filter((item) => matchesBuildCategory('defense', item.tags)).length,
		support: buildableItems.filter((item) => matchesBuildCategory('support', item.tags)).length,
		boots: buildableItems.filter((item) => matchesBuildCategory('boots', item.tags)).length,
	};
}

export function filterBuildItems(
	srItems: SrItem[],
	options: {
		search: string;
		category: BuildItemCategory;
		subFilter: string | null;
		hasBonusItems: boolean;
	}
): SrItem[] {
	const q = options.search.trim().toLowerCase();
	let list = srItems.filter(isBuildableItem);

	list = list.filter((item) => matchesBuildCategory(options.category, item.tags));

	if (options.subFilter) {
		list = list.filter((item) =>
			matchesItemTagFilterForItem(options.subFilter, item, {
				bonusAvailable: options.hasBonusItems,
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
}
