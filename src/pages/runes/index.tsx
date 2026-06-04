import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import RuneDialog from '@/pages/runes/components/RuneDialog';
import { parseRunePaths, runePathCardUrl, type DdragonRunePath } from '@/pages/runes/utils';
import { getRunes } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import BuildRune from './BuildRune';

export default function RunesPage() {
	const { patchVersion, isPatchReady } = useAppContext();
	const [activePathKey, setActivePathKey] = useState<string | null>(null);
	const [hoverId, setHoverId] = useState<string | null>(null);

	const runesQuery = useQuery({
		queryKey: ['runes', patchVersion],
		queryFn: () => getRunes(patchVersion!),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: DdragonRunePath[]) => parseRunePaths(raw),
	});

	const paths = runesQuery.data ?? [];
	const activePath = paths.find((p) => p.key === activePathKey) ?? null;

	const isLoading = runesQuery.isLoading || runesQuery.isFetching;

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">Runes</h1>
				<p className="text-muted-foreground text-xs lg:text-sm mt-2">
					Runes are enhancements that add new abilities or buffs to the champion. The
					player can choose their loadout of runes before the match begins, during
					champion select, or their Collection tab.
				</p>
			</header>

			{isLoading ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
					<Spinner type="default" className="size-10 text-hex-gold" />
					<Skeleton className="h-4 w-48" />
				</div>
			) : runesQuery.isError ? (
				<div className="flex items-center justify-center py-12">
					<p className="text-muted-foreground text-center">Failed to load runes.</p>
				</div>
			) : (
				<div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
					{/* Sort by id */}
					{paths
						.sort((a, b) => a.id - b.id)
						.map((path) => {
							const isDimmed = hoverId !== null && hoverId !== path.key;

							return (
								<button
									key={path.key}
									type="button"
									style={{ opacity: isDimmed ? 0.5 : 1 }}
									onClick={() => setActivePathKey(path.key)}
									onMouseEnter={() => setHoverId(path.key)}
									onMouseLeave={() => setHoverId(null)}
									className="opacity-90 flex min-w-0 flex-col transition-opacity border-2 border-[#ab8f57] dark:border-[#46372a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60 overflow-hidden"
								>
									<img
										alt={path.name}
										// group-hover:scale-105 transition-all
										className="aspect-[3/4] w-full object-cover object-top border-b-2 border-[#ab8f57] dark:border-[#46372a]"
										loading="lazy"
										src={runePathCardUrl(path.key)}
									/>
									<p className="py-2.5 text-center text-xs lg:text-sm font-semibold tracking-wider uppercase">
										{path.name}
									</p>
								</button>
							);
						})}
				</div>
			)}

			<RuneDialog activePath={activePath} onClose={() => setActivePathKey(null)} />

			<div className="mt-16 4xl:mt-24">
				<h2 className="display gold-text text-4xl uppercase text-center mb-8 4xl:mt-12">
					Create Your Playstyle
				</h2>
				<BuildRune />
			</div>
		</div>
	);
}
