export const links = [
	{ to: '/', labelKey: 'nav.home' as const, prefix: '' },
	{ to: '/champions', labelKey: 'nav.champions' as const, prefix: '/champions' },
	{ to: '/items', labelKey: 'nav.items' as const, prefix: '/items' },
	{ to: '/runes', labelKey: 'nav.runes' as const, prefix: '/runes' },
	{ to: '/spells', labelKey: 'nav.spells' as const, prefix: '/spells' },
	{ to: '/build', labelKey: 'nav.build' as const, prefix: '/build' },
];

export const apiUrl = 'https://ddragon.leagueoflegends.com';

export const DDRAGON_LIST_STALE_MS = 10 * 60 * 1000;

// Get square champion img
export const cdragonChampionSquareUrl = (patchVersion = '16.9.1', championId: string) =>
	`https://cdn.communitydragon.org/${patchVersion}/champion/${encodeURIComponent(championId)}/square`;
// https://ddragon.leagueoflegends.com/cdn/16.9.1/img/champion/Aatrox.png
