import type { ChampionSkin } from '@/pages/champion-detail/ChampionSkinList';
import type { DdragonSkinApi } from '@/pages/champion-detail/types';

const CDR_ASSETS_BASE =
	'https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/characters';

function ddragonSkinFolder(num: number): string {
	if (num === 0) return 'base';
	return `skin${String(num).padStart(2, '0')}`;
}

/** e.g. Ahri num 3 → `.../ahri/skins/skin03/ahriloadscreen_3.jpg` */
export function ddragonSkinLoadScreenUrl(championId: string, num: number): string {
	const slug = championId.toLowerCase();
	const folder = ddragonSkinFolder(num);
	const filename =
		num === 0 ? `${slug}loadscreen.jpg` : `${slug}loadscreen_${num}.jpg`;
	return `${CDR_ASSETS_BASE}/${slug}/skins/${folder}/${filename}`;
}

/** Uncentered splash for lightbox (same skin folder, `/images/`). */
export function ddragonSkinUncenteredSplashUrl(championId: string, num: number): string {
	const slug = championId.toLowerCase();
	const folder = ddragonSkinFolder(num);
	return `${CDR_ASSETS_BASE}/${slug}/skins/${folder}/images/${slug}_splash_uncentered_${num}.jpg`;
}

function formatDdragonSkinName(name: string): string {
	if (name === 'default') return 'Original';
	return name;
}

/** Top-level skins only — excludes chroma rows with `parentSkin`. */
export function mapDdragonSkinsToChampionSkins(
	championId: string,
	skins: DdragonSkinApi[] | undefined,
): ChampionSkin[] {
	if (!skins?.length) return [];

	return skins
		.filter((s) => s.parentSkin == null)
		.map((s) => ({
			id: Number(s.id) || s.num,
			name: formatDdragonSkinName(s.name),
			loadScreenPath: ddragonSkinLoadScreenUrl(championId, s.num),
			uncenteredSplashPath: ddragonSkinUncenteredSplashUrl(championId, s.num),
		}));
}
