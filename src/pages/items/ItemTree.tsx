import type { ReactNode } from 'react';
import { itemImgUrl } from '@/constants/common';
import type { SrItem } from '@/pages/items/utils';
import { ItemTreeChildPopover } from '@/pages/items/components/ItemTreeChildPopover';
import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

const V_LINE_COLOR = 'bg-[#bb994c] dark:bg-[#5a4617]';

const VERT_CHILD_INDENT_PX = 56;
const VERT_LINE_LEFT_PX = 23.5;
const VERT_H_LINE_WIDTH_PX = 32.5;
const VERT_BRANCH_GAP_REM = 0.75;
/** size-10 = 40px → connector at icon vertical center */
const VERT_ICON_SIZE_PX = 40;
const VERT_ICON_CENTER_Y_PX = VERT_ICON_SIZE_PX / 2;

/** Fixed slot width — matches ItemTreeHorizontal / client shop tree. */
const NODE_W_REM = 4.5;
const GAP_REM = 0.75;
const NODE_CENTER_REM = NODE_W_REM / 2;

type ItemTreeProps = {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
};

function resolveComponents(item: SrItem, itemsById: Record<string, SrItem>): SrItem[] {
	return item.from.map((id) => itemsById[id]).filter((c): c is SrItem => Boolean(c));
}

/** Siblings with more components first; stable tie-break on original order. */
function sortComponentsByChildCount(
	children: SrItem[],
	itemsById: Record<string, SrItem>
): SrItem[] {
	return [...children]
		.map((child, index) => ({ child, index }))
		.sort((a, b) => {
			const countA = resolveComponents(a.child, itemsById).length;
			const countB = resolveComponents(b.child, itemsById).length;
			if (countB !== countA) return countB - countA;
			return a.index - b.index;
		})
		.map(({ child }) => child);
}

/** Width in rem for a row of `slotCount` item icons (4.5rem each + gaps). */
function gridWidthRem(slotCount: number): number {
	if (slotCount <= 0) return NODE_W_REM;
	return slotCount * NODE_W_REM + Math.max(0, slotCount - 1) * GAP_REM;
}

/**
 * How many grid slots a sibling column must reserve (max direct child count among siblings).
 * Leaf / no recipe → 1 slot; Pickaxe between two 3-child branches still gets a 3-slot-wide column.
 */
function maxSiblingSlotCount(children: SrItem[], itemsById: Record<string, SrItem>): number {
	if (children.length === 0) return 1;
	return Math.max(
		1,
		...children.map((c) => {
			const sub = resolveComponents(c, itemsById);
			return sub.length === 0 ? 1 : sub.length;
		})
	);
}

function siblingColumnWidthRem(children: SrItem[], itemsById: Record<string, SrItem>): number {
	return gridWidthRem(maxSiblingSlotCount(children, itemsById));
}

function siblingsRowWidthRem(siblingCount: number, columnWidthRem: number): number {
	if (siblingCount <= 0) return NODE_W_REM;
	return siblingCount * columnWidthRem + Math.max(0, siblingCount - 1) * GAP_REM;
}

function ItemTreeNodeCompact({
	item,
	patchVersion,
	variant = 'component',
	onClick,
}: {
	item: SrItem;
	patchVersion: string;
	variant?: 'parent' | 'component';
	onClick?: () => void;
}) {
	const Element = onClick ? 'button' : 'div';
	return (
		<Element
			type={onClick ? 'button' : undefined}
			onClick={onClick}
			className={cn(
				'flex w-[4.5rem] flex-col items-center text-xs focus:outline-none lg:text-sm',
				onClick && 'group cursor-pointer',
				variant === 'parent' && 'mb-2'
			)}
		>
			<div
				className={cn(
					'flex items-center justify-center rounded-sm border border-[#8a7344]/80 bg-white p-1 transition-colors dark:bg-black/25',
					variant === 'parent' ? 'size-12' : 'size-10',
					onClick && 'group-hover:border-hex-gold'
				)}
			>
				<img
					alt=""
					className="size-full object-cover"
					src={itemImgUrl(patchVersion, item.id)}
				/>
			</div>
			<p
				className={cn(
					'mt-1 text-center font-medium leading-none text-hex-gold/80 transition-colors',
					onClick && 'group-hover:text-hex-gold'
				)}
			>
				{item.goldTotal.toLocaleString()}
			</p>
		</Element>
	);
}

