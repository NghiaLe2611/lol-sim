import type { SrItem } from '@/pages/items/utils';

/** Meraki bonus item stat block (`item.stats[key]`). */
export type ItemBonusStatBlock = {
	flat?: number;
	percent?: number;
	perLevel?: number;
	percentPerLevel?: number;
	percentBase?: number;
	percentBonus?: number;
};

export type FlatPercentTotals = {
	flat: number;
	percent: number;
};

export type AccumulatedItemStats = Record<string, FlatPercentTotals>;

export type ChampionBaseStats = {
	hp: number;
	mana: number;
	ad: number;
	armor: number;
	mr: number;
	/** Attack speed at selected level, before item bonuses. */
	as: number;
	ms: number;
	/** Critical strike chance 0–100. */
	critPct: number;
};

export type BuildComputedStats = {
	baseHp: number;
	baseMana: number;
	baseAd: number;
	baseArmor: number;
	baseMr: number;
	baseAs: number;
	baseMs: number;
	baseCritPct: number;
	totalHp: number;
	totalMana: number;
	totalAd: number;
	totalAp: number;
	totalArmor: number;
	totalMr: number;
	totalAs: number;
	totalMs: number;
	totalCritPct: number;
	totalAbilityHaste: number;
	totalLethality: number;
	totalOmnivampPct: number;
	totalCritDamage: number;
	effectiveHpPhys: number;
	effectiveHpMagic: number;
	dps: number;
	itemAd: number;
	itemAp: number;
	totalCost: number;
	itemCount: number;
};

function emptyTotals(): FlatPercentTotals {
	return { flat: 0, percent: 0 };
}

function addTotals(a: FlatPercentTotals, b: FlatPercentTotals): FlatPercentTotals {
	return { flat: a.flat + b.flat, percent: a.percent + b.percent };
}

/** Read `{ flat, percent }` from a bonus stat block. */
export function parseBonusStatBlock(block: unknown): FlatPercentTotals {
	if (!block || typeof block !== 'object') return emptyTotals();
	const o = block as ItemBonusStatBlock;
	return {
		flat: o.flat ?? 0,
		percent: o.percent ?? 0,
	};
}

/**
 * Parse Meraki bonus `item.stats` into flat/percent totals per stat key.
 * Some items store attack speed bonus in `flat` as percentage points.
 */
export function parseItemBonusStats(
	stats: Record<string, unknown> | undefined
): AccumulatedItemStats {
	const out: AccumulatedItemStats = {};
	if (!stats) return out;

	for (const [key, block] of Object.entries(stats)) {
		let parsed = parseBonusStatBlock(block);
		if (key === 'attackSpeed' && parsed.percent === 0 && parsed.flat !== 0) {
			parsed = { flat: 0, percent: parsed.flat };
		}
		out[key] = parsed;
	}
	return out;
}

/** Fallback: map DDragon `attrs` (FlatHPPoolMod, …) into the same shape. */
export function parseItemAttrs(attrs: Record<string, number> | undefined): AccumulatedItemStats {
	if (!attrs) return {};

	const out: AccumulatedItemStats = {};
	const add = (key: string, flat = 0, percent = 0) => {
		out[key] = addTotals(out[key] ?? emptyTotals(), { flat, percent });
	};

	if (attrs.FlatHPPoolMod) add('health', attrs.FlatHPPoolMod);
	if (attrs.FlatMPPoolMod) add('mana', attrs.FlatMPPoolMod);
	if (attrs.FlatPhysicalDamageMod) add('attackDamage', attrs.FlatPhysicalDamageMod);
	if (attrs.FlatMagicDamageMod) add('abilityPower', attrs.FlatMagicDamageMod);
	if (attrs.FlatArmorMod) add('armor', attrs.FlatArmorMod);
	if (attrs.FlatSpellBlockMod) add('magicResistance', attrs.FlatSpellBlockMod);
	if (attrs.FlatAbilityHasteMod) add('abilityHaste', attrs.FlatAbilityHasteMod);
	if (attrs.PercentAttackSpeedMod) add('attackSpeed', 0, attrs.PercentAttackSpeedMod * 100);
	if (attrs.FlatMovementSpeedMod) add('movespeed', attrs.FlatMovementSpeedMod);
	if (attrs.PercentMovementSpeedMod) add('movespeed', 0, attrs.PercentMovementSpeedMod * 100);
	if (attrs.FlatCritChanceMod) add('criticalStrikeChance', 0, attrs.FlatCritChanceMod * 100);

	return out;
}

