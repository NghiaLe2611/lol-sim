import clsx from 'clsx';
import type { BonusAbility, BonusChampionDetail } from '@/pages/champion-detail/utils';
import {
	canSelectSkillRank,
	SKILL_KEYS,
	skillRankButtons,
	type SkillKey,
	type SkillLevels,
} from './skill-levels';
import { SkillDescriptionContent } from './skill-description';

type SimulateSkillsSectionProps = {
	championId: string | null;
	championLevel: number;
	skillLevels: SkillLevels;
	onSkillLevelChange: (skill: SkillKey, rank: number) => void;
	bonusDetail?: BonusChampionDetail | null;
	skillsPayload?: Record<string, unknown>;
	totalAd: number;
	totalAp: number;
	bonusHealth: number;
	accentBorderCls: string;
	accentActiveCls: string;
	bgClass: string;
};

function abilityForSkill(
	bonusDetail: BonusChampionDetail | null | undefined,
	skill: string
): BonusAbility | null {
	if (!bonusDetail) return null;
	return (bonusDetail.abilities as Record<string, BonusAbility[]>)?.[skill]?.[0] ?? null;
}

const SimulateSkillsSection = ({
	championId,
	championLevel,
	skillLevels,
	onSkillLevelChange,
	bonusDetail,
	skillsPayload,
	totalAd,
	totalAp,
	bonusHealth,
	accentBorderCls,
	accentActiveCls,
	bgClass,
}: SimulateSkillsSectionProps) => {
	if (!championId) return null;

	const passiveAbility = abilityForSkill(bonusDetail, 'P');
	const passiveName = passiveAbility?.name ?? 'Passive';

	return (
		<div className="flex-1 bg-card-foreground p-4 rounded-sm border border-input space-y-3">
			<h5 className="text-xs text-hex-gold font-semibold uppercase tracking-wider">Skills</h5>
			<div className="space-y-2">
				<div className={clsx('rounded-sm border bg-zinc-950/40 p-2', accentBorderCls, bgClass)}>
					<div className="flex items-center gap-2 min-w-0">
						<div className="relative size-10 shrink-0">
							<img
								alt={`${championId}-P`}
								src={`https://cdn.communitydragon.org/latest/champion/${championId}/ability-icon/p.png`}
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.src = `https://cdn.metasrc.com/static/champions/${championId.toLowerCase()}/skills/icons/${championId.toLowerCase()}_passive.png`;
								}}
								className="size-10 object-cover rounded-sm"
							/>
							<span className="absolute top-0 left-0 min-w-[14px] px-0.5 text-[10px] font-bold leading-none text-white bg-black/85 rounded-br rounded-tl-sm text-center">
								P
							</span>
						</div>
						<span className="text-xs 2xl:text-sm font-medium truncate">
							{passiveName}
						</span>
					</div>

					<SkillDescriptionContent
						champion={championId}
						item={passiveAbility}
						skill="P"
						skillLv={1}
						skillsPayload={skillsPayload}
						totalAd={totalAd}
						totalAp={totalAp}
						championLevel={championLevel}
						bonusHealth={bonusHealth}
						showDetailRows={false}
					/>
				</div>

				{SKILL_KEYS.map((skill) => {
					const ability = abilityForSkill(bonusDetail, skill);
					const skillName = ability?.name ?? skill;
					const currentRank = skillLevels[skill];
					const ranks = skillRankButtons(skill);
					const previewRank = currentRank > 0 ? currentRank : 1;

					return (
						<div
							key={skill}
							className={clsx(
								'rounded-sm border bg-zinc-950/40 p-2',
								accentBorderCls,
								bgClass
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2 min-w-0">
									<div className="relative size-10 shrink-0">
										<img
											alt={`${championId}-${skill}`}
											src={`https://cdn.communitydragon.org/latest/champion/${championId}/ability-icon/${skill.toLowerCase()}.png`}
											className="size-10 object-cover rounded-sm"
										/>
										<span className="absolute top-0 left-0 min-w-[14px] px-0.5 text-[10px] font-bold leading-none text-white bg-black/85 rounded-br rounded-tl-sm text-center">
											{skill}
										</span>
									</div>
									<span className="text-xs 2xl:text-sm font-medium truncate">
										{skillName}
									</span>
								</div>

								<div className="flex gap-1 shrink-0">
									{ranks.map((rank) => {
										const isSelected = currentRank === rank;
										const isEnabled = canSelectSkillRank(
											skill,
											rank,
											championLevel,
											skillLevels
										);

										return (
											<button
												key={rank}
												type="button"
												disabled={!isEnabled && !isSelected}
												onClick={() => onSkillLevelChange(skill, rank)}
												className={clsx(
													'size-7 text-xs font-semibold rounded border transition-colors',
													isSelected
														? clsx(
																accentActiveCls,
																'text-white border-transparent'
															)
														: 'bg-zinc-800/90 text-muted-foreground border-zinc-700 hover:border-zinc-500',
													!isEnabled &&
														!isSelected &&
														'opacity-40 cursor-not-allowed hover:border-zinc-700'
												)}
											>
												{rank}
											</button>
										);
									})}
								</div>
							</div>

							<SkillDescriptionContent
								champion={championId}
								item={ability}
								skill={skill}
								skillLv={previewRank}
								skillsPayload={skillsPayload}
								totalAd={totalAd}
								totalAp={totalAp}
								championLevel={championLevel}
								bonusHealth={bonusHealth}
								detailRowMode="single"
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SimulateSkillsSection;
