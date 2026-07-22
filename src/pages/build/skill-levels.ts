export type SkillKey = 'Q' | 'W' | 'E' | 'R';

export type SkillLevels = Record<SkillKey, number>;

export const SKILL_KEYS: SkillKey[] = ['Q', 'W', 'E', 'R'];
export const BASIC_SKILL_KEYS: SkillKey[] = ['Q', 'W', 'E'];

export const SKILL_MAX: Record<SkillKey, number> = {
	Q: 5,
	W: 5,
	E: 5,
	R: 3,
};

/** Ultimate rank unlocks at champion levels 6, 11, 16. */
export const R_UNLOCK_LEVELS = [6, 11, 16] as const;

export const EMPTY_SKILL_LEVELS: SkillLevels = { Q: 0, W: 0, E: 0, R: 0 };

export function skillPointsAtLevel(level: number): number {
	return Math.max(1, Math.min(18, level));
}

export function totalSkillPointsSpent(skills: SkillLevels): number {
	return skills.Q + skills.W + skills.E + skills.R;
}

export function remainingSkillPoints(skills: SkillLevels, championLevel: number): number {
	return skillPointsAtLevel(championLevel) - totalSkillPointsSpent(skills);
}

export function canLevelSkill(
	skill: SkillKey,
	skills: SkillLevels,
	championLevel: number
): boolean {
	if (remainingSkillPoints(skills, championLevel) <= 0) return false;
	if (skills[skill] >= SKILL_MAX[skill]) return false;

	if (skill === 'R') {
		const nextRank = skills.R + 1;
		const requiredLevel = R_UNLOCK_LEVELS[nextRank - 1];
		return championLevel >= requiredLevel;
	}

	return true;
}

function removeOnePoint(skills: SkillLevels): SkillLevels {
	const next = { ...skills };

	if (next.R > 0) {
		next.R -= 1;
		return next;
	}

	const basic = [...BASIC_SKILL_KEYS].sort((a, b) => next[b] - next[a])[0]!;
	if (next[basic] > 0) {
		next[basic] -= 1;
	}

	return next;
}

/** Drop ranks that exceed champion level or total point budget. */
export function clampSkillLevels(skills: SkillLevels, championLevel: number): SkillLevels {
	let next = { ...skills };

	while (next.R > 0 && championLevel < R_UNLOCK_LEVELS[next.R - 1]!) {
		next.R -= 1;
	}

	const budget = skillPointsAtLevel(championLevel);
	while (totalSkillPointsSpent(next) > budget) {
		next = removeOnePoint(next);
	}

	for (const key of SKILL_KEYS) {
		next[key] = Math.min(next[key], SKILL_MAX[key]);
	}

	return next;
}

export function levelUpSkill(
	skill: SkillKey,
	skills: SkillLevels,
	championLevel: number
): SkillLevels {
	if (!canLevelSkill(skill, skills, championLevel)) return skills;
	return { ...skills, [skill]: skills[skill] + 1 };
}

export function dotCountForSkill(skill: SkillKey): number {
	return skill === 'R' ? 3 : 5;
}

/** Whether rank `rank` can be selected at `championLevel` within the skill-point budget. */
export function canSelectSkillRank(
	skill: SkillKey,
	rank: number,
	championLevel: number,
	skills: SkillLevels
): boolean {
	if (rank < 1 || rank > SKILL_MAX[skill]) return false;

	const next: SkillLevels = { ...skills, [skill]: rank };

	if (next.R > 0 && championLevel < R_UNLOCK_LEVELS[next.R - 1]!) {
		return false;
	}

	for (const key of SKILL_KEYS) {
		if (next[key] > SKILL_MAX[key]) return false;
	}

	return totalSkillPointsSpent(next) <= skillPointsAtLevel(championLevel);
}

export function skillRankButtons(skill: SkillKey): number[] {
	return Array.from({ length: SKILL_MAX[skill] }, (_, i) => i + 1);
}
