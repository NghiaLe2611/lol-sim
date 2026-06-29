import HoverPopover from '@/components/HoverPopover';
import clsx from 'clsx';
import React from 'react';
import { BonusAbilityCard } from '../champion-detail';

type Skill = any;

const POPOVER_CONTENT_CLASS =
	'rounded-none border-hex-gold bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100';

interface SkillPopoverProps {
	children: React.ReactNode;
	item: Skill;
	popoverClassName?: string;
	triggerClassName?: string;
	champion: string | null;
	skill: string;
	skillLv?: number;
}

interface SkillContentProps {
	champion: string | null;
	item: Skill;
	skill: string;
	skillLv?: number;
}

const SkillDetail = () => {
	return <div>Skill Detail</div>;
};

const SkillContent = ({ champion, item, skill, skillLv }: SkillContentProps) => {
	if (!champion) return;
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
							[{skill}] {item.name}
						</p>
						{skillLv ? <p>Level {skillLv}</p> : null}
					</div>
				</div>
				{skillLv && skillLv > 0 ? (
					<div>
						<p>Cooldown: {item.cooldown?.modifiers?.[0]?.values?.[skillLv - 1]}s</p>
						<p>
							Cost: {item.cost?.modifiers?.[0]?.values?.[skillLv - 1] ?? 0} {item.resource}
						</p>
					</div>
				) : null}
			</div>
			<div className="h-[2px] bg-hex-gold/30 dark:bg-hex-gold/10"></div>
			<div>
				{/* <BonusAbilityCard slot={skill as 'P' | 'Q' | 'W' | 'E' | 'R'} spells={[item]} /> */}
                {/* description */}
			</div>
			{/* {
                item?.notes && <p>{item.notes}</p>
            } */}
		</div>
	);
};

const SkillPopover = ({
	children,
	item,
	champion,
	skill,
	skillLv,
	popoverClassName,
	triggerClassName,
}: SkillPopoverProps) => {
	console.log('skilll', item);
	return (
		<HoverPopover
			align="center"
			side="top"
			sideOffset={10}
			content={
				<SkillContent champion={champion} item={item} skill={skill} skillLv={skillLv} />
			}
			contentClassName={clsx(POPOVER_CONTENT_CLASS, popoverClassName)}
			triggerClassName={triggerClassName}
		>
			{children}
		</HoverPopover>
	);
};

export default SkillPopover;