function VerticalTreeBranchLines({ isLast }: { isLast: boolean }) {
	return (
		<>
			<div
				className={cn('absolute w-px', V_LINE_COLOR)}
				style={{
					left: `${VERT_LINE_LEFT_PX}px`,
					top: `-${VERT_BRANCH_GAP_REM}rem`,
					...(isLast
						? { height: `calc(${VERT_BRANCH_GAP_REM}rem + ${VERT_ICON_CENTER_Y_PX}px)` }
						: { bottom: 0 }),
				}}
			/>
			<div
				className={cn('absolute h-px -translate-y-1/2', V_LINE_COLOR)}
				style={{
					left: `${VERT_LINE_LEFT_PX}px`,
					width: `${VERT_H_LINE_WIDTH_PX}px`,
					top: `${VERT_ICON_CENTER_Y_PX}px`,
				}}
			/>
		</>
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
		<div className="flex min-w-0 items-start gap-2 text-xs lg:text-sm">
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
				<p className="mt-0.5 flex items-center gap-1 text-xs text-hex-gold/80">
					<Coins className="size-3 shrink-0" />
					<span>{item.goldTotal.toLocaleString()}</span>
				</p>
			</div>
		</div>
	);
}

/** Recursive dialog tree — equal column width from max sibling child-count. */
function ItemTreeChildrenRowRecursive({
	children,
	itemsById,
	renderChild,
}: {
	children: SrItem[];
	itemsById: Record<string, SrItem>;
	renderChild: (child: SrItem, index: number) => ReactNode;
}) {
	const n = children.length;
	if (n === 0) return null;

	const colWRem = siblingColumnWidthRem(children, itemsById);
	const totalWRem = siblingsRowWidthRem(n, colWRem);
	const connectorWRem = n > 1 ? (n - 1) * (colWRem + GAP_REM) : 0;
	const connectorLeftRem = colWRem / 2;

	return (
		<div
			className="relative grid justify-items-center overflow-visible"
			style={{
				width: `${totalWRem}rem`,
				gridTemplateColumns: `repeat(${n}, ${colWRem}rem)`,
				columnGap: `${GAP_REM}rem`,
			}}
		>
			{n > 1 ? (
				<div
					className={cn('pointer-events-none absolute top-0 z-0 h-px', V_LINE_COLOR)}
					style={{
						left: `${connectorLeftRem}rem`,
						width: `${connectorWRem}rem`,
					}}
				/>
			) : null}

			{sortComponentsByChildCount(children, itemsById).map((child, index) => (
				<div
					key={`${child.id}-${index}`}
					className="relative z-10 flex flex-col items-center overflow-visible"
					style={{ width: `${colWRem}rem` }}
				>
					<div className={cn('h-3 w-px shrink-0', V_LINE_COLOR)} />
					<div className="flex w-full justify-center overflow-visible">
						{renderChild(child, index)}
					</div>
				</div>
			))}
		</div>
	);
}

function wrapTreeChildNode(
	item: SrItem,
	itemsById: Record<string, SrItem>,
	isParent: boolean,
	node: ReactNode
) {
	if (isParent) return node;
	return (
		<ItemTreeChildPopover item={item} itemsById={itemsById}>
			{node}
		</ItemTreeChildPopover>
	);
}

function ItemTreeBranchRecursive({
	item,
	itemsById,
	patchVersion,
	variant,
	onClick,
	renderChild,
}: {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
	variant?: 'parent' | 'component';
	onClick?: () => void;
	renderChild: (child: SrItem, index: number) => ReactNode;
}) {
	const children = resolveComponents(item, itemsById);
	if (children.length === 0) return null;
	const isParent = variant === 'parent';

	return (
		<div className="inline-flex flex-col items-center overflow-visible">
			{wrapTreeChildNode(
				item,
				itemsById,
				isParent,
				<ItemTreeNodeCompact
					item={item}
					patchVersion={patchVersion}
					variant={variant}
					onClick={onClick}
				/>
			)}
			<div className={cn('h-3 w-px shrink-0', V_LINE_COLOR)} />
			<ItemTreeChildrenRowRecursive
				children={children}
				itemsById={itemsById}
				renderChild={renderChild}
			/>
		</div>
	);
}

