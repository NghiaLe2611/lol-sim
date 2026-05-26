export type DdragonItemApi = {
	name: string;
	description: string;
	plaintext: string;
	gold: { total: number; base?: number; purchasable?: boolean; sell?: number };
	image: { full: string };
	tags?: string[];
	maps?: Record<string, boolean>;
	from: string[];
	into: string[];
	hideFromAll?: boolean;
};

export type DdragonItemsPayload = {
	data: Record<string, DdragonItemApi>;
};

export type SrItem = {
	id: string;
	name: string; // search name
	nameLines: string[];
	description: string;
	plaintext: string;
	goldTotal: number;
	from: string[];
	into: string[];
};

const SR_ITEM_ID = /^\d{4}$/;

export const ITEM_COLORED_TAGS = ['physicalDamage', 'scaleHealth', 'magicDamage', 'speed'] as const;

export type ItemColoredTag = (typeof ITEM_COLORED_TAGS)[number];

export type ItemDescriptionPart =
	| { kind: 'text'; value: string }
	| { kind: 'colored'; tag: ItemColoredTag; value: string };

export type ItemPassiveBlock = {
	title: string;
	parts: ItemDescriptionPart[];
};

/** Tailwind classes for LoL description damage/stat tags. */
export const ITEM_TAG_TEXT_CLASS: Record<ItemColoredTag, string> = {
	physicalDamage: 'text-orange-600 dark:text-orange-400',
	scaleHealth: 'text-green-600 dark:text-green-400',
	magicDamage: 'text-purple-600 dark:text-purple-400',
	speed: 'text-blue-600 dark:text-blue-400',
};

// Summoner's Rift items
export function isSrItemId(id: string): boolean {
	return SR_ITEM_ID.test(id);
}

// Filter by map
export function isItemOnSrMaps(maps: Record<string, boolean> | undefined): boolean {
	// return maps?.['11'] === true || maps?.['12'] === true;
	return maps?.['11'] === true;
}

function stripLolItemMarkupChunk(html: string): string {
	return html
		.replace(/<attention>([\s\S]*?)<\/attention>/gi, '$1 ')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function formatItemNameLines(nameHtml: string): string[] {
	const raw = nameHtml.trim();
	if (!raw) return [];

	if (!raw.includes('<')) {
		return [raw];
	}

	return raw
		.split(/<br\s*\/?>/i)
		.map(stripLolItemMarkupChunk)
		.filter(Boolean);
}

// Format plaintext
export function formatItemPlaintext(plaintextHtml: string): string {
	const raw = plaintextHtml.trim();
	if (!raw) return '';

	const mainTextMatch = raw.match(/<mainText>([\s\S]*?)<\/mainText>/i);
	const inner = mainTextMatch ? mainTextMatch[1] : raw;

	return inner
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/<attention>([\s\S]*?)<\/attention>/gi, '$1 ')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function mapSrItemFromEntry(id: string, item: DdragonItemApi): SrItem | null {
	if (!isSrItemId(id) || !isItemOnSrMaps(item.maps) || item.hideFromAll === true) {
		return null;
	}

	const nameLines = formatItemNameLines(item.name ?? '');
	const namePlain = nameLines.join(' ') || stripLolItemMarkupChunk(item.name ?? '');

	return {
		id,
		name: namePlain,
		nameLines: nameLines.length > 0 ? nameLines : [namePlain],
		description: item.description ?? '',
		plaintext: formatItemPlaintext(item.plaintext ?? ''),
		goldTotal: item.gold?.total ?? 0,
		from: item.from ?? [],
		into: item.into ?? [],
	};
}

/** All SR items by id (includes duplicates-by-name used as recipe components). */
export function parseDdragonItemMap(
	payload: DdragonItemsPayload | undefined,
): Record<string, SrItem> {
	if (!payload?.data) return {};

	const out: Record<string, SrItem> = {};
	for (const [id, item] of Object.entries(payload.data)) {
		const mapped = mapSrItemFromEntry(id, item);
		if (mapped) out[id] = mapped;
	}
	return out;
}

export function parseDdragonItems(payload: DdragonItemsPayload | undefined): SrItem[] {
	const byId = parseDdragonItemMap(payload);
	const mapped = Object.values(byId).sort((a, b) => Number(a.id) - Number(b.id));

	const seenNames = new Set<string>();
	const deduped: SrItem[] = [];
	for (const item of mapped) {
		const key = item.name.toLowerCase();
		if (seenNames.has(key)) continue;
		seenNames.add(key);
		deduped.push(item);
	}

	return deduped.sort((a, b) => a.name.localeCompare(b.name));
}

// Format item stats
export function parseItemStatLines(description: string): string[] {
	const statsMatch = description.match(/<stats>([\s\S]*?)<\/stats>/i);
	if (!statsMatch) return [];

	const lines: string[] = [];
	for (const chunk of statsMatch[1].split(/<br\s*\/?>/i)) {
		const line = stripLolItemMarkupChunk(chunk);
		if (line) lines.push(line);
	}
	return lines;
}

function extractMainTextInner(description: string): string {
	const match = description.match(/<mainText>([\s\S]*?)<\/mainText>/i);
	return match ? match[1] : description;
}

function stripPlainDescriptionChunk(html: string): string {
	return html
		.replace(/<attention>([\s\S]*?)<\/attention>/gi, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();
}

/** Parse inline colored tags + plain text (preserves `\n` from `<br>`). */
export function parseItemDescriptionParts(html: string): ItemDescriptionPart[] {
	let src = html.replace(/<br\s*\/?>/gi, '\n');
	const parts: ItemDescriptionPart[] = [];
	const coloredRe = /<(physicalDamage|scaleHealth|magicDamage|speed)>([\s\S]*?)<\/\1>/i;

	while (src.length > 0) {
		const match = src.match(coloredRe);
		if (!match || match.index === undefined) {
			const plain = stripPlainDescriptionChunk(src);
			if (plain) parts.push({ kind: 'text', value: plain });
			break;
		}

		if (match.index > 0) {
			const plain = stripPlainDescriptionChunk(src.slice(0, match.index));
			if (plain) parts.push({ kind: 'text', value: plain });
		}

		const value = stripPlainDescriptionChunk(match[2]);
		if (value) {
			parts.push({ kind: 'colored', tag: match[1] as ItemColoredTag, value });
		}

		src = src.slice(match.index + match[0].length);
	}

	return parts;
}

/** `<passive>Title</passive> body…` blocks after `<stats>`. */
export function parseItemPassives(description: string): ItemPassiveBlock[] {
	const mainText = extractMainTextInner(description);
	const afterStats = mainText.replace(/<stats>[\s\S]*?<\/stats>/i, '');
	const trimmed = afterStats.replace(/^(?:\s|<br\s*\/?>)+/i, '').trim();
	if (!trimmed) return [];

	const blocks: ItemPassiveBlock[] = [];
	const passiveRe = /<passive>([\s\S]*?)<\/passive>([\s\S]*?)(?=<passive>|$)/gi;
	let match: RegExpExecArray | null;

	while ((match = passiveRe.exec(trimmed)) !== null) {
		const title = stripLolItemMarkupChunk(match[1]);
		if (!title) continue;
		blocks.push({
			title,
			parts: parseItemDescriptionParts(match[2]),
		});
	}

	return blocks;
}

export function parseItemDescription(description: string): {
	statLines: string[];
	passives: ItemPassiveBlock[];
} {
	return {
		statLines: parseItemStatLines(description),
		passives: parseItemPassives(description),
	};
}