/** Sum stats from all equipped items (bonus `stats` first, else DDragon `attrs`). */
export function accumulateItemStatsFromBuild(items: SrItem[]): AccumulatedItemStats {
	let acc: AccumulatedItemStats = {};

	for (const item of items) {
		const parsed =
			item.stats && Object.keys(item.stats).length > 0
				? parseItemBonusStats(item.stats as Record<string, unknown>)
				: parseItemAttrs(item.attrs);

		for (const [key, totals] of Object.entries(parsed)) {
			acc[key] = addTotals(acc[key] ?? emptyTotals(), totals);
		}
	}

	return acc;
}

function statTotals(acc: AccumulatedItemStats, key: string): FlatPercentTotals {
	return acc[key] ?? emptyTotals();
}

/**
 * Apply accumulated item stats onto champion base values.
 *
 * - `flat` → direct addition (HP, AD, armor, …)
 * - `percent` → % of the champion base at current level (MS, AS, crit)
 * - Crit chance capped at 100%
 * - MS % and AS % only scale the champion base, not item flat bonuses
 */
export function applyItemStatsToChampion(
	base: ChampionBaseStats,
	items: AccumulatedItemStats,
	options?: { critDamageBonus?: number }
): BuildComputedStats {
	const hp = statTotals(items, 'health');
	const mana = statTotals(items, 'mana');
	const ad = statTotals(items, 'attackDamage');
	const ap = statTotals(items, 'abilityPower');
	const armor = statTotals(items, 'armor');
	const mr = statTotals(items, 'magicResistance');
	const asItem = statTotals(items, 'attackSpeed');
	const ms = statTotals(items, 'movespeed');
	const crit = statTotals(items, 'criticalStrikeChance');
	const ah = statTotals(items, 'abilityHaste');
	const leth = statTotals(items, 'lethality');
	const omni = statTotals(items, 'omnivamp');

	const totalHp = base.hp + hp.flat + (base.hp * hp.percent) / 100;
	const totalMana = base.mana + mana.flat + (base.mana * mana.percent) / 100;
	const totalAd = base.ad + ad.flat + (base.ad * ad.percent) / 100;
	const totalAp = ap.flat;
	const totalArmor = base.armor + armor.flat + (base.armor * armor.percent) / 100;
	const totalMr = base.mr + mr.flat + (base.mr * mr.percent) / 100;

	// AS % applies to champion AS at level (not compounded per item)
	const totalAs = base.as * (1 + asItem.percent / 100);

	// MS flat adds directly; MS % only applies to champion base MS
	const totalMs = base.ms + ms.flat + (base.ms * ms.percent) / 100;

	// Crit defaults to 0; item percent stacks, capped at 100%
	const totalCritPct = Math.min(100, base.critPct + crit.percent + crit.flat);

	const totalAbilityHaste = ah.flat + ah.percent;
	const totalLethality = leth.flat + leth.percent;
	const totalOmnivampPct = omni.percent + omni.flat;

	const critDamageBonus = options?.critDamageBonus ?? 0;
	const totalCritDamage = 1.75 + critDamageBonus;
	const critChance = totalCritPct / 100;

	const effectiveHpPhys = totalHp * (1 + totalArmor / 100);
	const effectiveHpMagic = totalHp * (1 + totalMr / 100);
	const dps = totalAd * totalAs * (1 + critChance * (totalCritDamage - 1));

	return {
		baseHp: base.hp,
		baseMana: base.mana,
		baseAd: base.ad,
		baseArmor: base.armor,
		baseMr: base.mr,
		baseAs: base.as,
		baseMs: base.ms,
		baseCritPct: base.critPct,
		totalHp,
		totalMana,
		totalAd,
		totalAp,
		totalArmor,
		totalMr,
		totalAs,
		totalMs,
		totalCritPct,
		totalAbilityHaste,
		totalLethality,
		totalOmnivampPct,
		totalCritDamage,
		effectiveHpPhys,
		effectiveHpMagic,
		dps,
		itemAd: ad.flat,
		itemAp: ap.flat,
		totalCost: 0,
		itemCount: 0,
	};
}
