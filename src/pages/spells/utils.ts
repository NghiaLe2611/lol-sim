import { apiUrl } from '@/constants/common';

export type DdragonSummonerSpellImage = {
	full: string;
	sprite: string;
	group: string;
	x: number;
	y: number;
	w: number;
	h: number;
};

export type DdragonSummonerSpell = {
	id: string;
	name: string;
	description: string;
	cooldownBurn: string;
	rangeBurn: string;
	summonerLevel: number;
	modes: string[];
	image: DdragonSummonerSpellImage;
};

export type DdragonSummonerPayload = {
	type: string;
	version: string;
	data: Record<string, DdragonSummonerSpell>;
};

export type SummonerSpellView = DdragonSummonerSpell;

export function summonerSpellSpriteUrl(version: string, spriteFile: string): string {
	return `${apiUrl}/cdn/${version}/img/sprite/${spriteFile}`;
}

/** Full spell icon — e.g. …/img/spell/SummonerFlash.png */
export function summonerSpellImgUrl(version: string, spellId: string): string {
	return `${apiUrl}/cdn/${version}/img/spell/${spellId}.png`;
}

/** LoL summoner description HTML → safe-ish markup for popover. */
export function prepareSummonerDescriptionHtml(description: string): string {
	let html = description.trim();
	const mainMatch = html.match(/<mainText>([\s\S]*?)<\/mainText>/i);
	if (mainMatch) html = mainMatch[1];

	return html
		.replace(/<br\s*\/?>/gi, '<br />')
		.replace(/class="colorFF99FF00"/gi, 'class="text-hex-gold font-medium"')
		.replace(/class="colorFFFFFFFF"/gi, 'class="text-foreground"')
		.replace(/class="colorFF8B4513"/gi, 'class="text-orange-400"')
		.replace(
			/<attention>([\s\S]*?)<\/attention>/gi,
			'<em class="text-muted-foreground">$1</em>'
		);
}

export function parseClassicSummonerSpells(payload: DdragonSummonerPayload): SummonerSpellView[] {
	return Object.values(payload.data)
		.filter((spell) => spell.modes.includes('CLASSIC'))
		.sort((a, b) => a.name.localeCompare(b.name));
}
