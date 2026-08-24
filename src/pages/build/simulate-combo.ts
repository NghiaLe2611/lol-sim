import {
	computeSkillDamage,
	resolveChampionSkill,
	type SkillDescriptionContext,
} from './skills';
import type { SkillKey, SkillLevels } from './skill-levels';

export type ComboStepKey = SkillKey | 'AA';

export const COMBO_STEP_KEYS: ComboStepKey[] = ['Q', 'W', 'E', 'R', 'AA'];

export const COMBO_SKILL_COLORS: Record<ComboStepKey, string> = {
	Q: 'bg-blue-500',
	W: 'bg-green-500',
	E: 'bg-orange-500',
	R: 'bg-red-500',
	AA: 'bg-zinc-400',
};

export const COMBO_SKILL_TEXT_COLORS: Record<ComboStepKey, string> = {
	Q: 'text-blue-400',
	W: 'text-green-400',
	E: 'text-orange-400',
	R: 'text-red-400',
	AA: 'text-zinc-400',
};

export type ComboStep = {
	key: ComboStepKey;
	damage: number;
};

type ComputeComboOptions = {
	attackerSkillLevels: SkillLevels;
	attackerLevel: number;
	attackerBonusHealth: number;
	totalAd: number;
	totalAp: number;
	skillsPayload?: unknown;
};

export function computeComboDamages(
	steps: ComboStepKey[],
	options: ComputeComboOptions
): ComboStep[] {
	const ctx: Omit<SkillDescriptionContext, 'level'> = {
		championLevel: options.attackerLevel,
		bonusHealth: options.attackerBonusHealth,
		ad: options.totalAd,
		ap: options.totalAp,
	};

	return steps.map((key) => {
		if (key === 'AA') {
			return { key, damage: Math.round(options.totalAd) };
		}

		const skillDef = resolveChampionSkill(options.skillsPayload, key);
		const rank = Math.max(1, options.attackerSkillLevels[key] || 1);
		const damage = skillDef
			? computeSkillDamage(skillDef, { ...ctx, level: rank })
			: 0;

		return { key, damage };
	});
}

export function comboTotalDamage(steps: ComboStep[]): number {
	return steps.reduce((sum, step) => sum + step.damage, 0);
}
