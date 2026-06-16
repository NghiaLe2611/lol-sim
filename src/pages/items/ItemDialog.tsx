import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { itemImgUrl } from '@/constants/common';
import { cn } from '@/lib/utils';
import { ItemDescriptionParts } from '@/pages/items/ItemDescriptionParts';
import { ItemTreeHorizontalRecursive, ItemTreeVerticalRecursive } from '@/pages/items/ItemTree';
import { parseItemDescription, type SrItem } from '@/pages/items/utils';
import { Coins } from 'lucide-react';

type ItemDialogProps = {
	activeId: string | null;
	onClose: () => void;
	onSelectActiveId: (id: string) => void;
	itemsById: Record<string, SrItem>;
	patchVersion: string;
};

const ItemDialog = ({
	activeId,
	onClose,
	onSelectActiveId,
	itemsById,
	patchVersion,
}: ItemDialogProps) => {
	const item = activeId ? itemsById[activeId] : null;

	if (!item) return null;

	const { statLines, passives } = parseItemDescription(item.description);
	const hasRecipe = item.from.length > 0;

	return (
		<Dialog open={Boolean(activeId)} onOpenChange={(open) => !open && onClose()}>
			{/* animate-in fade-in-0 zoom-in-95 duration-200 */}
			<DialogContent
				showCloseButton={false}
				className="max-w-max overflow-hidden border-hex-gold bg-background p-0 shadow-2xl"
			>
				<VisuallyHidden.Root>
					<DialogTitle>{item.name}</DialogTitle>
					<DialogDescription>
						{item.plaintext || 'Item building tree and stats'}
					</DialogDescription>
				</VisuallyHidden.Root>

				<div className="bg-muted/10 flex gap-4 border-b border-[#bb994c] p-3 dark:border-[#5a4617] 3xl:p-5">
					<img
						alt={item.name}
						className="size-16 shrink-0 rounded-md border border-hex-gold/40 object-cover shadow-md"
						src={itemImgUrl(patchVersion, item.id)}
					/>
					<div className="flex min-w-0 flex-1 flex-col justify-center">
						{/* {item.nameLines.map((line, i) => (
							<h2
								key={`${line}-${i}`}
								className={cn(
									'leading-snug',
									i === 0
										? 'display text-base xl:text-xl font-semibold text-hex-gold'
										: 'text-muted-foreground mt-0.5 text-xs lg:text-sm'
								)}
							>
								{line}
							</h2>
						))} */}
						<h2 className="display text-base font-semibold leading-snug text-hex-gold lg:text-xl">
							{item.name}
						</h2>
						<p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-hex-gold/80 lg:text-base">
							<Coins className="size-4 shrink-0" />
							<span>{item.goldTotal.toLocaleString()}</span>
						</p>
					</div>
				</div>

				{/* Item stats & passives */}
				<div className="max-h-[40vh] space-y-3 overflow-y-auto border-b border-[#bb994c]/40 p-3 !pt-0 dark:border-[#5a4617]/40 3xl:p-5">
					{statLines.length > 0 && (
						<div className="space-y-1">
							{statLines.map((line, i) => (
								<p
									key={`${line}-${i}`}
									className="text-xs font-medium leading-relaxed text-foreground lg:text-sm"
								>
									{line}
								</p>
							))}
						</div>
					)}

					{passives.length > 0 && (
						<div className="space-y-1">
							{passives.map((block) => (
								<p
									key={block.title}
									className="text-xs leading-relaxed text-foreground lg:text-sm"
								>
									<span className="font-semibold text-hex-gold/90">
										{block.title}:
									</span>{' '}
									<ItemDescriptionParts parts={block.parts} />
								</p>
							))}
						</div>
					)}

					{item.plaintext && (
						<p className="pt-1 text-sm italic leading-relaxed text-muted-foreground">
							{item.plaintext}
						</p>
					)}
				</div>

				{/* Multi-level recursive tree */}
				{hasRecipe && (
					<div className="bg-muted/5 flex flex-col items-center p-3 !pt-0 3xl:p-5">
						{/* <h3 className="text-muted-foreground self-start text-xs lg:text-sm font-medium uppercase tracking-wider mb-4">
							Build Tree
						</h3> */}
						<div className="scrollbar-thin flex w-full justify-center overflow-x-auto py-2">
							<div className="min-w-max px-4">
								<ItemTreeHorizontalRecursive
									item={item}
									itemsById={itemsById}
									patchVersion={patchVersion}
									onSelect={onSelectActiveId}
								/>
								{/* <ItemTreeVerticalRecursive
									item={item}
									itemsById={itemsById}
									patchVersion={patchVersion}
								/> */}
							</div>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ItemDialog;
