import type { BonusAbility } from '../champion-detail/utils';

export type SkillFormulaPart = {
	kind:
		| 'base_damage'
		| 'ratio_damage'
		| 'coefficient'
		| 'interpolation'
		| 'flat_percent'
		| 'per_bonus_health';
	dataValue?: string;
	stat?: string;
	coefficient?: number;
	values?: number[];
	displayUnit?: number;
};

export type SkillDataField = {
	values?: number[];
	type?: string;
	formulaProfile?: string;
	calculation?: 'mFormulaParts' | 'mMultiplier';
	parts?: SkillFormulaPart[];
	baseCalculation?: string;
	multiplier?: { dataValue?: string; values?: number[]; constant?: number };
	multiplierMode?: 'scale' | 'bonus';
	displayMultiplier?: number;
	displayAsPercent?: boolean;
	scalarMultiplier?: number;
};

export type ChampionSkill = {
	id: string;
	name: string;
	description: string;
	rawDescription: string;
	maxRank: number;
	data: Record<string, SkillDataField | number[] | number | undefined>;
};

export type SkillDescriptionContext = {
	/** Skill rank (1–maxRank) */
	level: number;
	/** Champion total AD from build calculator */
	ad: number;
	/** Champion total AP from build calculator */
	ap: number;
	/** Champion level for interpolation formulas (default 18) */
	championLevel?: number;
	/** Bonus HP from items (total HP − base HP at level) */
	bonusHealth?: number;
};

export type SkillValueBreakdown = {
	base?: number;
	ratios?: { stat: string; ratio: number; amount: number }[];
};

export type SkillSegmentRole =
	| 'damage'
	| 'ratio_damage'
	| 'status'
	| 'recast'
	| 'attention'
	| 'literal'
	| 'bonus_health'
	| 'default';

export type SkillDescriptionSegment =
	| { kind: 'text'; text: string; role?: SkillSegmentRole; style?: string }
	| {
			kind: 'styled';
			style: string;
			role?: SkillSegmentRole;
			children: SkillDescriptionSegment[];
	  }
	| {
			kind: 'number';
			value: number;
			role?: SkillSegmentRole;
			style?: string;
			key?: string;
	  }
	| {
			kind: 'ratio_damage';
			text: string;
			stat: string;
			ratio: number;
			role?: SkillSegmentRole;
			style?: string;
			key?: string;
	  }
	| { kind: 'lineBreak' };

export type ParsedSkillDescription = {
	segments: SkillDescriptionSegment[];
	text: string;
};

export type SkillDetailRow = {
	label: string;
	values: string[];
	currentIndex?: number;
};

/** Collapse `40%/40%/40%` → `40%` when every rank value is identical. */
export function compressSkillDetailValues(values: string[]): string[] {
	if (values.length <= 1) return values;
	const first = values[0];
	if (values.every((value) => value === first)) return [first!];
	return values;
}

export function getSkillMaxRank(skillKey: string, skillDef?: ChampionSkill | null): number {
	if (skillDef?.maxRank) return skillDef.maxRank;
	return skillKey.toUpperCase() === 'R' ? 3 : 5;
}

