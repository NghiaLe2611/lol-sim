import HoverPopover from '@/components/HoverPopover';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { BonusAbility } from '../champion-detail/utils';
import { getCooldownDisplay, resolveChampionSkill, type CooldownDisplay } from './skills';
import { SkillDescriptionContent } from './skill-description';

const POPOVER_CONTENT_CLASS =
	'rounded-none border-hex-gold bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100';

interface SkillPopoverProps {
	children: React.ReactNode;
	item: BonusAbility | null;
	popoverClassName?: string;
	triggerClassName?: string;
	champion: string | null;
	skill: string;
	skillLv?: number;
	skillsPayload?: Record<string, unknown>;
	totalAd: number;
	totalAp: number;
	championLevel: number;
	bonusHealth: number;
}

interface SkillContentProps {
	champion: string | null;
	item: BonusAbility | null;
	skill: string;
	skillLv?: number;
	skillsPayload?: Record<string, unknown>;
	totalAd: number;
	totalAp: number;
	championLevel: number;
	bonusHealth: number;
}

function renderCooldownHeader(display: CooldownDisplay): React.ReactNode {
	if (display.kind === 'levelRange') {
		return (
			<>
				{display.first} - {display.last}{' '}
				<span className="text-muted-foreground/70">(Based on Level)</span>
			</>
		);
	}

	if (display.kind === 'single') {
		return `${display.value}s`;
	}

	return null;
}

const SkillContent = ({
	champion,
	item,
	skill,
	skillLv,
	skillsPayload,
	totalAd,
	totalAp,
	championLevel,
	bonusHealth,
}: SkillContentProps) => {
	const effectiveSkillLevel = skillLv && skillLv > 0 ? skillLv : 1;

	const skillDef = useMemo(
		() => (skillsPayload ? resolveChampionSkill(skillsPayload, skill) : null),
		[skillsPayload, skill]
	);

	const cooldownDisplay = useMemo(
		() =>
			getCooldownDisplay(item?.cooldown?.modifiers?.[0]?.values, skill, {
				skillLevel: skillLv,
				skillDef,
			}),
		[item, skill, skillLv, skillDef]
	);

	const cost = skillLv ? item?.cost?.modifiers?.[0]?.values?.[skillLv - 1] : null;

	if (!champion) return null;

	return (
		<div className="w-96 4xl:min-w-[40rem] max-h-[95vh] p-2 3xl:p-3 text-xs 4xl:text-sm gap-y-2 3xl:gap-y-4 custom-scrollbar">
			<div className="flex justify-between">
				<div className="flex gap-2">
					<div className="aspect-square w-10 h-10 3xl:w-12 3xl:h-12">
						<img
							alt={`${champion}-${skill}`}
							src={`https://cdn.communitydragon.org/latest/champion/${champion}/ability-icon/${skill.toLowerCase()}.png`}
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="h-12">
						<p className="font-semibold">
							[{skill}] {item?.name ?? ''}
						</p>
						{skillLv ? <p>Level {skillLv}</p> : null}
					</div>
				</div>
				<div className="text-right">
					{cooldownDisplay ? (
						<p>Cooldown: {renderCooldownHeader(cooldownDisplay)}</p>
					) : null}
					<p className="text-muted-foreground/80">{item?.cost ? cost : 'No cost'}</p>
				</div>
			</div>
			<div className="h-[2px] my-1 2xl:my-2 bg-hex-gold/30 dark:bg-hex-gold/10"></div>
			<SkillDescriptionContent
				champion={champion}
				item={item}
				skill={skill}
				skillLv={effectiveSkillLevel}
				skillsPayload={skillsPayload}
				totalAd={totalAd}
				totalAp={totalAp}
				championLevel={championLevel}
				bonusHealth={bonusHealth}
				detailRowMode="all"
				variant="inline"
			/>
		</div>
	);
};

const SkillPopover = ({
	children,
	item,
	champion,
	skill,
	skillLv,
	skillsPayload,
	totalAd,
	totalAp,
	championLevel,
	bonusHealth,
	popoverClassName,
	triggerClassName,
}: SkillPopoverProps) => {
	return (
		<HoverPopover
			align="center"
			side="top"
			sideOffset={10}
			content={
				<SkillContent
					champion={champion}
					item={item}
					skill={skill}
					skillLv={skillLv}
					skillsPayload={skillsPayload}
					totalAd={totalAd}
					totalAp={totalAp}
					championLevel={championLevel}
					bonusHealth={bonusHealth}
				/>
			}
			contentClassName={clsx(POPOVER_CONTENT_CLASS, popoverClassName)}
			triggerClassName={triggerClassName}
		>
			{children}
		</HoverPopover>
	);
};

export default SkillPopover;
