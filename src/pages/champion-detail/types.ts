export type DdragonSkinApi = {
	id: string;
	num: number;
	name: string;
	chromas?: boolean;
	parentSkin?: number;
};

export type ChampionSpellApi = {
	id: string;
	name: string;
	description: string;
	cooldownBurn: string;
	costBurn: string;
	rangeBurn: string;
	image: { full: string };
};

/** Data Dragon champion detail (fallback UI). */
export type ChampionDetailApi = {
	id: string;
	key: string;
	name: string;
	title: string;
	lore: string;
	blurb: string;
	tags: string[];
	partype: string;
	info: { attack: number; defense: number; magic: number; difficulty: number };
	stats: Record<string, number>;
	spells: ChampionSpellApi[];
	passive: { name: string; description: string; image: { full: string } };
	skins?: DdragonSkinApi[];
	releaseDate?: string;
	releasedate?: string;
	released?: string;
};

export type ChampionDetailPayload = {
	data: Record<string, ChampionDetailApi>;
};
