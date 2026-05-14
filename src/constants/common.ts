export const links = [
	{ to: '/', labelKey: 'nav.home' as const, prefix: '' },
	{ to: '/champions', labelKey: 'nav.champions' as const, prefix: '/champions' },
	{ to: '/items', labelKey: 'nav.items' as const, prefix: '/items' },
	{ to: '/runes', labelKey: 'nav.runes' as const, prefix: '/runes' },
	{ to: '/spells', labelKey: 'nav.spells' as const, prefix: '/spells' },
	{ to: '/build', labelKey: 'nav.build' as const, prefix: '/build' },
];

export const apiUrl = 'https://ddragon.leagueoflegends.com';

export const STALE_MS = 10 * 60 * 1000;

/** Splash — dùng `id` trong JSON champion (same as `/champions/:championId`). */
export function splashChampionImg(championId: string) {
	return `${apiUrl}/cdn/img/champion/splash/${championId}_0.jpg`;
}

export function passiveImgUrl(version: string, imageFull: string) {
	return `${apiUrl}/cdn/${version}/img/passive/${imageFull}`;
}

// https://cdn.communitydragon.org/latest/champion/Ahri/ability-icon/p
export function skillImgUrl(version: string, imageFull: string) {
	return `${apiUrl}/cdn/${version}/img/spell/${imageFull}`;
}

// Get square champion img
function replaceSpace(str: string): string {
	return str.replace(/\s+/g, '_');
}
export const getSquareChampImg = (patchVersion = '16.9.1', championName: string) =>
	`https://leagueofitems.com/images/champions/tiles/256/${Number(championName)}.webp`; // 128/256

// Tile
// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/${championName.toLowerCase()}/skins/base/images/${championName.toLowerCase()}_splash_tile_0.jpg
// https://lolcdn.darkintaqt.com/cdn/champion/${championName}/tile
// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/hwei/skins/skin0/images/hwei_splash_tile_0.jpg
// https://wiki.leagueoflegends.com/en-us/images/${championName.toLowerCase()}_OriginalTile.jpg

// Square
// https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${championName}.png
// https://cdn.communitydragon.org/${patchVersion}/champion/${encodeURIComponent(championName)}/square
// https://leagueofitems.com/images/champions/tiles/128/238.webp
