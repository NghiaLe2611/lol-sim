/** Shapes aligned with `/champions/:key` bonus API (Meraki-like). */

export type BonusNumericStatBlock = {
	flat?: number;
	percent?: number;
	perLevel?: number;
	percentPerLevel?: number;
};

export type BonusModifierRow = {
	values: Array<number | string>;
	units: string[];
};

export type BonusCostCooldown = {
	modifiers?: BonusModifierRow[];
	affectedByCdr?: boolean;
};

export type BonusLevelingBlock = {
	attribute: string;
	modifiers: BonusModifierRow[];
};

export type BonusEffect = {
	description: string;
	leveling: BonusLevelingBlock[];
};

export type BonusAbility = {
	name: string;
	icon: string;
	effects: BonusEffect[];
	cost: BonusCostCooldown | null;
	cooldown: BonusCostCooldown | null;
	targeting?: string | null;
	resource?: string | null;
	blurb?: string | null;
	notes?: string | null;
	castTime?: string | number | null;
	width?: string | number | null;
	speed?: string | number | null;
	effectRadius?: string | number | null;
	targetRange?: string | number | null;
};

export type BonusAbilities = {
	P?: BonusAbility[];
	Q?: BonusAbility[];
	W?: BonusAbility[];
	E?: BonusAbility[];
	R?: BonusAbility[];
};

export type BonusAttributeRatings = {
	damage?: number;
	toughness?: number;
	control?: number;
	mobility?: number;
	utility?: number;
	abilityReliance?: number;
	difficulty?: number;
};

/** Parsed bonus champion detail — loose `unknown` for forward compat. */
export type BonusChampionDetail = {
	id: number | string;
	key: string;
	name: string;
	title: string;
	fullName?: string;
	lore?: string;
	icon?: string;
	resource?: string;
	adaptiveType?: string;
	attackType?: string;
	stats?: Record<string, BonusNumericStatBlock | unknown>;
	positions?: string[];
	roles?: string[];
	attributeRatings?: BonusAttributeRatings;
	abilities?: BonusAbilities;
	releaseDate?: string;
	faction?: string;
};

export function isBonusNumericStat(v: unknown): v is BonusNumericStatBlock {
	if (!v || typeof v !== 'object') return false;
	const o = v as BonusNumericStatBlock;
	return ['flat', 'perLevel'].some((k) => typeof (o as Record<string, unknown>)[k] === 'number');
}

export function bonusStatAbbreviation(key: string): { short: string; label: string } {
	const preset: Record<string, { short: string; label: string }> = {
		health: { short: 'HP', label: 'Health' },
		healthRegen: { short: 'HP5', label: 'Health regen per 5s' },
		mana: { short: 'MP', label: 'Mana' },
		manaRegen: { short: 'MP5', label: 'Mana regen per 5s' },
		armor: { short: 'AR', label: 'Armor' },
		magicResistance: { short: 'MR', label: 'Magic Resistance' },
		attackDamage: { short: 'AD', label: 'Attack Damage' },
		movespeed: { short: 'MS', label: 'Move Speed' },
		attackSpeed: { short: 'AS', label: 'Attack Speed' },
		attackSpeedRatio: { short: 'AS ratio', label: 'Attack Speed ratio' },
		attackCastTime: { short: 'ACast', label: 'Attack windup cast time' },
		attackTotalTime: { short: 'ATime', label: 'Attack total cycle time' },
		attackRange: { short: 'ATT Range', label: 'Attack Range' },
		criticalStrikeDamage: { short: 'Crit dmg', label: 'Critical Strike Damage' },
		criticalStrikeDamageModifier: { short: 'Crit mod', label: 'Critical Strike Damage Modifier' },
		gameplayRadius: { short: 'Gb radius', label: 'Gameplay Collision Radius' },
		pathingRadius: { short: 'Path radius', label: 'Pathfinding Collision Radius' },
		selectionRadius: { short: 'Sel radius', label: 'Selection Radius' },
		acquisitionRadius: { short: 'Acq radius', label: 'Acquisition Radius' },
		attackDelayOffset: { short: 'ADelay', label: 'Attack delay offset' },
	};

	if (preset[key]) return preset[key];

	const label = key
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^\w/, (c) => c.toUpperCase());
	const initials = label
		.split(/\s+/)
		.map((w) => w[0]!.toUpperCase())
		.join('')
		.slice(0, 4);
	return { short: initials.length > 0 ? initials : key.slice(0, 3).toUpperCase(), label };
}

function formatNum(v: number | string): string {
	if (typeof v === 'string') return v;
	return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '');
}

