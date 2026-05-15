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
	return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, '');
}

export function formatSlashValues(mod: BonusModifierRow | undefined): string {
	if (!mod?.values?.length) return '';
	return mod.values.map((v, i) => `${formatNum(v)}${mod.units[i] ?? ''}`.trim()).join(' / ');
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

/** One string per modifier row inside a leveling attribute (slashes vs scaling parentheses). */
export function formatLevelingModifierLines(modifiers: BonusModifierRow[]): string[] {
	const lines: string[] = [];
	for (const mod of modifiers) {
		if (!mod.values?.length) continue;
		const parts = mod.values.map((v, i) => formatScalingPart(v, mod.units[i] ?? ''));
		const allScaling = parts.every((p) => p.startsWith('(+'));
		lines.push(allScaling ? parts.join(' ') : parts.join(' / '));
	}
	return lines.filter(Boolean);
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
