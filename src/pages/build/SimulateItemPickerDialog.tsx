import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { itemImgUrl } from '@/constants/common';
import { ITEM_TAG_FILTERS, type SrItem } from '@/pages/items/utils';
import ItemPopover from '@/pages/items/components/ItemPopover';
import { capitalizeText } from '@/utils/common';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
	BUILD_ITEM_CATEGORIES,
	countBuildItemsByCategory,
	filterBuildItems,
	type BuildItemCategory,
} from './build-item-selection';

interface SimulateItemPickerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	srItems: SrItem[];
	itemsById: Record<string, SrItem>;
	build: (string | null)[];
	hasBonusItems: boolean;
	patchVersion: string | null;
	loading?: boolean;
	onItemSelect: (itemId: string) => void;
}

const SimulateItemPickerDialog = ({
	open,
	onOpenChange,
	srItems,
	itemsById,
	build,
	hasBonusItems,
	patchVersion,
	loading = false,
	onItemSelect,
}: SimulateItemPickerDialogProps) => {
	const [itemSearch, setItemSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<BuildItemCategory>('all');
	const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);

	const itemCategoryCounts = useMemo(
		() => countBuildItemsByCategory(srItems),
		[srItems]
	);

	const filteredItems = useMemo(
		() =>
			filterBuildItems(srItems, {
				search: itemSearch,
				category: activeCategory,
				subFilter: activeSubFilter,
				hasBonusItems,
			}),
		[srItems, itemSearch, activeCategory, activeSubFilter, hasBonusItems]
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="outline:none w-full !max-w-3xl max-h-[90vh] gap-3 !ring-0 dark:bg-[#0c0c0c] border border-hex-gold/30 shadow-[0_0_10px] shadow-hex-gold/30 overflow-hidden p-0"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<VisuallyHidden.Root>
					<DialogTitle>Select Item</DialogTitle>
					<DialogDescription>Select an item to add to build</DialogDescription>
				</VisuallyHidden.Root>

				<div className="p-4 space-y-4">
					<h3 className="text-xs text-hex-gold font-bold tracking-wider uppercase">
						Item Selection
					</h3>

					<div className="relative">
						<Input
							className="w-full border border-hex-gold/30 dark:bg-[#070f19] text-xs h-9 pl-9 transition-none"
							placeholder="Search by item name..."
							value={itemSearch}
							onChange={(e) => setItemSearch(e.target.value)}
						/>
						<Search className="size-4 text-hex-gold/45 absolute left-3 top-2.5" />
					</div>

					<div className="flex flex-wrap items-center gap-2 border-b border-hex-gold/20 pb-2">
						{BUILD_ITEM_CATEGORIES.map((cat) => {
							const count = itemCategoryCounts[cat.id];
							const isActive = activeCategory === cat.id;
							return (
								<button
									key={cat.id}
									type="button"
									onClick={() => {
										setActiveCategory(cat.id);
										setActiveSubFilter(null);
									}}
									className={clsx(
										'p-1 text-xs border-b-2 font-medium hover:opacity-80',
										isActive
											? 'border-hex-gold text-hex-gold font-semibold'
											: 'border-transparent text-muted-foreground'
									)}
								>
									{cat.label} ({count})
								</button>
							);
						})}
					</div>

					<div className="flex flex-wrap gap-1.5">
						{ITEM_TAG_FILTERS.map((tagChip) => {
							const isActive = activeSubFilter === tagChip;
							return (
								<button
									key={tagChip}
									type="button"
									onClick={() => {
										setActiveSubFilter((prev) => (prev === tagChip ? null : tagChip));
									}}
									className={clsx(
										'capitalize rounded-sm border border-neutral-400/50 bg-background px-3 py-1 text-xs text-muted-foreground hover:opacity-80 dark:border-hex-gold/50',
										isActive &&
											'!border-hex-gold bg-hex-gold/10 font-medium !text-hex-gold'
									)}
								>
									{capitalizeText(tagChip)}
								</button>
							);
						})}
					</div>

					<div
						className={clsx(
							'p-3 grid grid-cols-3 md:grid-cols-6 gap-3 max-h-[360px] border border-hex-gold/20 rounded dark:bg-[#0b1319] custom-scrollbar',
							loading && '!overflow-y-hidden'
						)}
					>
						{loading ? (
							Array.from({ length: 24 }).map((_, i) => (
								<div
									key={i}
									className="aspect-[4/5] bg-gray-200 dark:bg-gray-900 rounded animate-pulse border border-hex-gold/10"
								/>
							))
						) : filteredItems.length === 0 ? (
							<div className="col-span-full text-center py-12 text-xs text-muted-foreground">
								No items found matching the filters
							</div>
						) : (
							filteredItems.map((item) => (
								<ItemPopover
									key={item.id}
									item={item}
									itemsById={itemsById}
									showTree={false}
								>
									<button
										type="button"
										onClick={() => onItemSelect(item.id)}
										className={clsx(
											'w-full grid border border-hex-gold/20 bg-gray-200/60 hover:bg-gray-200 dark:bg-[#09111b] hover:dark:bg-[#0f1b27] hover:border-hex-gold/50 text-center aspect-[5/6] min-w-0',
											build.includes(item.id)
												? '!bg-hex-gold/20 dark:!bg-hex-gold/10'
												: ''
										)}
									>
										<div className="flex flex-col items-center p-2 w-full h-full">
											<div className="flex-1 flex flex-col items-center justify-center">
												{patchVersion ? (
													<img
														src={itemImgUrl(patchVersion, item.id)}
														alt={item.name}
														className="size-10 object-cover rounded-md mb-1 mx-auto hover:scale-110"
													/>
												) : null}
												<div className="text-[10px] font-semibold text-muted-foreground w-full px-0.5">
													{item.name}
												</div>
											</div>
											<div className="text-[10px] text-hex-gold/80 font-bold">
												{item.goldTotal}g
											</div>
										</div>
									</button>
								</ItemPopover>
							))
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SimulateItemPickerDialog;
