const CDRAGON_RUNE_CARDS_BASE =
	'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/perks/images';

const CDRAGON_PERK_IMAGES_BASE =
	'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';

export type DdragonRune = {
	id: number;
	key: string;
	icon: string;
	name: string;
	shortDesc: string;
	longDesc: string;
};

export type DdragonRuneSlot = {
	runes: DdragonRune[];
};

export type DdragonRunePath = {
	id: number;
	key: string;
	icon: string;
	name: string;
	slots: DdragonRuneSlot[];
};

export function runePathCardUrl(pathKey: string): string {
	return `${CDRAGON_RUNE_CARDS_BASE}/${pathKey.toLowerCase()}/inventory_card.jpg`;
}

/** `perk-images/Styles/Domination/Electrocute/Electrocute.png` → lowercase path under v1. */
export function normalizePerkIconPath(icon: string): string {
	return icon.replace(/^perk-images\/Styles\//i, 'perk-images/styles/').toLowerCase();
}

const CDRAGON_STATMOD_BASE =
	'https://raw.communitydragon.org/latest/game/assets/perks/statmods';

export function runeShardImgUrl(iconPath: string): string {
	const filename = iconPath.split('/').pop()?.toLowerCase() ?? '';
	return `${CDRAGON_STATMOD_BASE}/${filename}`;
}

export function runePerkImgUrl(icon: string): string {
	return `${CDRAGON_PERK_IMAGES_BASE}/${normalizePerkIconPath(icon)}`;
}

export function runePathIconUrl(icon: string): string {
	return runePerkImgUrl(icon);
}

/** Unwrap custom tags; keep inner text only (for longDesc popover). */
export function stripRuneMarkupToText(html: string): string {
	let s = html.replace(/<br\s*\/?>/gi, '\n');
	let prev = '';
	while (s !== prev) {
		prev = s;
		s = s.replace(/<([a-z][a-z0-9]*)[^>]*>([\s\S]*?)<\/\1>/gi, '$2');
	}
	return s
		.replace(/<[^>]+>/g, '')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n[ \t]+/g, '\n')
		.replace(/[ \t]{2,}/g, ' ')
		.trim();
}

/** shortDesc in dialog — strip LoL tags, keep basic emphasis. */
export function prepareRuneShortDescHtml(html: string): string {
	return html
		.replace(
			/<lol-uikit-tooltipped-keyword[^>]*>([\s\S]*?)<\/lol-uikit-tooltipped-keyword>/gi,
			'$1'
		)
		.replace(/<keywordMajor>([\s\S]*?)<\/keywordMajor>/gi, '$1')
		.replace(/<trueDamage>([\s\S]*?)<\/trueDamage>/gi, '$1')
		.replace(/<speed>([\s\S]*?)<\/speed>/gi, '$1')
		.replace(/<gold>([\s\S]*?)<\/gold>/gi, '$1')
		.replace(/<attention>([\s\S]*?)<\/attention>/gi, '$1')
		.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1')
		.replace(/<br\s*\/?>/gi, ' ');
}

export function parseRunePaths(payload: DdragonRunePath[] | undefined): DdragonRunePath[] {
	if (!Array.isArray(payload)) return [];
	return payload;
}
