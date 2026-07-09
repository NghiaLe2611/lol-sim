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
	stats?: Record<string, number>;
};

export type DdragonItemsPayload = {
	data: Record<string, DdragonItemApi>;
};

/** Bonus item fields merged from Meraki `/items` API (matched by id). */
export type ItemBonusMeta = {
	tier?: number;
	rank: string[];
	/** From `shop.tags` only — champion role tags (FIGHTER, MARKSMAN, …). */
	roles: string[];
	iconOverlay?: boolean;
	passives?: Record<string, any>[] | undefined;
	stats?: Record<string, any> | undefined;
	group?: string;
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
	/** DDragon shop category tags (Damage, Boots, …). */
	tags: string[];
	tier?: number;
	rank?: string[];
	roles: string[];
	iconOverlay?: boolean;
	/** DDragon stat modifiers from items API (FlatHPPoolMod, PercentAttackSpeedMod, …). */
	attrs?: Record<string, number>;
	/** Meraki bonus stats from bonus items API. */
	stats?: Record<string, any>;
	passives?: Record<string, any>[] | undefined;
	group?: string;
};

function normalizeSrItemId(id: number | string): string {
	return String(id).padStart(4, '0');
}

/** Build lookup `id` → bonus fields from bonus items array. */
export function selectBonusItemsById(raw: unknown): Record<string, ItemBonusMeta> {
	if (!Array.isArray(raw)) return {};

	const out: Record<string, ItemBonusMeta> = {};
	for (const row of raw) {
		if (!row || typeof row !== 'object') continue;

		const id = normalizeSrItemId((row as { id?: number | string }).id ?? '');
		if (!isSrItemId(id)) continue;

		const shop = (row as { shop?: { tags?: unknown } }).shop;
		const rankRaw = (row as { rank?: unknown }).rank;
		const tierRaw = (row as { tier?: unknown }).tier;
		const iconOverlay = (row as { iconOverlay?: unknown }).iconOverlay;

		const roles = Array.isArray(shop?.tags) ? shop?.tags.map((t) => String(t)) : [];

		out[id] = {
			tier: typeof tierRaw === 'number' ? tierRaw : undefined,
			rank: Array.isArray(rankRaw) ? rankRaw.map(String) : [],
			roles: roles ?? [],
			iconOverlay: iconOverlay === true,
			passives: row.passives,
			stats: row.stats,
			group: row.group,
		};
	}
	return out;
}

export function applyBonusToSrItem(item: SrItem, bonus?: ItemBonusMeta): SrItem {
	if (!bonus) {
		return { ...item, roles: item.roles ?? [] };
	}

	return {
		...item,
		roles: bonus.roles,
		// tier: bonus.tier,
		// rank: bonus.rank.length > 0 ? bonus.rank : undefined,
		passives: bonus.passives,
		stats: bonus.stats,
		group: bonus.group,
	};
}

export function applyBonusToSrItems(
	items: SrItem[],
	bonusById: Record<string, ItemBonusMeta>
): SrItem[] {
	return items.map((item) => applyBonusToSrItem(item, bonusById[item.id]));
}

export function applyBonusToSrItemMap(
	byId: Record<string, SrItem>,
	bonusById: Record<string, ItemBonusMeta>
): Record<string, SrItem> {
	const out: Record<string, SrItem> = {};
	for (const [id, item] of Object.entries(byId)) {
		out[id] = applyBonusToSrItem(item, bonusById[id]);
	}
	return out;
}

export type ItemCategoryFilter = 'all' | 'attack' | 'magic' | 'defense' | 'boots';

const ITEM_CATEGORY_TAGS: Record<Exclude<ItemCategoryFilter, 'all'>, readonly string[]> = {
	attack: ['Damage'],
	magic: ['SpellDamage'],
	defense: ['SpellBlock', 'Armor', 'Health'],
	boots: ['Boots'],
};

export function matchesItemCategoryFilter(category: ItemCategoryFilter, tags: string[]): boolean {
	if (category === 'all') return true;

	const tagSet = new Set(tags);

	// Simple categories
	if (category !== 'defense') {
		return ITEM_CATEGORY_TAGS[category].some((t) => tagSet.has(t));
	}

	// Defense logic
	const hasDamage = tagSet.has('Damage');
	const hasSpellDamage = tagSet.has('SpellDamage');
	const hasAttackSpeed = tagSet.has('AttackSpeed');

	// SpellBlock & Armor: must be pure defense (no damage/AS)
	if (
		(tagSet.has('SpellBlock') || tagSet.has('Armor')) &&
		!hasDamage &&
		!hasSpellDamage &&
		!hasAttackSpeed
	) {
		return true;
	}

	// Health: can have AttackSpeed, but no main damage
	if (tagSet.has('Health') && !hasDamage && !hasSpellDamage) {
		return true;
	}

	return false;
}

// ddragon stats
export const ITEM_STATS_KEY = [
	'FlatSpellBlockMod',
	'FlatHPPoolMod',
	'FlatMPPoolMod',
	'FlatMagicDamageMod',
	'PercentMovementSpeedMod',
	'FlatMovementSpeedMod',
	'FlatArmorMod',
	'FlatPhysicalDamageMod',
	'PercentAttackSpeedMod',
	'PercentLifeStealMod',
	'FlatCritChanceMod',
];

export const ITEM_TAG_FILTERS = [
	'attack damage',
	'attack speed',
	'critical strike',
	'on hit',
	'life steal',
	'magic damage',
	'mana',
	'armor',
	'magic resistance',
	'lethality',
	'magic pen',
	'HP',
	'ability haste',
	'movement speed',
] as const;

export type ItemTagFilter = (typeof ITEM_TAG_FILTERS)[number];