export function formatCooldownNumber(value: number | string): string {
	const n = typeof value === 'number' ? value : Number(value);
	if (Number.isNaN(n)) return String(value);
	const rounded = Math.round(n * 10) / 10;
	return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

export type CooldownDisplay =
	| { kind: 'levelRange'; first: string; last: string }
	| { kind: 'single'; value: string };

export function getCooldownDisplay(
	values: Array<number | string> | undefined,
	skillKey: string,
	options?: { skillLevel?: number; skillDef?: ChampionSkill | null }
): CooldownDisplay | null {
	if (!values?.length) return null;

	const maxRank = getSkillMaxRank(skillKey, options?.skillDef);
	const formatted = values.map(formatCooldownNumber);

	if (values.length > maxRank) {
		return {
			kind: 'levelRange',
			first: formatted[0]!,
			last: formatted[formatted.length - 1]!,
		};
	}

	const skillLevel = options?.skillLevel ?? 0;
	const index = Math.min(Math.max(skillLevel, 1) - 1, formatted.length - 1);
	return { kind: 'single', value: formatted[index]! };
}

function buildCooldownDetailRow(
	values: Array<number | string>,
	skillKey: string,
	skillLevel: number,
	skillDef?: ChampionSkill | null
): SkillDetailRow {
	const maxRank = getSkillMaxRank(skillKey, skillDef);
	const formatted = values.map(formatCooldownNumber);
	const currentIndex = Math.min(Math.max(skillLevel, 1) - 1, formatted.length - 1);

	if (values.length > maxRank) {
		return {
			label: 'Cooldown',
			values: [`${formatted[0]} - ${formatted[formatted.length - 1]} (Based on Level)`],
			currentIndex: 0,
		};
	}

	return {
		label: 'Cooldown',
		values: formatted,
		currentIndex,
	};
}

type ComputedField = {
	total: number;
	formula: string;
	breakdown?: SkillValueBreakdown;
	percentBreakdown?: {
		flatPercent: number;
		bonusPercent: number;
		bonusHealth: number;
	};
};

/** Tailwind classes for LoL skill description tags and roles. */
export const SKILL_STYLE_COLORS: Record<string, string> = {
	default: 'text-muted-foreground',
	physicalDamage: 'text-orange-500 dark:text-orange-400',
	magicDamage: 'text-blue-500 dark:text-blue-400',
	trueDamage: 'text-neutral-100 dark:text-neutral-200',
	status: 'text-pink-500 dark:text-pink-400',
	speed: 'text-cyan-500 dark:text-cyan-400',
	scaleAD: 'text-orange-500 dark:text-orange-400',
	healing: 'text-green-500 dark:text-green-400',
	recast: 'text-emerald-500 dark:text-emerald-400',
	attention: 'text-hex-gold',
	spellPassive: 'text-hex-gold/90',
	lifeSteal: 'text-red-500 dark:text-red-400',
	bonus_health: 'text-green-500 dark:text-green-400',
	ratio: 'text-hex-gold',
	literal: 'text-muted-foreground/80',
};

const SKIP_PLACEHOLDERS = new Set(['spellmodifierdescriptionappend']);

function roundDisplay(value: number): number {
	return Math.round(value);
}

function clampLevel(level: number, maxRank: number): number {
	return Math.min(Math.max(level, 1), maxRank);
}

function levelIndex(level: number): number {
	return level - 1;
}

function statValue(stat: string | undefined, ctx: SkillDescriptionContext): number {
	switch (stat) {
		case 'AD':
			return ctx.ad;
		case 'AP':
			return ctx.ap;
		default:
			return 0;
	}
}

export function formatPercent(ratio: number): string {
	const pct = Math.round(ratio * 1000) / 10;
	return Number.isInteger(pct) ? `${pct}%` : `${pct}%`;
}

function formatPercentPoints(points: number): string {
	const pct = Math.round(points * 10) / 10;
	return Number.isInteger(pct) ? `${pct}%` : `${pct}%`;
}

function formatFormula(breakdown: SkillValueBreakdown): string {
	const chunks: string[] = [];
	if (breakdown.base !== undefined && breakdown.base !== 0) {
		chunks.push(String(roundDisplay(breakdown.base)));
	}
	for (const r of breakdown.ratios ?? []) {
		if (r.ratio === 0) continue;
		chunks.push(`${formatPercent(r.ratio)} ${r.stat}`);
	}
	return chunks.length > 0 ? chunks.join(' + ') : '0';
}

function roleForStyle(style?: string): SkillSegmentRole {
	if (!style) return 'default';
	if (style === 'status') return 'status';
	if (style === 'recast') return 'recast';
	if (style === 'attention') return 'attention';
	if (style === 'spellPassive') return 'attention';
	if (style === 'lifeSteal') return 'default';
	if (style === 'physicalDamage' || style === 'magicDamage' || style === 'trueDamage') {
		return 'damage';
	}
	return 'default';
}

export function getSegmentColorClass(segment: SkillDescriptionSegment): string {
	if (segment.kind === 'lineBreak') {
		return SKILL_STYLE_COLORS.default;
	}

	if (segment.role === 'bonus_health') {
		return SKILL_STYLE_COLORS.bonus_health;
	}

	if (segment.kind === 'ratio_damage' || segment.role === 'ratio_damage') {
		if (segment.style && SKILL_STYLE_COLORS[segment.style]) {
			return SKILL_STYLE_COLORS[segment.style];
		}
		return SKILL_STYLE_COLORS.ratio;
	}

	const style = segment.style;
	const role =
		segment.kind === 'styled' ? (segment.role ?? roleForStyle(segment.style)) : segment.role;

	if (role === 'literal') return SKILL_STYLE_COLORS.literal;
	if (role === 'ratio_damage') return SKILL_STYLE_COLORS.ratio;
	if (style && SKILL_STYLE_COLORS[style]) return SKILL_STYLE_COLORS[style];
	if (role && role !== 'default' && SKILL_STYLE_COLORS[role]) {
		return SKILL_STYLE_COLORS[role];
	}
	return SKILL_STYLE_COLORS.default;
}

function interpolateValue(part: { values?: number[] }, championLevel: number): number {
	const [start = 0, end = 0] = part.values ?? [];
	const t = Math.min(Math.max((championLevel - 1) / 17, 0), 1);
	return start + (end - start) * t;
}

function hasPercentFormulaParts(field: SkillDataField): boolean {
	return (
		field.parts?.some(
			(part) => part.kind === 'flat_percent' || part.kind === 'per_bonus_health'
		) ?? false
	);
}

function computePercentFormulaParts(
	field: SkillDataField,
	ctx: SkillDescriptionContext,
	idx: number
): ComputedField {
	const flatPart = field.parts?.find((part) => part.kind === 'flat_percent');
	const bonusPart = field.parts?.find((part) => part.kind === 'per_bonus_health');

	const flatPercent = flatPart?.values?.[idx] ?? 0;
	const ratioPerBonusHealth = bonusPart?.values?.[idx] ?? 0;
	const bonusHealth = Math.max(0, ctx.bonusHealth ?? 0);
	const bonusPercent = ratioPerBonusHealth * bonusHealth;
	const total = flatPercent + bonusPercent;

	return {
		total: Math.round(total * 10) / 10,
		formula: bonusHealth > 0 && bonusPercent > 0
			? `${formatPercentPoints(flatPercent)} (+${formatPercentPoints(bonusPercent)} per ${roundDisplay(bonusHealth)} bonus health)`
			: formatPercentPoints(flatPercent),
		percentBreakdown: {
			flatPercent,
			bonusPercent: Math.round(bonusPercent * 10) / 10,
			bonusHealth: roundDisplay(bonusHealth),
		},
	};
}

function defaultStatForDamageType(type?: string): string {
	switch (type) {
		case 'magicDamage':
			return 'AP';
		case 'physicalDamage':
			return 'AD';
		default:
			return 'AD';
	}
}

function resolveDamageStat(part: Pick<SkillFormulaPart, 'stat'>, fieldType?: string): string {
	if (fieldType === 'physicalDamage' || fieldType === 'magicDamage') {
		return defaultStatForDamageType(fieldType);
	}
	return part.stat ?? defaultStatForDamageType(fieldType);
}

function resolveRatioDamagePart(
	part: SkillFormulaPart,
	idx: number,
	fieldType?: string
): { stat: string; ratio: number } {
	const ratio = part.values?.[idx] ?? part.coefficient ?? 0;
	const stat = resolveDamageStat(part, fieldType);
	return { stat, ratio };
}

function ratioValuesForDetailRow(part: SkillFormulaPart, maxRank: number): number[] | null {
	if (part.values?.length) return part.values;
	if (part.coefficient !== undefined) {
		return Array.from({ length: maxRank }, () => part.coefficient!);
	}
	return null;
}

function computeFormulaParts(
	field: SkillDataField,
	ctx: SkillDescriptionContext,
	idx: number
): ComputedField {
	if (hasPercentFormulaParts(field)) {
		return computePercentFormulaParts(field, ctx, idx);
	}

	const breakdown: SkillValueBreakdown = { ratios: [] };
	let total = 0;
	const championLevel = ctx.championLevel ?? 18;

	for (const part of field.parts ?? []) {
		if (part.kind === 'base_damage') {
			const base = part.values?.[idx] ?? 0;
			breakdown.base = (breakdown.base ?? 0) + base;
			total += base;
			continue;
		}

		if (part.kind === 'ratio_damage') {
			const { stat, ratio } = resolveRatioDamagePart(part, idx, field.type);
			const amount = statValue(stat, ctx) * ratio;
			breakdown.ratios!.push({ stat, ratio, amount });
			total += amount;
			continue;
		}

		if (part.kind === 'coefficient') {
			const ratio = part.coefficient ?? 0;
			const stat = resolveDamageStat(part, field.type);
			const amount = statValue(stat, ctx) * ratio;
			breakdown.ratios!.push({ stat, ratio, amount });
			total += amount;
			continue;
		}

		if (part.kind === 'interpolation') {
			const value = interpolateValue(part, championLevel);
			breakdown.base = (breakdown.base ?? 0) + value;
			total += value;
		}
	}

	if (field.scalarMultiplier !== undefined) {
		total *= field.scalarMultiplier;
		if (breakdown.base !== undefined) breakdown.base *= field.scalarMultiplier;
		for (const r of breakdown.ratios ?? []) {
			r.amount *= field.scalarMultiplier;
			r.ratio *= field.scalarMultiplier;
		}
	}

	return {
		total: roundDisplay(total),
		formula: formatFormula(breakdown),
		breakdown,
	};
}

function scaleBreakdown(breakdown: SkillValueBreakdown, factor: number): SkillValueBreakdown {
	return {
		base: breakdown.base !== undefined ? breakdown.base * factor : undefined,
		ratios: breakdown.ratios?.map((r) => ({
			stat: r.stat,
			ratio: r.ratio * factor,
			amount: r.amount * factor,
		})),
	};
}

function computeMultiplierField(
	field: SkillDataField,
	skill: ChampionSkill,
	ctx: SkillDescriptionContext,
	idx: number,
	cache: Map<string, ComputedField>
): ComputedField {
	const baseKey = field.baseCalculation;
	if (!baseKey) {
		return { total: 0, formula: '0' };
	}

	const base = computeField(baseKey, skill, ctx, cache);
	const mult = field.multiplier?.values?.[idx] ?? field.multiplier?.constant ?? 0;
	const mode = field.multiplierMode ?? 'scale';

	if (mode === 'bonus') {
		const factor = 1 + mult;
		const scaled = scaleBreakdown(base.breakdown ?? {}, factor);
		return {
			total: roundDisplay(base.total * factor),
			formula: formatFormula(scaled),
			breakdown: scaled,
		};
	}

	return {
		total: roundDisplay(base.total * mult),
		formula: formatFormula(scaleBreakdown(base.breakdown ?? {}, mult)),
		breakdown: scaleBreakdown(base.breakdown ?? {}, mult),
	};
}

function computeDataValue(
	field: SkillDataField,
	idx: number,
	exprMultiplier?: number
): ComputedField {
	let value = field.values?.[idx] ?? 0;
	if (exprMultiplier !== undefined) {
		value *= exprMultiplier;
	}
	const display = field.displayAsPercent || Math.abs(exprMultiplier ?? 1) === 100;
	const formula = display ? formatPercent(Math.abs(value)) : String(roundDisplay(value));
	return {
		total: roundDisplay(Math.abs(value)),
		formula,
	};
}

function computeField(
	key: string,
	skill: ChampionSkill,
	ctx: SkillDescriptionContext,
	cache: Map<string, ComputedField>
): ComputedField {
	if (cache.has(key)) return cache.get(key)!;

	const level = clampLevel(ctx.level, skill.maxRank);
	const idx = levelIndex(level);
	const raw = skill.data[key];

	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		const result = { total: 0, formula: '0' };
		cache.set(key, result);
		return result;
	}

	const field = raw as SkillDataField;
	let result: ComputedField;

	if (field.calculation === 'mFormulaParts') {
		result = computeFormulaParts(field, ctx, idx);
	} else if (field.calculation === 'mMultiplier') {
		result = computeMultiplierField(field, skill, ctx, idx, cache);
	} else if (field.values) {
		result = computeDataValue(field, idx, field.displayMultiplier);
	} else {
		result = { total: 0, formula: '0' };
	}

	cache.set(key, result);
	return result;
}

