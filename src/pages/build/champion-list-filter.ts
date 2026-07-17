import {
	matchesChampionRoleFilter,
	type ChampionRoleFilter,
} from '@/pages/champions/role-filter';
import type { ChampionListRow } from '@/types/champions';

export function championsFromQueryData(data: unknown): ChampionListRow[] {
	if (!data || typeof data !== 'object') return [];
	const record = (data as { data?: Record<string, ChampionListRow> }).data;
	return Object.values(record || {}) as ChampionListRow[];
}

export function filterChampionListRows(
	list: ChampionListRow[],
	options: {
		search: string;
		role: ChampionRoleFilter;
		bonusPositionsMap: Record<string, string[]>;
		hasBonusData: boolean;
	}
): ChampionListRow[] {
	let filtered = list;

	const q = options.search.trim().toLowerCase();
	if (q) {
		filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
	}

	if (options.role !== 'All') {
		filtered = filtered.filter((c) =>
			matchesChampionRoleFilter(
				options.role,
				c.tags || [],
				options.bonusPositionsMap[c.id] || [],
				options.hasBonusData
			)
		);
	}

	return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
}