/** UI tag label → DDragon `tags` values (OR within each entry). */
const ITEM_TAG_TO_DDRAGON: Record<ItemTagFilter, readonly string[]> = {
	'attack damage': ['Damage'],
	'attack speed': ['AttackSpeed'],
	'critical strike': ['CriticalStrike'],
	'on hit': ['OnHit'],
	'life steal': ['LifeSteal', 'SpellVamp'],
	'magic damage': ['SpellDamage'],
	mana: ['Mana'],
	armor: ['Armor'],
	'magic resistance': ['MagicResist', 'SpellBlock'],
	lethality: ['ArmorPenetration'],
	'magic pen': ['MagicPenetration'],
	HP: ['Health'],
	'ability haste': ['AbilityHaste', 'CooldownReduction'],
	'movement speed': ['Boots', 'NonbootsMovement'],
};

export function matchesItemTagFilter(tagFilter: string | null, tags: string[]): boolean {
	if (!tagFilter) return true;

	const ddragonTags = ITEM_TAG_TO_DDRAGON[tagFilter as ItemTagFilter];
	if (!ddragonTags) return true;

	const tagSet = new Set(tags);
	return ddragonTags.some((t) => tagSet.has(t));
}

/** UI tag label → bonus item `stats` keys (OR within each entry). */
const ITEM_TAG_TO_BONUS_STAT: Record<ItemTagFilter, readonly string[]> = {
	'attack damage': ['attackDamage', 'physicalDamage'],
	'attack speed': ['attackSpeed'],
	'critical strike': ['crit', 'criticalStrike'],
	'on hit': ['onHit'],
	'life steal': ['lifeSteal', 'spellVamp', 'omnivamp'],
	'magic damage': ['abilityPower', 'magicDamage', 'spellDamage'],
	mana: ['mana'],
	armor: ['armor'],
	'magic resistance': ['magicResistance'],
	lethality: ['lethality', 'armorPenetration'],
	'magic pen': ['magicPenetration'],
	HP: ['health'],
	'ability haste': ['abilityHaste', 'cooldownReduction'],
	'movement speed': ['movespeed', 'movementSpeed'],
};

function getBonusStatMagnitude(value: unknown): number {
	if (value == null) return 0;
	if (typeof value === 'number') return Math.abs(value);
	if (typeof value === 'object') {
		const o = value as Record<string, unknown>;
		let sum = 0;
		for (const k of ['flat', 'percent', 'perLevel', 'percentPerLevel']) {
			const n = o[k];
			if (typeof n === 'number') sum += Math.abs(n);
		}
		return sum;
	}
	return 0;
}

function hasBonusStat(stats: Record<string, any>, keys: readonly string[]): boolean {
	return keys.some((key) => getBonusStatMagnitude(stats[key]) > 0);
}

/** Match tag chip via Meraki bonus `stats` (when bonus items API is available). */
export function matchesItemTagFilterByBonusStats(
	tagFilter: string | null,
	stats: Record<string, any> | undefined
): boolean {
	if (!tagFilter || !stats) return false;

	const bonusKeys = ITEM_TAG_TO_BONUS_STAT[tagFilter as ItemTagFilter];
	if (!bonusKeys) return false;

	return hasBonusStat(stats, bonusKeys);
}

/**
 * Tag chip filter for build/items: bonus `stats` when API works, else DDragon `tags`.
 * Same chip labels as `ITEM_TAG_FILTERS`; fallback matches `matchesItemTagFilter`.
 */
export function matchesItemTagFilterForItem(
	tagFilter: string | null,
	item: SrItem,
	options?: { bonusAvailable?: boolean }
): boolean {
	if (!tagFilter) return true;

	if (options?.bonusAvailable && matchesItemTagFilterByBonusStats(tagFilter, item.stats)) {
		return true;
	}

	return matchesItemTagFilter(tagFilter, item.tags);
}

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
	magicDamage: 'text-blue-600 dark:text-blue-400',
	speed: 'text-teal-500 dark:text-teal-400',
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
		tags: item.tags ?? [],
		roles: [],
		group: item?.tags?.includes('Boots') ? 'Boots' : undefined, // add group Boots to ddragon items
		attrs: item.stats ?? {},
	};
}

// All SR items by id
export function parseDdragonItemMap(
	payload: DdragonItemsPayload | undefined
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

// Filter build items
export function isBuildableItem(item: SrItem): boolean {
	return (
		item.goldTotal > 0 &&
		!item.tags?.includes('Vision') &&
		['Consumable', 'Lane'].every((string) => !item.tags?.includes(string))
	);
}

// Filter items by their main category using DDragon shop tags for the Build page
export function matchesBuildCategory(category: string, itemTags: string[]): boolean {
	if (category === 'all') return true;
	const tagSet = new Set(itemTags);
	if (category === 'attack') {
		return (
			tagSet.has('Damage') ||
			tagSet.has('AttackSpeed') ||
			tagSet.has('CriticalStrike') ||
			tagSet.has('ArmorPenetration')
		);
	}
	if (category === 'magic') {
		return tagSet.has('SpellDamage') || tagSet.has('MagicPenetration') || tagSet.has('Mana');
	}
	if (category === 'defense') {
		return (
			tagSet.has('Armor') ||
			tagSet.has('SpellBlock') ||
			tagSet.has('Health') ||
			tagSet.has('HealthRegen')
		);
	}
	if (category === 'support') {
		return (
			tagSet.has('Support') ||
			tagSet.has('GoldInflow') ||
			tagSet.has('Aura') ||
			tagSet.has('Active')
		);
	}
	if (category === 'boots') {
		return tagSet.has('Boots');
	}
	return true;
}