function parsePlaceholderExpr(expr: string): { key: string; displayMultiplier?: number } {
	const trimmed = expr.trim();
	if (SKIP_PLACEHOLDERS.has(trimmed.toLowerCase())) {
		return { key: '' };
	}
	const mulMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*\*\s*(-?\d+(?:\.\d+)?)/);
	if (mulMatch) {
		return { key: mulMatch[1].toLowerCase(), displayMultiplier: parseFloat(mulMatch[2]) };
	}
	return { key: trimmed.replace(/\s+/g, '').toLowerCase() };
}

function expandComputedSegments(
	key: string,
	computed: ComputedField,
	style?: string,
	field?: SkillDataField
): SkillDescriptionSegment[] {
	const damageStyle = style ?? field?.type;
	const role = roleForStyle(damageStyle);
	const breakdown = computed.breakdown;
	const percentBreakdown = computed.percentBreakdown;

	if (percentBreakdown) {
		const { flatPercent, bonusPercent, bonusHealth } = percentBreakdown;
		const segments: SkillDescriptionSegment[] = [
			{
				kind: 'ratio_damage',
				text: formatPercentPoints(flatPercent),
				stat: '',
				ratio: flatPercent / 100,
				role: 'ratio_damage',
				style: damageStyle,
				key,
			},
		];

		if (bonusHealth > 0 && bonusPercent > 0) {
			segments.push({
				kind: 'text',
				text: ` (+${formatPercentPoints(bonusPercent)} per ${bonusHealth} bonus health)`,
				role: 'bonus_health',
			});
		}

		return segments;
	}

	const hasBase = breakdown?.base !== undefined && breakdown.base !== 0;
	const ratios = breakdown?.ratios ?? [];

	if (ratios.length > 0 && !hasBase) {
		const segments: SkillDescriptionSegment[] = [];
		for (const [index, ratioPart] of ratios.entries()) {
			if (index > 0) {
				segments.push({ kind: 'text', text: ' + ', role: 'literal' });
			}
			segments.push({
				kind: 'ratio_damage',
				text: `${formatPercent(ratioPart.ratio)} ${ratioPart.stat}`,
				stat: ratioPart.stat,
				ratio: ratioPart.ratio,
				role: 'ratio_damage',
				style: damageStyle,
				key,
			});
		}
		return segments;
	}

	const hasBreakdown =
		breakdown &&
		((breakdown.ratios?.length ?? 0) > 0 ||
			(breakdown.base !== undefined && breakdown.base !== 0));

	if (hasBreakdown) {
		const segments: SkillDescriptionSegment[] = [
			{
				kind: 'number',
				value: computed.total,
				role,
				style: damageStyle,
				key,
			},
			{ kind: 'text', text: ' (', role: 'literal' },
		];

		if (breakdown.base !== undefined && breakdown.base !== 0) {
			segments.push({
				kind: 'number',
				value: roundDisplay(breakdown.base),
				role,
				style: damageStyle,
				key,
			});
		}

		for (const [index, ratioPart] of (breakdown.ratios ?? []).entries()) {
			if (index > 0 || (breakdown.base !== undefined && breakdown.base !== 0)) {
				segments.push({ kind: 'text', text: ' + ', role: 'literal' });
			}
			segments.push({
				kind: 'ratio_damage',
				text: `${formatPercent(ratioPart.ratio)} ${ratioPart.stat}`,
				stat: ratioPart.stat,
				ratio: ratioPart.ratio,
				role: 'ratio_damage',
				key,
			});
		}

		segments.push({ kind: 'text', text: ')', role: 'literal' });
		return segments;
	}

	return [
		{
			kind: 'number',
			value: computed.total,
			role,
			style: damageStyle,
			key,
		},
	];
}

