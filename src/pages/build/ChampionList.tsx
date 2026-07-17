import type { ChampionListRow } from '@/types/champions';
import clsx from 'clsx';
import React from 'react';

export type ChampionListProps = {
	champions: ChampionListRow[];
	loading?: boolean;
	selectedId: string | null;
	onSelect: (id: string) => void;
	getImageUrl: (championId: string) => string;
	containerCls?: string;
	wrapperCls?: string;
	skeletonCount?: number;
};

const DEFAULT_SKELETON_COUNT = 16;

const ChampionList = ({
	champions,
	loading = false,
	selectedId,
	onSelect,
	getImageUrl,
	containerCls,
	wrapperCls = 'h-[300px]',
	skeletonCount = DEFAULT_SKELETON_COUNT,
}: ChampionListProps) => {
	return (
		<div className={clsx('custom-scrollbar', wrapperCls)}>
			<div
				className={clsx(
					'grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 p-2 border border-hex-gold/20 rounded dark:bg-[#0b1319]',
					containerCls
				)}
			>
				{loading ? (
					Array.from({ length: skeletonCount }).map((_, i) => (
						<div
							key={i}
							className="aspect-square bg-gray-200 dark:bg-gray-900 rounded animate-pulse border border-hex-gold/10"
						/>
					))
				) : champions.length === 0 ? (
					<div className="col-span-full text-center py-8 text-xs text-muted-foreground">
						No champions found
					</div>
				) : (
					champions.map((champ) => {
						const isSelected = selectedId === champ.id;
						return (
							<button
								key={champ.id}
								type="button"
								onClick={() => onSelect(champ.id)}
								className={clsx(
									'flex flex-col items-center justify-center p-0.5 rounded border-2 bg-gray-200 dark:bg-[#08111a] overflow-hidden',
									isSelected
										? 'border-hex-gold ring-1 ring-hex-gold/40'
										: 'border-transparent hover:border-hex-gold/30'
								)}
								title={champ.name}
							>
								<img
									src={getImageUrl(champ.id)}
									alt={champ.name}
									className="w-full aspect-square object-cover hover:scale-105"
								/>
								<span
									className={clsx(
										'text-[9px] mt-1 truncate w-full text-center px-0.5',
										isSelected ? 'text-hex-gold' : 'text-muted-foreground'
									)}
								>
									{champ.name}
								</span>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

export default React.memo(ChampionList);
