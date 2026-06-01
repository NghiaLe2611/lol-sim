import type { ReactNode } from 'react';
import type { SrItem } from '@/pages/items/utils';
import ItemPopover from '@/pages/items/components/ItemPopover';

type ItemTreeChildPopoverProps = {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	children: ReactNode;
};

/** Hover stats for tree components — no nested build tree. */
export function ItemTreeChildPopover({ item, itemsById, children }: ItemTreeChildPopoverProps) {
	return (
		<ItemPopover item={item} itemsById={itemsById} showTree={false}>
			{children}
		</ItemPopover>
	);
}