function parseInline(
	content: string,
	skill: ChampionSkill,
	ctx: SkillDescriptionContext,
	cache: Map<string, ComputedField>,
	parentStyle?: string
): SkillDescriptionSegment[] {
	const segments: SkillDescriptionSegment[] = [];
	const regex = /\{\{\s*([^}]+)\s*\}\}/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		if (match.index > lastIndex) {
			const text = content.slice(lastIndex, match.index);
			segments.push({
				kind: 'text',
				text,
				role: parentStyle ? roleForStyle(parentStyle) : 'default',
				style: parentStyle,
			});
		}

		const { key, displayMultiplier } = parsePlaceholderExpr(match[1]);
		if (!key) {
			lastIndex = match.index + match[0].length;
			continue;
		}

		const field = skill.data[key] as SkillDataField | undefined;
		let computed: ComputedField;

		if (field && typeof field === 'object' && !Array.isArray(field)) {
			if (displayMultiplier !== undefined && field.values && !field.calculation) {
				computed = computeDataValue(
					field,
					levelIndex(clampLevel(ctx.level, skill.maxRank)),
					displayMultiplier
				);
			} else {
				computed = computeField(key, skill, ctx, cache);
			}
		} else {
			computed = { total: 0, formula: '0' };
		}

		segments.push(...expandComputedSegments(key, computed, parentStyle, field));

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < content.length) {
		const text = content.slice(lastIndex);
		segments.push({
			kind: 'text',
			text,
			role: parentStyle ? roleForStyle(parentStyle) : 'default',
			style: parentStyle,
		});
	}

	return segments;
}

