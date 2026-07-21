import type { BonusChampionDetail } from '@/pages/champion-detail/utils';
import type { SrItem } from '@/pages/items/utils';
import {
	accumulateItemStatsFromBuild,
	applyItemStatsToChampion,
	type BuildComputedStats,
	type ChampionBaseStats,
	type ItemBonusStatBlock,
} from './item-stats';

type DdragonChampionRow = {
	stats?: {
		hp?: number;
		hpperlevel?: number;
		mp?: number;
		mpperlevel?: number;
		attackdamage?: number;
		attackdamageperlevel?: number;
		armor?: number;
		armorperlevel?: number;
		spellblock?: number;
		spellblockperlevel?: number;
		attackspeed?: number;
		attackspeedperlevel?: number;
		movespeed?: number;
	};
};

export function computeBuildStats(params: {
	level: number;
	build: (string | null)[];
	itemsById: Record<string, SrItem>;
	champBonus?: BonusChampionDetail | null;
	champDdr?: DdragonChampionRow | null;
}): BuildComputedStats {
	const { level, build, itemsById, champBonus, champDdr } = params;
	const lv = level - 1;
	const factor = lv * (0.7025 + 0.0175 * lv);

	let baseHp = 0;
	let baseMana = 0;
	let baseAd = 0;
	let baseArmor = 0;
	let baseMr = 0;
	let baseAsRatio = 0.625;
	let baseAsGrowth = 0;
	let baseMs = 330;
	let baseCritPct = 0;
	let baseCritDamagePct = 175;

	if (champBonus?.stats) {
		const s = champBonus.stats as Record<string, ItemBonusStatBlock | undefined>;
		baseHp = s.health?.flat ?? 0;
		baseHp += (s.health?.perLevel ?? 0) * factor;

		baseMana = s.mana?.flat ?? 0;
		baseMana += (s.mana?.perLevel ?? 0) * factor;

		baseAd = s.attackDamage?.flat ?? 0;
		baseAd += (s.attackDamage?.perLevel ?? 0) * factor;

		baseArmor = s.armor?.flat ?? 0;
		baseArmor += (s.armor?.perLevel ?? 0) * factor;

		baseMr = s.magicResistance?.flat ?? 0;
		baseMr += (s.magicResistance?.perLevel ?? 0) * factor;

		baseAsRatio = s.attackSpeed?.flat ?? 0.625;
		baseAsGrowth = s.attackSpeed?.perLevel ?? s.attackSpeed?.percentPerLevel ?? 0;

		baseMs = s.movespeed?.flat ?? 330;

		baseCritPct = s.criticalStrikeChance?.percent ?? s.criticalStrikeChance?.flat ?? 0;

		const critDmgBlock = s.criticalStrikeDamage;
		if (critDmgBlock && typeof critDmgBlock === 'object' && 'flat' in critDmgBlock) {
			const flatVal = critDmgBlock.flat ?? 175;
			baseCritDamagePct = flatVal > 10 ? flatVal : flatVal * 100;
		}
	} else if (champDdr?.stats) {
		const s = champDdr.stats;
		baseHp = (s.hp ?? 0) + (s.hpperlevel ?? 0) * factor;
		baseMana = (s.mp ?? 0) + (s.mpperlevel ?? 0) * factor;
		baseAd = (s.attackdamage ?? 0) + (s.attackdamageperlevel ?? 0) * factor;
		baseArmor = (s.armor ?? 0) + (s.armorperlevel ?? 0) * factor;
		baseMr = (s.spellblock ?? 0) + (s.spellblockperlevel ?? 0) * factor;
		baseAsRatio = s.attackspeed ?? 0.625;
		baseAsGrowth = s.attackspeedperlevel ?? 0;
		baseMs = s.movespeed ?? 330;
	}

	const levelBonusAsPct = baseAsGrowth * factor;
	const asAtLevel = baseAsRatio * (1 + levelBonusAsPct / 100);

	const championBase: ChampionBaseStats = {
		hp: baseHp,
		mana: baseMana,
		ad: baseAd,
		armor: baseArmor,
		mr: baseMr,
		as: asAtLevel,
		ms: baseMs,
		critPct: baseCritPct,
		critDamagePct: baseCritDamagePct,
	};

	const equippedItems: SrItem[] = [];
	let totalCost = 0;
	let itemCount = 0;

	for (const itemId of build) {
		if (!itemId) continue;
		const item = itemsById[itemId];
		if (!item) continue;
		equippedItems.push(item);
		totalCost += item.goldTotal;
		itemCount++;
	}

	const itemStats = accumulateItemStatsFromBuild(equippedItems);
	const computed = applyItemStatsToChampion(championBase, itemStats);

	const critChance = computed.totalCritPct / 100;
	computed.dps =
		computed.totalAd * computed.totalAs * (1 + critChance * (computed.totalCritDamage - 1));
	computed.totalCost = totalCost;
	computed.itemCount = itemCount;

	return computed;
}
