import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { matchesDisplayNamePrefix, rankDisplayNameSearch } from '@/utils/common';
import { Search } from 'lucide-react';

type Props<T> = {
	items: T[];
	getLabel: (item: T) => string;
	placeholder?: string;
	onChange: (value: string) => void;
	value: string;
	/** Merged into the input; use e.g. `h-8 md:h-10` to align with an adjacent control. */
	inputClassName?: string;
	/** When true, match query anywhere in the label (case-insensitive). Default: prefix match. */
	matchIncludes?: boolean;
	getImgUrl?: (item: T) => string;
	handleClick?: (item?: any) => void;
	onEnter?: (item?: any) => void;
};

export function SearchAutocomplete<T>({
	items,
	getLabel,
	placeholder = 'Search...',
	onChange,
	value,
	inputClassName,
	getImgUrl,
	handleClick,
	onEnter,
	matchIncludes = false,
}: Props<T>) {
	const [focused, setFocused] = useState(false);

	const suggestions = useMemo(() => {
		const q = value.trim().toLowerCase();
		if (!q) return [];

		return items
			.map((it) => ({
				it,
				label: getLabel(it),
				rank: rankDisplayNameSearch(q, getLabel(it)),
			}))
			.filter(
				(row) =>
					row.rank != null &&
					(matchIncludes ? true : matchesDisplayNamePrefix(q, row.label))
			)
			.sort((a, b) => {
				if (a.rank! !== b.rank!) return a.rank! - b.rank!;
				return a.label.localeCompare(b.label);
			})
			.slice(0, 6)
			.map((row) => row.it);
	}, [items, value, getLabel, matchIncludes]);

	return (
		<div className="relative w-full min-w-0">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setTimeout(() => setFocused(false), 150)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							if (suggestions.length === 1) {
								onEnter?.(suggestions[0]);
							}
						}
					}}
					placeholder={placeholder}
					className={cn(
						'bg-input/60 border-border/60 focus:border-hex-gold pl-9',
						inputClassName
					)}
				/>
			</div>
			{focused && suggestions.length > 0 && (
				<div className="absolute z-30 mt-1 w-full bg-popover border border-hex-gold/30 rounded-md shadow-hex overflow-hidden">
					{suggestions.map((s, i) => (
						<button
							key={i}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								onChange(getLabel(s));
								handleClick?.(s);
							}}
							className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-secondary text-foreground"
						>
							{getImgUrl && (
								<img
									src={getImgUrl(s)}
									alt={getLabel(s)}
									className="w-4 h-4 mr-1"
								/>
							)}
							{getLabel(s)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