const BR_TAG = /<br\s*\/?>/gi;

function parseTaggedChunk(
	raw: string,
	skill: ChampionSkill,
	ctx: SkillDescriptionContext,
	cache: Map<string, ComputedField>
): SkillDescriptionSegment[] {
	const segments: SkillDescriptionSegment[] = [];
	const pattern = /<(\w+)>([\s\S]*?)<\/\1>|([^<]+)/g;
	let match: RegExpExecArray | null;

	while ((match = pattern.exec(raw)) !== null) {
		if (match[1] && match[2] !== undefined) {
			const style = match[1];
			const children = parseInline(match[2], skill, ctx, cache, style);
			if (children.length > 0) {
				segments.push({
					kind: 'styled',
					style,
					role: roleForStyle(style),
					children,
				});
			}
			continue;
		}

		const text = match[3];
		if (!text) continue;
		segments.push(...parseInline(text, skill, ctx, cache));
	}

	return segments;
}

function parseTaggedOrText(
	raw: string,
	skill: ChampionSkill,
	ctx: SkillDescriptionContext,
	cache: Map<string, ComputedField>
): SkillDescriptionSegment[] {
	const cleaned = raw.replace(/\{\{\s*spellmodifierdescriptionappend\s*\}\}/gi, '');
	const chunks = cleaned.split(BR_TAG);
	const segments: SkillDescriptionSegment[] = [];

	for (let i = 0; i < chunks.length; i++) {
		const chunk = chunks[i];
		if (chunk) {
			segments.push(...parseTaggedChunk(chunk, skill, ctx, cache));
		}
		if (i < chunks.length - 1) {
			segments.push({ kind: 'lineBreak' });
		}
	}

	return segments;
}

