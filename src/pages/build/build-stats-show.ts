import type { BuildComputedStats } from './item-stats';

export type BuildStatRow = {
	key: string;
	value: number;
	colorClass: string;
	icon?: string;
	format: (v: number) => string;
};

export function buildStatsToShow(stats: BuildComputedStats): BuildStatRow[] {
	return [
		{
			key: 'health',
			value: stats.totalHp,
			colorClass: 'text-green-500 dark:text-green-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'mana',
			value: stats.totalMana,
			colorClass: 'text-sky-500 dark:text-sky-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'attackDamage',
			value: stats.totalAd,
			icon: 'scalead',
			colorClass: 'text-orange-500 dark:text-orange-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'abilityPower',
			value: stats.totalAp,
			icon: 'scaleap',
			colorClass: 'text-blue-500 dark:text-blue-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'attackSpeed',
			value: stats.totalAs,
			icon: 'scaleas',
			colorClass: 'text-yellow-500 dark:text-yellow-400',
			format: (v) => v.toFixed(2),
		},
		{
			key: 'armor',
			value: stats.totalArmor,
			icon: 'scalearmor',
			colorClass: 'text-orange-400 dark:text-orange-300',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'magicResistance',
			value: stats.totalMr,
			icon: 'scalemr',
			colorClass: 'text-purple-500 dark:text-purple-400',
			format: (v) => v.toFixed(0),
		},
		{
			key: 'movespeed',
			value: stats.totalMs,
			icon: 'scalems',
			colorClass: 'text-teal-500 dark:text-teal-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'criticalStrikeChance',
			value: stats.totalCritPct,
			icon: 'scalecrit',
			colorClass: 'text-red-500 dark:text-red-400',
			format: (v) => Math.round(v) + '%',
		},
		{
			key: 'criticalStrikeDamage',
			value: stats.totalCritDamagePct,
			colorClass: 'text-pink-500 dark:text-pink-600',
			format: (v) => Math.round(v) + '%',
		},
		{
			key: 'abilityHaste',
			value: stats.totalAbilityHaste,
			icon: 'scalecooldown',
			colorClass: 'text-indigo-500 dark:text-indigo-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'lethality',
			value: stats.totalLethality,
			colorClass: 'text-rose-500 dark:text-rose-400',
			format: (v) => Math.round(v).toString(),
		},
		{
			key: 'omnivamp',
			value: stats.totalOmnivampPct,
			colorClass: 'text-pink-500 dark:text-pink-400',
			format: (v) => Math.round(v) + '%',
		},
	];
}
