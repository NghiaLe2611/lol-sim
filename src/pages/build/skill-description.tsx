import React, { useMemo } from 'react';
import type { BonusAbility } from '@/pages/champion-detail/utils';
import {
	formatSkillDetailRowAtLevel,
	getSegmentColorClass,
	getSkillDetailRows,
	getSkillDetailRowsFromAbility,
	mergeSkillDetailRows,
	parseSkillDescription,
	resolveChampionSkill,
	type SkillDescriptionSegment,
	type SkillDetailRow,
} from './skills';

const INLINE_BREAK_PATTERN = /(?:<br\s*\/?>|br\s*\/?>)/gi;

export function renderTextWithLineBreaks(
	text: string,
	className: string,
	key: React.Key
): React.ReactNode {
	const parts = text.replace(INLINE_BREAK_PATTERN, '\n').split('\n');

	if (parts.length <= 1) {
		return (
			<span key={key} className={className}>
				{parts[0] ?? ''}
			</span>
		);
	}

	return parts.map((part, index) => (
		<React.Fragment key={`${String(key)}-${index}`}>
			{index > 0 ? <br /> : null}
			{part ? <span className={className}>{part}</span> : null}
		</React.Fragment>
	));
}

export function renderSegment(segment: SkillDescriptionSegment, key: React.Key): React.ReactNode {
	if (segment.kind === 'lineBreak') {
		return <br key={key} />;
	}

	const className = getSegmentColorClass(segment);

	if (segment.kind === 'text') {
		return renderTextWithLineBreaks(segment.text, className, key);
	}

	if (segment.kind === 'number') {
		return (
			<span key={key} className={`${className} font-semibold`}>
				{segment.value}
			</span>
		);
	}

	if (segment.kind === 'ratio_damage') {
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

export type SkillDescriptionContentProps = {
	champion: string | null;
	item: BonusAbility | null;
	skill: string;
	skillLv: number;
	skillsPayload?: Record<string, unknown>;
	totalAd: number;
	totalAp: number;
	championLevel: number;
	bonusHealth: number;
	/** `single` shows only the value for the selected skill rank. */
	detailRowMode?: 'all' | 'single';
	variant?: 'panel' | 'inline';
	showDetailRows?: boolean;
};

function abilityDescriptionFallback(ability: BonusAbility | null | undefined): string {
	if (!ability) return '';
	const fromEffects = (ability.effects ?? [])
		.map((effect) => effect.description?.trim())
		.filter(Boolean)
		.join(' ');
	return fromEffects || ability.blurb?.trim() || '';
}

function renderDetailRowValue(
	row: SkillDetailRow,
	mode: 'all' | 'single',
	key: React.Key
): React.ReactNode {
	if (mode === 'single') {
		return (
			<span key={key} className="font-semibold text-muted-foreground">
				{formatSkillDetailRowAtLevel(row)}
			</span>
		);
	}

	const values = row.values;
	const highlightIndex = row.currentIndex ?? 0;

	return values.map((value, index) => (
		<React.Fragment key={`${String(key)}-${index}`}>
			{index > 0 ? '/' : null}
			{index === highlightIndex ? (
				<var className="not-italic font-semibold text-muted-foreground">{value}</var>
			) : (
				value
			)}
		</React.Fragment>
	));
}

export function SkillDescriptionContent({
	champion,
	item,
	skill,
	skillLv,
	skillsPayload,
	totalAd,
	totalAp,
	championLevel,
	bonusHealth,
	detailRowMode = 'all',
	variant = 'panel',
	showDetailRows = true,
}: SkillDescriptionContentProps) {
	const effectiveSkillLevel = skillLv > 0 ? skillLv : 1;

	const skillDef = useMemo(
		() => (skillsPayload ? resolveChampionSkill(skillsPayload, skill) : null),
		[skillsPayload, skill]
	);

	const descriptionCtx = useMemo(
		() => ({
			level: effectiveSkillLevel,
			ad: totalAd,
			ap: totalAp,
			championLevel,
			bonusHealth,
		}),
		[effectiveSkillLevel, totalAd, totalAp, championLevel, bonusHealth]
	);

	const { segments, detailRows, descriptionFallback } = useMemo(() => {
		const abilityRows = getSkillDetailRowsFromAbility(
			item,
			effectiveSkillLevel,
			skill,
			skillDef
		);

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
	}, [skillDef, item, descriptionCtx, effectiveSkillLevel, skill]);

	if (!champion) return null;

	return (
		<div
			className={
				variant === 'panel' ? 'space-y-2 pt-2 border-t border-hex-gold/10' : 'space-y-2'
			}
		>
			<div className="leading-relaxed text-muted-foreground/90 text-xs">
				{segments.length > 0
					? segments.map((segment, index) => renderSegment(segment, index))
					: descriptionFallback}
			</div>
			{showDetailRows && detailRows.length > 0 ? (
				<div className="flex flex-col gap-1 text-xs text-muted-foreground/90">
					{detailRows.map((row) => (
						<p key={row.label} className="flex justify-between gap-4">
							<span>{row.label}</span>
							<span className="text-right">
								{renderDetailRowValue(row, detailRowMode, row.label)}
							</span>
						</p>
					))}
				</div>
			) : null}
		</div>
	);
}