function segmentToText(seg: SkillDescriptionSegment): string {
	if (seg.kind === 'lineBreak') return '\n';
	if (seg.kind === 'text') return seg.text;
	if (seg.kind === 'number') return String(seg.value);
	if (seg.kind === 'ratio_damage') return seg.text;
	if (seg.kind === 'styled') return seg.children.map(segmentToText).join('');
	return '';
}

function segmentsToText(segments: SkillDescriptionSegment[]): string {
	return segments.map(segmentToText).join('');
}

/** Recompute dynamic total numbers in API-provided segments using current AD/AP. */
export function recomputeSegmentTotals(
	segments: SkillDescriptionSegment[],
	ctx: Pick<SkillDescriptionContext, 'ad' | 'ap'>
): SkillDescriptionSegment[] {
	return segments.map((segment) => {
		if (segment.kind !== 'styled') return segment;
		return {
			...segment,
			children: recomputeStyledChildren(segment.children, ctx),
		};
	});
}

function recomputeStyledChildren(
	children: SkillDescriptionSegment[],
	ctx: Pick<SkillDescriptionContext, 'ad' | 'ap'>
): SkillDescriptionSegment[] {
	return children.map((segment, index, arr) => {
		if (segment.kind !== 'number') return segment;
		const next = arr[index + 1];
		if (next?.kind !== 'text' || next.text !== ' (') {
			return segment;
		}

		let base = 0;
		let ratioTotal = 0;
		for (let j = index + 2; j < arr.length; j++) {
			const child = arr[j];
			if (child.kind === 'number' && base === 0) {
				base = child.value;
				continue;
			}
			if (child.kind === 'ratio_damage') {
				ratioTotal += statValue(child.stat, ctx as SkillDescriptionContext) * child.ratio;
			}
			if (child.kind === 'text' && child.text === ')') break;
		}

		return { ...segment, value: roundDisplay(base + ratioTotal) };
	});
}