/** Single-level tree for ItemPopover. */
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
							left: `${NODE_CENTER_REM}rem`,
							width: `calc(${children.length - 1} * (${NODE_W_REM}rem + ${GAP_REM}rem))`,
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

/** Single-level tree for ItemPopover */
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
							<li
								key={`${child.id}-${index}`}
								className="relative"
								style={{ paddingLeft: `${VERT_CHILD_INDENT_PX}px` }}
							>
								<VerticalTreeBranchLines isLast={isLast} />
								<ItemTreeNodeRow item={child} patchVersion={patchVersion} />
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}

function ItemTreeVerticalChildrenList({
	children,
	itemsById,
	patchVersion,
}: {
	children: SrItem[];
	itemsById: Record<string, SrItem>;
	patchVersion: string;
}) {
	const sorted = sortComponentsByChildCount(children, itemsById);

	return (
		<ul className="flex flex-col gap-3">
			{sorted.map((child, index) => {
				const isLast = index === sorted.length - 1;
				const grandChildren = resolveComponents(child, itemsById);

				return (
					<li
						key={`${child.id}-${index}`}
						className="relative"
						style={{ paddingLeft: `${VERT_CHILD_INDENT_PX}px` }}
					>
						<VerticalTreeBranchLines isLast={isLast} />
						<ItemTreeChildPopover item={child} itemsById={itemsById}>
							<ItemTreeNodeRow item={child} patchVersion={patchVersion} />
						</ItemTreeChildPopover>
						{grandChildren.length > 0 ? (
							<div className="relative mt-3">
								<ItemTreeVerticalChildrenList
									children={grandChildren}
									itemsById={itemsById}
									patchVersion={patchVersion}
								/>
							</div>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}

export function ItemTreeVerticalRecursive({
	item,
	itemsById,
	patchVersion,
	isRoot = true,
}: {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
	isRoot?: boolean;
}) {
	const children = resolveComponents(item, itemsById);

	if (children.length === 0) {
		return (
			<div className="w-full">
				<ItemTreeNodeRow
					item={item}
					index={isRoot ? 0 : undefined}
					patchVersion={patchVersion}
				/>
			</div>
		);
	}

	return (
		<div className="w-full">
			<ItemTreeNodeRow
				item={item}
				index={isRoot ? 0 : undefined}
				patchVersion={patchVersion}
			/>
			<div className="relative mt-3">
				<ItemTreeVerticalChildrenList
					children={children}
					itemsById={itemsById}
					patchVersion={patchVersion}
				/>
			</div>
		</div>
	);
}

export function ItemTreeHorizontalRecursive({
	item,
	itemsById,
	patchVersion,
	isRoot = true,
	onSelect,
}: {
	item: SrItem;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
	isRoot?: boolean;
	onSelect?: (id: string) => void;
}) {
	const children = resolveComponents(item, itemsById);

	if (children.length === 0) {
		const node = (
			<ItemTreeNodeCompact
				item={item}
				patchVersion={patchVersion}
				variant={isRoot ? 'parent' : 'component'}
				// onClick={onSelect ? () => onSelect(item.id) : undefined}
			/>
		);
		return wrapTreeChildNode(item, itemsById, isRoot, node);
	}

	return (
		<ItemTreeBranchRecursive
			item={item}
			itemsById={itemsById}
			patchVersion={patchVersion}
			variant={isRoot ? 'parent' : 'component'}
			// onClick={onSelect ? () => onSelect(item.id) : undefined}
			renderChild={(child) => (
				<ItemTreeHorizontalRecursive
					item={child}
					itemsById={itemsById}
					patchVersion={patchVersion}
					isRoot={false}
					onSelect={undefined}
				/>
			)}
		/>
	);
}

export { ItemTreeHorizontal, ItemTreeVertical };
