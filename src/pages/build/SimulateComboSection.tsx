import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/contexts/AppContext';
import type { BonusChampionDetail } from '@/pages/champion-detail/utils';
import clsx from 'clsx';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import {
	COMBO_SKILL_COLORS,
	COMBO_SKILL_TEXT_COLORS,
	comboTotalDamage,
	computeComboDamages,
	type ComboStepKey,
} from './simulate-combo';
import { SKILL_KEYS, type SkillLevels } from './skill-levels';

type SimulateComboSectionProps = {
	attackerChampionId: string | null;
	targetChampionName: string;
	targetMaxHp: number;
	attackerLevel: number;
	attackerSkillLevels: SkillLevels;
	attackerBonusHealth: number;
	totalAd: number;
	totalAp: number;
	skillsPayload?: unknown;
	bonusDetail?: BonusChampionDetail | null;
	comboSteps: ComboStepKey[];
	onComboStepsChange: Dispatch<SetStateAction<ComboStepKey[]>>;
};

function abilityForSkill(bonusDetail: BonusChampionDetail | null | undefined, skill: string) {
	if (!bonusDetail) return null;
	return (bonusDetail.abilities as Record<string, { name?: string }[]>)?.[skill]?.[0] ?? null;
}

function removeLastComboStep(steps: ComboStepKey[], step: ComboStepKey): ComboStepKey[] {
	for (let i = steps.length - 1; i >= 0; i--) {
		if (steps[i] === step) {
			return [...steps.slice(0, i), ...steps.slice(i + 1)];
		}
	}
	return steps;
}

function aggregateDamageBySkill(
	comboDamages: { key: ComboStepKey; damage: number }[]
): { key: ComboStepKey; damage: number }[] {
	const totals = new Map<ComboStepKey, number>();
	const order: ComboStepKey[] = [];

	for (const step of comboDamages) {
		if (!totals.has(step.key)) {
			order.push(step.key);
			totals.set(step.key, 0);
		}
		totals.set(step.key, totals.get(step.key)! + step.damage);
	}

	return order.map((key) => ({ key, damage: totals.get(key)! }));
}

