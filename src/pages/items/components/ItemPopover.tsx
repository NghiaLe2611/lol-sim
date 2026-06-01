import HoverPopover from '@/components/HoverPopover';
import { itemImgUrl } from '@/constants/common';
import { cn } from '@/lib/utils';
import { ItemDescriptionParts } from '@/pages/items/ItemDescriptionParts';
import { ItemTreeHorizontal } from '@/pages/items/ItemTree';
import { parseItemDescription } from '@/pages/items/utils';
import { Coins } from 'lucide-react';
import React from 'react';
import { SrItem } from '../utils';
import { useAppContext } from '@/contexts/AppContext';

const POPOVER_CONTENT_CLASS =
	'rounded-none border-hex-gold bg-background p-0 shadow-lg data-[state=open]:animate-none data-[state=closed]:animate-none data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100';

function ItemHoverContent({
	item,
	itemsById,
	showTree,
}: {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	showTree?: boolean;
}) {
	const { patchVersion } = useAppContext();

	const { statLines, passives } = parseItemDescription(item.description);
	const hasRecipe = item.from.length > 0;

	return (
		<div className="w-[min(20rem,calc(100vw-2rem))]">
			<div className="flex gap-3 border-b dark:border-[#5a4617] border-[#bb994c] p-3">
				<img
					alt=""
					className="size-12 shrink-0 object-cover"
					src={itemImgUrl(patchVersion as string, item.id)}
				/>
				<div className="min-w-0 flex-1">
					{item.nameLines.map((line, i) => (
						<p
							key={`${line}-${i}`}
							className={cn(
								'leading-snug',
								i === 0
									? 'display text-base font-semibold text-hex-gold'
									: 'text-muted-foreground mt-0.5 text-xs'
							)}
						>
							{line}
						</p>
					))}
					<p className="text-hex-gold/80 mt-1 flex items-center gap-1 text-sm">
						<Coins className="size-3.5 shrink-0" />
						<span className="font-semibold">{item.goldTotal.toLocaleString()}</span>
					</p>
				</div>
			</div>
			<div className="space-y-0.5 p-3 xl:space-y-1">
				{statLines.map((line, i) => (
					<p
						key={`${line}-${i}`}
						className="text-foreground text-xs leading-snug lg:text-sm"
					>
						{line}
					</p>
				))}
				{passives.map((block, index) => (
					<p
						key={`${block.title}-${index}`}
						className="text-foreground !mt-2 leading-snug text-xs lg:text-sm"
					>
						<span className="font-semibold">{block.title}:</span>{' '}
						<ItemDescriptionParts parts={block.parts} />
					</p>
				))}
				{item.plaintext ? (
					<p className="text-muted-foreground !mt-3 leading-snug text-xs lg:text-sm">
						{item.plaintext}
					</p>
				) : null}
			</div>
			{hasRecipe && showTree ? (
				<div className="border-t dark:border-[#5a4617]/60 border-[#bb994c]/60 p-3">
					{/* <ItemTreeVertical item={item} itemsById={itemsById} patchVersion={patchVersion} /> */}
					<ItemTreeHorizontal
						item={item}
						itemsById={itemsById}
						patchVersion={patchVersion as string}
					/>
				</div>
			) : null}
		</div>
	);
}

interface ItemPopoverProps {
	children: React.ReactNode;
	item: SrItem;
	itemsById: Record<string, SrItem>;
	showTree?: boolean;
	// patchVersion: string;
}
const ItemPopover = ({ children, item, itemsById, showTree = true }: ItemPopoverProps) => {
	return (
		<HoverPopover
			showTree={showTree}
			align="center"
			side="top"
			sideOffset={0}
			closeDelayMs={0}
			content={<ItemHoverContent item={item} itemsById={itemsById} showTree={showTree} />}
			contentClassName={POPOVER_CONTENT_CLASS}
		>
			{children}
		</HoverPopover>
	);
};

export default ItemPopover;
