import HoverPopover from '@/components/HoverPopover';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { BonusAbility } from '../champion-detail/utils';
import {
	compressSkillDetailValues,
	getSegmentColorClass,
	getSkillDetailRows,
	getSkillDetailRowsFromAbility,
	mergeSkillDetailRows,
	parseSkillDescription,
	resolveChampionSkill,
	type SkillDescriptionSegment,
} from './skills';

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
}

function renderSegment(segment: SkillDescriptionSegment, key: React.Key): React.ReactNode {
	const className = getSegmentColorClass(segment);

	if (segment.kind === 'text') {
		return (
			<span key={key} className={className}>
				{segment.text}
			</span>
		);
	}

	if (segment.kind === 'number') {
		return (
			<span key={key} className={`${className} font-semibold`}>
				{segment.value}
			</span>
		);
	}

	if (segment.kind === 'ratio') {
		return (
			<span key={key} className={`${className} font-semibold`}>
				{segment.text}
			</span>
		);
	}

	return (
		<span key={key} className={`${className} font-semibold`}>
			{segment.children.map((child, index) => renderSegment(child, index))}
		</span>
	);
}

function renderLevelValues(row: { label: string; values: string[]; currentIndex?: number }) {
	const values = compressSkillDetailValues(row.values);
	const highlightIndex = values.length === 1 ? 0 : row.currentIndex;

	return values.map((value, index) => (
		<React.Fragment key={`${row.label}-${index}`}>
			{index > 0 ? '/' : null}
			{index === highlightIndex ? (
				<var className="not-italic font-semibold text-muted-foreground">{value}</var>
			) : (
				value
			)}
		</React.Fragment>
	));
}

function abilityDescriptionFallback(ability: BonusAbility | null | undefined): string {
	if (!ability) return '';
	const fromEffects = (ability.effects ?? [])
		.map((effect) => effect.description?.trim())
		.filter(Boolean)
		.join(' ');
	return fromEffects || ability.blurb?.trim() || '';
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
}: SkillContentProps) => {
	const effectiveSkillLevel = skillLv && skillLv > 0 ? skillLv : 1;

	const skillDef = useMemo(
		() => (skillsPayload ? resolveChampionSkill(skillsPayload, skill) : null),
		[skillsPayload, skill]
	);

	console.log({
		skillsPayload, skillDef
	})

	const descriptionCtx = useMemo(
		() => ({
			level: effectiveSkillLevel,
			ad: totalAd,
			ap: totalAp,
			championLevel,
		}),
		[effectiveSkillLevel, totalAd, totalAp, championLevel]
	);

	const { segments, detailRows, descriptionFallback } = useMemo(() => {
		const abilityRows = getSkillDetailRowsFromAbility(item, effectiveSkillLevel);

		if (skillDef) {
			const parsed = parseSkillDescription(skillDef, descriptionCtx);
			const formulaRows = getSkillDetailRows(skillDef, descriptionCtx);
			return {
				segments: parsed.segments,
				detailRows: mergeSkillDetailRows(formulaRows, abilityRows),
				descriptionFallback: '',
			};
		}

		return {
			segments: [] as SkillDescriptionSegment[],
			detailRows: abilityRows,
			descriptionFallback: abilityDescriptionFallback(item),
		};
	}, [skillDef, item, descriptionCtx, effectiveSkillLevel]);

	const coolDown = skillLv ? item?.cooldown?.modifiers?.[0]?.values?.[skillLv - 1] : null;
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
					{coolDown != null && <p>Cooldown: {coolDown}s</p>}
					<p className="text-muted-foreground/80">{item?.cost ? cost : 'No cost'}</p>
				</div>
			</div>
			<div className="h-[2px] my-1 2xl:my-2 bg-hex-gold/30 dark:bg-hex-gold/10"></div>
			<div className="leading-relaxed text-muted-foreground/90">
				{segments.length > 0
					? segments.map((segment, index) => renderSegment(segment, index))
					: descriptionFallback}
			</div>
			{detailRows.length > 0 ? (
				<>
					<div className="h-[2px] my-1 2xl:my-2 bg-hex-gold/30 dark:bg-hex-gold/10"></div>
					<div className="flex flex-col gap-1 text-muted-foreground/90">
						{detailRows.map((row) => (
							<p key={row.label} className="flex justify-between gap-4">
								<span>{row.label}</span>
								<span className="text-right">{renderLevelValues(row)}</span>
							</p>
						))}
					</div>
				</>
			) : null}
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
