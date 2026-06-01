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
			<DialogContent showCloseButton={false} className="max-w-max bg-background border-hex-gold p-0 overflow-hidden shadow-2xl">
				<VisuallyHidden.Root>
					<DialogTitle>{item.name}</DialogTitle>
					<DialogDescription>
						{item.plaintext || 'Item building tree and stats'}
					</DialogDescription>
				</VisuallyHidden.Root>

				<div className="flex gap-4 border-b dark:border-[#5a4617] border-[#bb994c] p-3 3xl:p-5 bg-muted/10">
					<img
						alt={item.name}
						className="size-16 shrink-0 object-cover rounded-md border border-hex-gold/40 shadow-md"
						src={itemImgUrl(patchVersion, item.id)}
					/>
					<div className="min-w-0 flex-1 flex flex-col justify-center">
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
						<h2 className="display text-base lg:text-xl font-semibold text-hex-gold leading-snug">
							{item.name}
						</h2>
						<p className="text-hex-gold/80 mt-1 flex items-center gap-1.5 text-sm lg:text-base font-medium">
							<Coins className="size-4 shrink-0" />
							<span>{item.goldTotal.toLocaleString()}</span>
						</p>
					</div>
				</div>

				{/* Item stats & passives */}
				<div className="!pt-0 p-3 3xl:p-5 space-y-3 max-h-[40vh] overflow-y-auto border-b dark:border-[#5a4617]/40 border-[#bb994c]/40">
					{statLines.length > 0 && (
						<div className="space-y-1">
							{statLines.map((line, i) => (
								<p
									key={`${line}-${i}`}
									className="text-foreground text-xs lg:text-sm leading-relaxed font-medium"
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
									className="text-foreground leading-relaxed text-xs lg:text-sm"
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
						<p className="text-muted-foreground leading-relaxed text-sm italic pt-1">
							{item.plaintext}
						</p>
					)}
				</div>

				{/* Multi-level recursive tree */}
				{hasRecipe && (
					<div className="!pt-0 p-3 3xl:p-5 bg-muted/5 flex flex-col items-center">
						{/* <h3 className="text-muted-foreground self-start text-xs lg:text-sm font-medium uppercase tracking-wider mb-4">
							Build Tree
						</h3> */}
						<div className="w-full overflow-x-auto py-2 flex justify-center scrollbar-thin">
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
