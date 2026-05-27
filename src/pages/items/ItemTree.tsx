import { itemImgUrl } from '@/constants/common';
import type { SrItem } from '@/pages/items/utils';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

const V_LINE_COLOR = 'bg-[#bb994c] dark:bg-[#5a4617]';

type ItemTreeProps = {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
};

function resolveComponents(item: SrItem, itemsById: Record<string, SrItem>): SrItem[] {
	return item.from.map((id) => itemsById[id]).filter((c): c is SrItem => Boolean(c));
}

function ItemTreeNodeCompact({
	item,
	patchVersion,
	variant = 'component',
}: {
	item: SrItem;
	patchVersion: string;
	variant?: 'parent' | 'component';
}) {
	return (
		<div className="flex w-[4.5rem] flex-col items-center text-xs lg:text-sm">
			<div
				className={cn(
					'flex items-center justify-center rounded-sm border p-1',
					variant === 'parent'
						? 'size-12 border-border/70 bg-muted/30'
						: 'size-10 border-[#8a7344]/80'
				)}
			>
				<img
					alt=""
					className="size-full object-cover"
					src={itemImgUrl(patchVersion, item.id)}
				/>
			</div>
			{/* <p className="text-center">{item.name}</p> */}
			<p className="text-hex-gold-dark mt-1 text-centerfont-medium leading-none">
				{item.goldTotal.toLocaleString()}
			</p>
		</div>
	);
}

function ItemTreeNodeRow({
	item,
	index,
	patchVersion,
}: {
	item: SrItem;
	index?: number;
	patchVersion: string;
}) {
	return (
		<div className="flex min-w-0 items-center gap-2 text-xs lg:text-sm">
			<div
				className={cn(
					'flex size-10 shrink-0 items-center justify-center rounded-sm border border-[#8a7344]/80 p-1',
					index === 0 && 'size-12'
				)}
			>
				<img
					alt={item.name}
					className="size-full object-cover"
					src={itemImgUrl(patchVersion, item.id)}
				/>
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium leading-snug text-foreground">{item.name}</p>
				<p className="text-hex-gold-dark mt-0.5 flex items-center gap-1 text-xs">
					<Coins className="size-3 shrink-0" />
					<span>{item.goldTotal.toLocaleString()}</span>
				</p>
			</div>
		</div>
	);
}

function ItemTreeHorizontal({ item, itemsById, patchVersion }: ItemTreeProps) {
	const children = resolveComponents(item, itemsById);
	if (children.length === 0) return null;

	return (
		<div className="flex w-full flex-col items-center">
			<ItemTreeNodeCompact item={item} patchVersion={patchVersion} variant="parent" />

			<div className={cn('h-3 w-px shrink-0', V_LINE_COLOR)} />

			<div className="relative inline-flex">
				{children.length > 1 ? (
					<div
						className={cn('absolute top-0 h-px', V_LINE_COLOR)}
						style={{
							left: '2.25rem',
							width: `calc(${children.length - 1} * (4.5rem + 0.75rem))`,
						}}
					/>
				) : null}

				{children.map((child, index) => (
					<div
						key={`${child.id}-${index}`}
						className={cn(
							'relative flex w-[4.5rem] flex-col items-center',
							index > 0 && 'ml-3'
						)}
					>
						<div className={cn('absolute top-0 h-3 w-px', V_LINE_COLOR)} />
						<div className="pt-3">
							<ItemTreeNodeCompact item={child} patchVersion={patchVersion} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function ItemTreeVertical({ item, itemsById, patchVersion }: ItemTreeProps) {
	const children = resolveComponents(item, itemsById);
	if (children.length === 0) return null;

	return (
		<div className="w-full">
			<ItemTreeNodeRow item={item} index={0} patchVersion={patchVersion} />

			<div className="relative mt-3">
				<ul className="flex flex-col gap-3">
					{children.map((child, index) => {
						const isLast = index === children.length - 1;
						return (
							<li key={`${child.id}-${index}`} className="relative pl-[56px]">
								{/* Vertical line segment */}
								<div
									className={cn('absolute left-[23.5px] w-px', V_LINE_COLOR)}
									style={{
										top: '-0.75rem',
										bottom: isLast ? '50%' : '0',
									}}
								/>

								{/* Horizontal line segment */}
								<div
									className={cn(
										'absolute top-1/2 h-px -translate-y-1/2',
										V_LINE_COLOR
									)}
									style={{ left: '23.5px', width: '32.5px' }}
								/>

								<ItemTreeNodeRow item={child} patchVersion={patchVersion} />
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

export { ItemTreeHorizontal, ItemTreeVertical };