/** Collapse `90 / 90 / 90` → `90` when every slash segment is identical (cost, cooldown, base leveling). */
function compressIdenticalSlashValues(s: string): string {
	const trimmed = s.trim();
	if (!trimmed) return '';
	const chunks = trimmed
		.split(/\s*\/\s*/)
		.map((t) => t.trim())
		.filter((c) => c.length > 0);
	if (chunks.length <= 1) return trimmed;
	const first = chunks[0];
	if (chunks.every((c) => c === first)) return first!;
	return trimmed;
}

export function formatSlashValues(mod: BonusModifierRow | undefined): string {
	if (!mod?.values?.length) return '';
	const raw = mod.values.map((v, i) => `${formatNum(v)}${mod.units[i] ?? ''}`.trim()).join(' / ');
	return compressIdenticalSlashValues(raw);
}

export function formatCostLine(cost: BonusCostCooldown | null, championResource?: string): string | null {
	if (!cost?.modifiers?.length) return null;
	const first = cost.modifiers[0];
	const body = formatSlashValues(first);
	if (!body) return null;
	const suff =
		championResource && /\d/.test(body) ? ` ${String(championResource)}` : '';
	return `${body}${suff}`;
}

export function formatCooldownLine(cd: BonusCostCooldown | null): string | null {
	if (!cd?.modifiers?.length) return null;
	return formatSlashValues(cd.modifiers[0]);
}

function formatScalingPart(v: number | string, unit: string): string {
	const val = formatNum(v);
	const u = unit.trim();
	if (!u) return val;
	const isPctScaling = u.includes('%') || /\b(AP|AD|AH)\b/i.test(u);
	if (isPctScaling) {
		const spacer = /^%/.test(u) ? '' : ' ';
		return `(+ ${val}${spacer}${u})`.replace(/\s+/g, ' ').trim();
	}
	return `${val}${unit}`;
}

function partIsScalingToken(p: string): boolean {
	return p.trim().startsWith('(+');
}

/** Merge per-level `(+ 40% AP)` groups: identical → one; varying coefficient, same suffix → `(+ 40/45/50% AP)`. */
function compressScalingParenthesesGroup(parts: string[]): string {
	if (parts.length === 0) return '';
	const norm = parts.map((p) => p.replace(/\s+/g, ' ').trim());
	if (norm.every((p) => p === norm[0])) return norm[0]!;

	const parsed = norm.map((p) => {
		const m = p.match(/^\(\+\s*([0-9.]+)\s*(.*?)\)$/);
		if (!m) return null;
		return { num: m[1], suffix: m[2].trim() };
	});
	if (parsed.every((x) => x)) {
		const suffixes = new Set(parsed.map((x) => x!.suffix));
		if (suffixes.size === 1) {
			const suffix = parsed[0]!.suffix;
			const nums = parsed.map((x) => x!.num).join(' / ');
			const spacer =
				suffix.length === 0 ? '' : suffix.startsWith('%') ? '' : ' ';
			return `(+ ${nums}${spacer}${suffix})`;
		}
	}
	return norm.join(' ');
}

function modifierRowLooksLikeBase(mod: BonusModifierRow): boolean {
	if (!mod.values.length) return false;
	return mod.values.every((_, i) => {
		const u = (mod.units[i] ?? '').trim();
		return !u.includes('%') && !/\b(AP|AD|AH)\b/i.test(u);
	});
}

function modifierRowLooksLikeScaling(mod: BonusModifierRow): boolean {
	if (!mod.values.length) return false;
	return mod.values.every((_, i) => {
		const u = (mod.units[i] ?? '').trim();
		return u.includes('%') || /\b(AP|AD|AH)\b/i.test(u);
	});
}

function formatOneModifierRowCompact(mod: BonusModifierRow): string | null {
	if (!mod.values?.length) return null;
	const parts = mod.values.map((v, i) => formatScalingPart(v, mod.units[i] ?? ''));
	const allScaling = parts.every((p) => partIsScalingToken(p));
	const joined = allScaling ? compressScalingParenthesesGroup(parts) : compressIdenticalSlashValues(parts.join(' / '));
	return joined || null;
}

/**
 * Lines for a leveling attribute: base + scaling rows merge into one line when the API splits them.
 * Repeating identical scaling collapses; varying % with the same unit suffix uses `40/45/50` in one `(+ …)`.
 */
export function formatLevelingModifierLines(modifiers: BonusModifierRow[]): string[] {
	if (!modifiers.length) return [];

	const first = modifiers[0]!;
	const rest = modifiers.slice(1);

	if (
		rest.length > 0 &&
		modifierRowLooksLikeBase(first) &&
		rest.every((m) => modifierRowLooksLikeScaling(m))
	) {
		const baseParts = first.values.map((v, i) => formatScalingPart(v, first.units[i] ?? ''));
		const baseLine = compressIdenticalSlashValues(baseParts.join(' / '));
		const scaleParts = rest.flatMap((m) =>
			m.values.map((v, i) => formatScalingPart(v, m.units[i] ?? ''))
		);
		const scaleLine = compressScalingParenthesesGroup(scaleParts);
		const merged = [baseLine, scaleLine].filter(Boolean).join(' ');
		return merged ? [merged] : [];
	}

	const lines: string[] = [];
	for (const mod of modifiers) {
		const line = formatOneModifierRowCompact(mod);
		if (line) lines.push(line);
	}
	return lines;
}