function findPrimaryDamageField(skill: ChampionSkill): [string, SkillDataField] | null {
	const candidates: [string, SkillDataField][] = [];

	for (const [key, raw] of Object.entries(skill.data)) {
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
		const field = raw as SkillDataField;
		if (field.calculation !== 'mFormulaParts' || !field.parts?.length) continue;
		if (field.parts.some((part) => part.kind === 'base_damage' || part.kind === 'ratio_damage')) {
			candidates.push([key, field]);
		}
	}

	if (candidates.length === 0) return null;

	const typed = candidates.find(([, field]) =>
		['physicalDamage', 'magicDamage', 'trueDamage'].includes(field.type ?? '')
	);
	return typed ?? candidates[0];
}

function cooldownValues(skill: ChampionSkill): number[] | null {
	const cd = skill.data.cooldown;
	if (Array.isArray(cd)) return cd;
	if (cd && typeof cd === 'object' && !Array.isArray(cd) && cd.values) {
		return cd.values;
	}
	return null;
}

export function getSkillDetailRows(
	skill: ChampionSkill,
	ctx: SkillDescriptionContext
): SkillDetailRow[] {
	const rows: SkillDetailRow[] = [];
	const currentIndex = clampLevel(ctx.level, skill.maxRank) - 1;

	const cd = cooldownValues(skill);
	if (cd?.length) {
		rows.push(buildCooldownDetailRow(cd, skill.id, ctx.level, skill));
	}

	const primary = findPrimaryDamageField(skill);
	if (primary) {
		const [, field] = primary;
		const basePart = field.parts?.find((part) => part.kind === 'base_damage');
		const ratioPart = field.parts?.find((part) => part.kind === 'ratio_damage');

		if (basePart?.values?.length) {
			rows.push({
				label: 'Damage',
				values: basePart.values.map((value) => String(roundDisplay(value))),
				currentIndex,
			});
		}

		if (ratioPart) {
			const ratioValues = ratioValuesForDetailRow(ratioPart, skill.maxRank);
			if (ratioValues?.length) {
				rows.push({
					label: 'Total Damage Ratio',
					values: ratioValues.map((value) => formatPercent(value)),
					currentIndex,
				});
			}
		}
	}

	return rows;
}

function formatAbilityLevelValue(value: number | string, unit: string): string {
	const trimmedUnit = unit.trim();
	const numeric = typeof value === 'number' ? value : Number(value);

	if (trimmedUnit === '%') {
		return formatPercent(numeric / 100);
	}

	if (trimmedUnit.includes('%') || /\b(AD|AP)\b/i.test(trimmedUnit)) {
		const stat = trimmedUnit.match(/\b(AD|AP)\b/i)?.[0]?.toUpperCase();
		const pct = formatPercent(numeric / 100);
		return stat ? `${pct} ${stat}` : pct;
	}

	if (Number.isInteger(numeric)) return String(numeric);
	return String(numeric);
}

function modifierRowValues(mod: { values: Array<number | string>; units: string[] }): string[] {
	return mod.values.map((value, index) => formatAbilityLevelValue(value, mod.units[index] ?? ''));
}