const SimulateComboSection = ({
	attackerChampionId,
	targetChampionName,
	targetMaxHp,
	attackerLevel,
	attackerSkillLevels,
	attackerBonusHealth,
	totalAd,
	totalAp,
	skillsPayload,
	bonusDetail,
	comboSteps,
	onComboStepsChange,
}: SimulateComboSectionProps) => {
	const { patchVersion } = useAppContext();

	const comboDamages = useMemo(
		() =>
			computeComboDamages(comboSteps, {
				attackerSkillLevels,
				attackerLevel,
				attackerBonusHealth,
				totalAd,
				totalAp,
				skillsPayload,
			}),
		[
			comboSteps,
			attackerSkillLevels,
			attackerLevel,
			attackerBonusHealth,
			totalAd,
			totalAp,
			skillsPayload,
		]
	);

	const totalDamage = comboTotalDamage(comboDamages);
	const damageBySkill = useMemo(() => aggregateDamageBySkill(comboDamages), [comboDamages]);
	const maxHp = Math.max(1, Math.round(targetMaxHp));
	const currentHp = Math.max(0, maxHp - totalDamage);
	const hpSegments = Math.max(1, Math.ceil(maxHp / 100));
	const usedSteps = new Set(comboSteps);

	const handleAddComboStep = (step: ComboStepKey) => {
		onComboStepsChange((prev) => [...prev, step]);
	};

	const handleRemoveComboStep = (step: ComboStepKey) => {
		onComboStepsChange((prev) => removeLastComboStep(prev, step));
	};

	const handleClearCombo = () => {
		onComboStepsChange([]);
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<p className="text-xs 2xl:text-sm">Combo Setup</p>
				<div className="flex items-center gap-2">
					{SKILL_KEYS.map((skill) => {
						const ability = abilityForSkill(bonusDetail, skill);
						const skillName = ability?.name ?? skill;
						const isUsed = usedSteps.has(skill);

						return (
							<Tooltip key={skill} delayDuration={0}>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => handleAddComboStep(skill)}
										onContextMenu={(e) => {
											e.preventDefault();
											handleRemoveComboStep(skill);
										}}
										className="relative size-10 shrink-0 hover:scale-110 transition-transform"
									>
										<img
											alt={`${attackerChampionId}-${skill}`}
											src={`https://cdn.communitydragon.org/latest/champion/${attackerChampionId}/ability-icon/${skill.toLowerCase()}.png`}
											className={cn(
												'size-10 object-cover rounded-sm transition-opacity',
												isUsed ? 'opacity-100' : 'opacity-50'
											)}
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.src = `https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/spell/${attackerChampionId}${skill}.png`;
											}}
										/>
										<span className="absolute top-0 left-0 min-w-[14px] px-0.5 text-[10px] font-bold leading-none text-white bg-black/85 rounded-br rounded-tl-sm text-center">
											{skill}
										</span>
									</button>
								</TooltipTrigger>
								<TooltipContent
									className="border-border/60 bg-popover text-xs text-popover-foreground"
									side="top"
									sideOffset={8}
								>
									{skillName}
								</TooltipContent>
							</Tooltip>
						);
					})}
					<Tooltip delayDuration={0}>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => handleAddComboStep('AA')}
								onContextMenu={(e) => {
									e.preventDefault();
									handleRemoveComboStep('AA');
								}}
								className="relative size-10 shrink-0 hover:scale-110 transition-transform"
							>
								<img
									src="/images/icons/basic-att.png"
									alt="AA"
									className={cn(
										'size-10 object-cover rounded-sm transition-opacity',
										usedSteps.has('AA') ? 'opacity-100' : 'opacity-50'
									)}
								/>
								<span className="absolute top-0 left-0 min-w-[14px] px-0.5 text-[10px] font-bold leading-none text-white bg-black/85 rounded-br rounded-tl-sm text-center">
									AA
								</span>
							</button>
						</TooltipTrigger>
						<TooltipContent
							className="border-border/60 bg-popover text-xs text-popover-foreground"
							side="top"
							sideOffset={8}
						>
							Basic Attack
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			<div className="space-y-2 pt-4 border-t border-input">
				<div className="flex items-center justify-between text-xs 2xl:text-sm">
					<span className="text-muted-foreground">{targetChampionName} HP</span>
					<button
						type="button"
						onClick={handleClearCombo}
						disabled={comboSteps.length === 0}
						className="text-muted-foreground hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Reset
					</button>
				</div>

				<div className="relative h-7 rounded-sm overflow-hidden border border-zinc-700/80 bg-zinc-900 flex flex-wrap justify-between">
					<div
						className="absolute inset-0 flex"
						style={{
							backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${hpSegments} - 1px), rgba(0,0,0,0.35) calc(100% / ${hpSegments} - 1px), rgba(0,0,0,0.35) calc(100% / ${hpSegments}))`,
						}}
					>
						<div
							className="h-full shrink-0"
							style={{
								width: `${(currentHp / maxHp) * 100}%`,
								background:
									'linear-gradient(rgba(19, 227, 95, 0.87) 0%, rgba(34, 197, 94, 0.6) 100%)',
							}}
						/>
						{([...SKILL_KEYS, 'AA'] as ComboStepKey[])
							.map((key) => damageBySkill.find((entry) => entry.key === key))
							.filter((entry): entry is { key: ComboStepKey; damage: number } =>
								Boolean(entry)
							)
							.map((entry) => (
								<div
									key={entry.key}
									className={cn('h-full shrink-0', COMBO_SKILL_COLORS[entry.key])}
									style={{ width: `${(entry.damage / maxHp) * 100}%` }}
								/>
							))}
					</div>
					<div className="z-[3] absolute inset-0 flex items-center justify-center text-xs font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
						{currentHp} / {maxHp}
					</div>
					{
						Array.from({ length: 20 }).map((_, index) => (
							<div key={index} className="h-full w-0.5 bg-neutral-700/20 shrink-0 z-[2]"  />
						))
					}
				</div>

				<div className="flex flex-col gap-2 text-xs 2xl:text-sm">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						{comboDamages.map((step, index) => (
							<span
								key={`${step.key}-${index}`}
								className="inline-flex items-center gap-1 text-xs 3xl:text-sm"
							>
								<span
									className={cn(
										'size-2.5 rounded-[2px]',
										COMBO_SKILL_COLORS[step.key]
									)}
								/>
								<span>
									<var
										className={clsx(
											COMBO_SKILL_TEXT_COLORS[step.key],
											'not-italic'
										)}
									>
										{step.key}
									</var>
									<span className="ml-1">{step.damage}</span>
								</span>
							</span>
						))}
					</div>
					{damageBySkill.length > 0 ? (
						<div className="h-[1px] bg-input w-full my-4" />
					) : null}
					<div className="flex justify-between gap-2">
						{damageBySkill.length > 0 ? (
							<div className="flex flex-wrap gap-x-3 gap-y-1">
								{damageBySkill.map(({ key, damage }) => (
									<span
										key={key}
										className="inline-flex items-center gap-1 text-xs 3xl:text-sm"
									>
										<span
											className={cn(
												'size-2.5 rounded-[2px]',
												COMBO_SKILL_COLORS[key]
											)}
										/>
										<span>
											<var
												className={clsx(
													COMBO_SKILL_TEXT_COLORS[key],
													'not-italic'
												)}
											>
												{key}
											</var>
											<span className="ml-1">{damage}</span>
										</span>
									</span>
								))}
							</div>
						) : (
							<div />
						)}
						{comboDamages.length > 0 ? (
							<div className="shrink-0 text-muted-foreground">
								Total:{' '}
								<span className="font-semibold text-hex-gold">{totalDamage}</span>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SimulateComboSection;