export function formatAbilityScalar(v: string | number | null | undefined): string | null {
	if (v == null || v === '') return null;
	const s = String(v).trim();
	return s.length ? s.toUpperCase() === 'NONE' ? 'NONE' : s : null;
}

const REJECT_STATS = /^(__proto__|prototype)$/;

/** League ARAM / URF tweaks — omit from summary grid. */
const MODE_STAT_PREFIXES = ['aram', 'urf'];

export function shouldShowBonusStatKey(key: string): boolean {
	if (REJECT_STATS.test(key)) return false;
	const low = key.toLowerCase();
	if (MODE_STAT_PREFIXES.some((p) => low.startsWith(p))) return false;
	return true;
}

export function roleTokenToBadge(token: string): string {
	const t = token.toLowerCase().replace(/_/g, ' ');
	return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Render chip: icon from `public/images/icons` + lane label (API `positions`). */
export type LanePositionTagMeta = {
	key: string;
	icon: string;
	label: string;
};

const LANE_POSITION_DEFS: readonly {
	key: string;
	icon: string;
	label: string;
	tokens: readonly string[];
}[] = [
	{ key: 'TOP', icon: '/images/icons/top.svg', label: 'Top', tokens: ['TOP', 'TOP_LANE'] },
	{ key: 'JUNGLE', icon: '/images/icons/jungle.svg', label: 'Jungle', tokens: ['JUNGLE'] },
	{
		key: 'MID',
		icon: '/images/icons/mid.svg',
		label: 'Mid',
		tokens: ['MIDDLE', 'MID', 'MID_LANE', 'CENTER'],
	},
	{
		key: 'BOTTOM',
		icon: '/images/icons/ad.svg',
		label: 'Bottom',
		tokens: ['BOTTOM', 'CARRY', 'ADC', 'BOT', 'BOTTOM_LANE', 'MARKSMAN'],
	},
	{
		key: 'SUPPORT',
		icon: '/images/icons/support.svg',
		label: 'Support',
		tokens: ['SUPPORT', 'UTILITY'],
	},
];

const LANE_ORDER_RANK: Record<string, number> = Object.fromEntries(
	LANE_POSITION_DEFS.map((d, i) => [d.key, i])
);

export function normalizeLanePositionToken(raw: string): string {
	return raw
		.trim()
		.toUpperCase()
		.replace(/\s+/g, '_')
		.replace(/-+/g, '_');
}

/** Một giá trị `positions[]` của API → icon + nhãn hiển thị. */
export function mapLanePositionToTag(raw: string): LanePositionTagMeta | null {
	const u = normalizeLanePositionToken(raw);
	for (const def of LANE_POSITION_DEFS) {
		if (def.tokens.includes(u)) {
			return { key: def.key, icon: def.icon, label: def.label };
		}
	}
	return null;
}

function laneUnknownLabel(raw: string): string {
	const t = normalizeLanePositionToken(raw).replace(/_/g, ' ').toLowerCase();
	return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function laneTagsFromPositions(positions: readonly string[] | undefined): LanePositionTagMeta[] {
	const list = positions ?? [];
	const seen = new Set<string>();
	const out: LanePositionTagMeta[] = [];
	for (const raw of list) {
		const trimmed = typeof raw === 'string' ? raw.trim() : '';
		if (!trimmed) continue;
		const mapped = mapLanePositionToTag(trimmed);
		const tag: LanePositionTagMeta = mapped ?? {
			key: `other:${normalizeLanePositionToken(trimmed)}`,
			icon: '/images/icons/all.svg',
			label: laneUnknownLabel(trimmed),
		};
		if (seen.has(tag.key)) continue;
		seen.add(tag.key);
		out.push(tag);
	}
	out.sort((a, b) => {
		const ra = LANE_ORDER_RANK[a.key] ?? 50;
		const rb = LANE_ORDER_RANK[b.key] ?? 50;
		return ra !== rb ? ra - rb : a.label.localeCompare(b.label);
	});
	return out;
}

export function coerceBonusDetail(raw: unknown): BonusChampionDetail | null {
	if (!raw || typeof raw !== 'object') return null;
	const r = raw as Record<string, unknown>;
	if (typeof r.name !== 'string') return null;
	const key = typeof r.key === 'string' ? r.key : r.name;
	return { ...(raw as Record<string, unknown>), key } as BonusChampionDetail;
}