function modifierRowLooksLikeRatio(mod: {
	values: Array<number | string>;
	units: string[];
}): boolean {
	return mod.values.every((_, index) => {
		const unit = (mod.units[index] ?? '').trim();
		return unit === '%' || unit.includes('%') || /\b(AD|AP)\b/i.test(unit);
	});
}

function findPrimaryDamageLeveling(ability: BonusAbility) {
	for (const effect of ability.effects ?? []) {
		for (const block of effect.leveling ?? []) {
			if (!/damage|dmg/i.test(block.attribute)) continue;
			if (block.modifiers?.length) return block;
		}
	}
	return null;
}

/** Detail rows (cooldown / damage / ratio) from Meraki bonus ability data. */
export function getSkillDetailRowsFromAbility(
	ability: BonusAbility | null | undefined,
	skillLevel: number,
	skillKey: string,
	skillDef?: ChampionSkill | null
): SkillDetailRow[] {
	if (!ability) return [];

	const rows: SkillDetailRow[] = [];
	const rank = Math.max(1, skillLevel);
	const currentIndex = rank - 1;

	const cooldownMod = ability.cooldown?.modifiers?.[0];
	if (cooldownMod?.values?.length) {
		rows.push(buildCooldownDetailRow(cooldownMod.values, skillKey, rank, skillDef));
	}

	const damageBlock = findPrimaryDamageLeveling(ability);
	if (damageBlock?.modifiers?.length) {
		const [baseMod, ratioMod] = damageBlock.modifiers;

		if (baseMod?.values?.length) {
			rows.push({
				label: 'Damage',
				values: modifierRowValues(baseMod),
				currentIndex: Math.min(currentIndex, baseMod.values.length - 1),
			});
		}

		if (ratioMod?.values?.length && modifierRowLooksLikeRatio(ratioMod)) {
			rows.push({
				label: 'Total Damage Ratio',
				values: modifierRowValues(ratioMod),
				currentIndex: Math.min(currentIndex, ratioMod.values.length - 1),
			});
		}
	}

	return rows;
}

export function mergeSkillDetailRows(
	primary: SkillDetailRow[],
	fallback: SkillDetailRow[]
): SkillDetailRow[] {
	if (primary.length === 0) return fallback;
	if (fallback.length === 0) return primary;

	const labels = new Set(primary.map((row) => row.label));
	return [...primary, ...fallback.filter((row) => !labels.has(row.label))];
}

export function resolveChampionSkill(payload: unknown, skillKey: string): ChampionSkill | null {
	if (!payload) return null;

	if (Array.isArray(payload)) {
		return findChampionSkillInList(payload as ChampionSkill[], skillKey);
	}

	if (typeof payload !== 'object') return null;
	const data = payload as Record<string, unknown>;

	const skills = data.skills;
	if (Array.isArray(skills)) {
		const matched = findChampionSkillInList(skills as ChampionSkill[], skillKey);
		if (matched) return matched;
	}

	if (data.skill && typeof data.skill === 'object') {
		const skill = data.skill as ChampionSkill;
		if (skillMatchesKey(skill, skillKey)) return skill;
	}

	return null;
}

export function skillMatchesKey(skill: ChampionSkill, skillKey: string): boolean {
	const letter = skillKey.toUpperCase();
	const id = skill.id.toUpperCase();

	if (letter === 'P') {
		return id.endsWith('P') || id.includes('PASSIVE');
	}

	return id.endsWith(letter);
}

function findChampionSkillInList(skills: ChampionSkill[], skillKey: string): ChampionSkill | null {
	return skills.find((entry) => skillMatchesKey(entry, skillKey)) ?? null;
}

/** Build dynamic tooltip segments for UI rendering. Use `role` + `style` to map colors. */
export function parseSkillDescription(
	skill: ChampionSkill,
	ctx: SkillDescriptionContext
): ParsedSkillDescription {
	const cache = new Map<string, ComputedField>();
	const segments = parseTaggedOrText(skill.rawDescription, skill, ctx, cache);
	return {
		segments,
		text: segmentsToText(segments),
	};
}
