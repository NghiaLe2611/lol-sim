/** Lane / role filter */
export type ChampionRoleFilter = 'All' | 'Top' | 'Jungle' | 'Mid' | 'AD' | 'Support';

const ROLE_FILTER_TO_POSITIONS: Record<Exclude<ChampionRoleFilter, 'All'>, readonly string[]> = {
	Top: ['TOP'],
	Jungle: ['JUNGLE'],
	Mid: ['MIDDLE', 'MID'],
	AD: ['BOTTOM', 'CARRY', 'ADC'],
	Support: ['SUPPORT', 'UTILITY'],
};

export function selectBonusPositionsOnly(raw: unknown): Record<string, string[]> {
	if (!Array.isArray(raw)) return {};
	const out: Record<string, string[]> = {};
	for (const row of raw) {
		if (!row || typeof row !== 'object') continue;
		const championId = (row as { key?: unknown }).key;
		if (typeof championId !== 'string' || !championId) continue;
		const positions = (row as { positions?: unknown }).positions;
		out[championId] = Array.isArray(positions)
			? positions.map((p) => String(p).trim().toUpperCase())
			: [];
	}
	return out;
}

export function fallbackLanePositionsFromTags(tags: string[]): string[] {
	const tagSet = new Set(tags);
	const out = new Set<string>();

	if (tagSet.has('Support')) out.add('SUPPORT');
	if (tagSet.has('Fighter')) out.add('TOP');
	if (tagSet.has('Tank')) out.add('TOP');
	if (tagSet.has('Fighter') && tagSet.has('Assassin')) out.add('JUNGLE');
	if (tagSet.has('Mage')) out.add('MID');
	if (tagSet.has('Marksman')) out.add('BOTTOM');

	return Array.from(out);
}

function hasChampionTag(tags: string[], tag: string) {
	return tags.includes(tag);
}

/** Top: Fighter hoặc Tank */
function matchesRoleTopByTags(tags: string[]): boolean {
	return hasChampionTag(tags, 'Fighter') || (hasChampionTag(tags, 'Tank') && !hasChampionTag(tags, 'Support'));
}

/**
 * Jungle: Assassin hoặc Tank hoặc (Fighter và Mage) hoặc (Fighter và Tank).
 * Không jungle nếu class chính của API (`tags[0]`) là Mage — ưu tiên Mid.
 */
function matchesRoleJungleByTags(tags: string[]): boolean {
	if (
		tags[0] === 'Mage' ||
		tags.includes('Support') ||
		tags.includes('Marksman') ||
		(tags.includes('Fighter') && tags.includes('Assassin'))
	)
		return false;
	return (
		hasChampionTag(tags, 'Assassin') ||
		hasChampionTag(tags, 'Tank') ||
		(hasChampionTag(tags, 'Fighter') && hasChampionTag(tags, 'Mage')) ||
		(hasChampionTag(tags, 'Fighter') && hasChampionTag(tags, 'Tank'))
	);
}

/** Mid: tag đầu tiên của API phải là Mage (Mage ở vị trí thứ hai không hợp lệ). */
function matchesRoleMidByTags(tags: string[]): boolean {
	return hasChampionTag(tags, 'Mage') || hasChampionTag(tags, 'Assassin');
}

/** AD (Bot): có Marksman */
function matchesRoleADByTags(tags: string[]): boolean {
	return hasChampionTag(tags, 'Marksman');
}

/** Support */
function matchesRoleSupportByTags(tags: string[]): boolean {
	return hasChampionTag(tags, 'Support');
}

/** Filter lane/role theo Riot class tags (khi không có bonus positions). */
export function matchesRoleByTags(filter: ChampionRoleFilter, tags: string[]): boolean {
	switch (filter) {
		case 'All':
			return true;
		case 'Top':
			return matchesRoleTopByTags(tags);
		case 'Jungle':
			return matchesRoleJungleByTags(tags);
		case 'Mid':
			return matchesRoleMidByTags(tags);
		case 'AD':
			return matchesRoleADByTags(tags);
		case 'Support':
			return matchesRoleSupportByTags(tags);
		default:
			return true;
	}
}

/** Filter lane/role theo bonus positions từ API. */
export function matchesRoleByPositions(filter: ChampionRoleFilter, positions: string[]): boolean {
	if (filter === 'All') return true;
	const set = new Set(positions);
	const needles = ROLE_FILTER_TO_POSITIONS[filter];
	return needles.some((n) => set.has(n.toUpperCase()));
}

/** Chọn logic filter: positions khi bonusPositionsMap ok, tags khi không. */
export function matchesChampionRoleFilter(
	filter: ChampionRoleFilter,
	tags: string[],
	positions: string[],
	bonusPositionsAvailable: boolean
): boolean {
	if (filter === 'All') return true;
	return bonusPositionsAvailable
		? matchesRoleByPositions(filter, positions)
		: matchesRoleByTags(filter, tags);
}

export const ROLE_BAR_ITEMS: readonly {
	id: ChampionRoleFilter;
	iconSrc: string;
	tooltip: string;
}[] = [
	{ id: 'All', iconSrc: '/images/icons/all.svg', tooltip: 'All' },
	{ id: 'Top', iconSrc: '/images/icons/top.svg', tooltip: 'Top' },
	{ id: 'Jungle', iconSrc: '/images/icons/jungle.svg', tooltip: 'Jungle' },
	{ id: 'Mid', iconSrc: '/images/icons/mid.svg', tooltip: 'Mid' },
	{ id: 'AD', iconSrc: '/images/icons/ad.svg', tooltip: 'Bot / ADC' },
	{ id: 'Support', iconSrc: '/images/icons/support.svg', tooltip: 'Support' },
];

const LANE_ORDER: Exclude<ChampionRoleFilter, 'All'>[] = ['Top', 'Jungle', 'Mid', 'AD', 'Support'];

export function getLanePositions(positions: string[]): Exclude<ChampionRoleFilter, 'All'>[] {
	const set = new Set(positions.map((p) => p.toUpperCase()));
	return LANE_ORDER.filter((lane) =>
		ROLE_FILTER_TO_POSITIONS[lane].some((n) => set.has(n.toUpperCase()))
	);
}
