import { Skeleton } from '@/components/ui/skeleton';
import { STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import RuneDialog from '@/pages/runes/components/RuneDialog';
import {
	parseRunePaths,
	runePathCardUrl,
	runePerkImgUrl,
	stripRuneMarkupToText,
	type DdragonRunePath,
} from '@/pages/runes/utils';
import { getRunes, getRuneShards } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import BuildRune from './BuildRune';

const PATH_COUNT = 5;

function PathGridPlaceholder() {
	return (
		<>
			{Array.from({ length: PATH_COUNT }, (_, i) => (
				<div
					key={i}
					className="flex min-w-0 flex-col overflow-hidden border-2 border-[#ab8f57] dark:border-[#46372a]"
					aria-hidden
				>
					{/* <Skeleton className="aspect-[3/4] w-full rounded-none border-b-2 border-[#ab8f57] dark:border-[#46372a] bg-gray-200 dark:bg-gray-700" /> */}
					<div className="relative aspect-[3/4] w-full shrink-0 border-b-2 border-[#ab8f57] dark:border-[#46372a]">
						<Skeleton className="absolute inset-0 rounded-none bg-gray-200 dark:bg-gray-700" />
					</div>

					<div className="flex justify-center py-2.5">
						<Skeleton className="h-4 w-20" />
					</div>
				</div>
			))}
		</>
	);
}

function PathMobileListPlaceholder() {
	return (
		<>
			{Array.from({ length: PATH_COUNT }, (_, i) => (
				<Skeleton
					key={i}
					className={cn(
						'h-[72px] w-full rounded-none',
						i < PATH_COUNT - 1 && 'border-b-2 border-[#ab8f57] dark:border-[#46372a]'
					)}
					aria-hidden
				/>
			))}
		</>
	);
}

function RunePathMobileRow({
	path,
	expanded,
	onToggle,
}: {
	path: DdragonRunePath;
	expanded: boolean;
	onToggle: () => void;
}) {
	const allRunes = path.slots.flatMap((slot) => slot.runes);

	return (
		<div className="border-b-2 border-[#ab8f57] last:border-b-0 dark:border-[#46372a]">
			<button
				type="button"
				className="group relative flex h-[72px] w-full items-center overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
				onClick={onToggle}
			>
				<div
					className="absolute inset-0 bg-cover bg-center opacity-50"
					style={{ backgroundImage: `url(/images/runes/${path.key.toLowerCase()}.png)` }}
				/>
				<div className="absolute inset-0 bg-black/55 group-hover:bg-black/70" />
				<span className="relative z-10 pl-4 text-sm font-bold uppercase tracking-wider text-white">
					{path.name}
				</span>
				<img
					alt={path.key}
					// h-[145%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
					className="pointer-events-none absolute z-[2] opacity-50 max-w-none object-contain top-1/2 -translate-y-1/2 left-0"
					loading="lazy"
					src={runePathCardUrl(path.key)}
				/>
				<span className="relative z-10 ml-auto mr-3 flex size-8 shrink-0 items-center justify-center">
					<ChevronDown
						className={cn(
							'size-6 text-[#ab8f57] transition-transform duration-200',
							expanded && 'rotate-180'
						)}
					/>
				</span>
			</button>

			{expanded && (
				<div className="border-t border-[#ab8f57]/40 bg-black/10 dark:bg-black/50">
					{allRunes.map((rune) => (
						<div
							key={rune.id}
							className="flex items-start gap-3 border-b border-[#46372a]/40 px-4 py-3 last:border-b-0"
						>
							<img
								alt=""
								className="size-10 shrink-0 rounded-full border border-[#ab8f57]/50 object-cover"
								loading="lazy"
								src={runePerkImgUrl(rune.icon)}
							/>
							<p className="text-sm leading-snug text-muted-foreground">
								<span className="font-semibold text-foreground">{rune.name}</span>
								{' - '}
								{stripRuneMarkupToText(rune.shortDesc)}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function RunesPage() {
	const { patchVersion, isPatchReady } = useAppContext();
	const [activePathKey, setActivePathKey] = useState<string | null>(null);
	const [hoverId, setHoverId] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

	const runesQuery = useQuery({
		queryKey: ['runes', patchVersion],
		queryFn: () => getRunes(patchVersion!),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: DdragonRunePath[]) => parseRunePaths(raw),
	});

	const runeShardsQuery = useQuery({
		queryKey: ['rune-shards'],
		queryFn: () => getRuneShards(),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const runeShards = runeShardsQuery.data ?? [];

	const paths = runesQuery.data ?? [];
	const activePath = paths.find((p) => p.key === activePathKey) ?? null;
	const sortedPaths = [...paths].sort((a, b) => a.id - b.id);
	const showPathPlaceholders = paths.length === 0 && !runesQuery.isError;

	const toggleExpanded = (key: string) => {
		setExpandedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">Runes</h1>
				<p className="mt-2 text-xs text-muted-foreground lg:text-sm">
					Runes are enhancements that add new abilities or buffs to the champion. The
					player can choose their loadout of runes before the match begins, during
					champion select, or their Collection tab.
				</p>
			</header>

			{runesQuery.isError ? (
				<div className="flex items-center justify-center py-12">
					<p className="text-center text-muted-foreground">Failed to load runes.</p>
				</div>
			) : (
				<>
					<div
						className="hidden gap-2 lg:grid lg:grid-cols-5"
						aria-busy={showPathPlaceholders}
					>
						{showPathPlaceholders ? (
							<PathGridPlaceholder />
						) : (
							sortedPaths.map((path) => {
								const isDimmed = hoverId !== null && hoverId !== path.key;

								return (
									<button
										key={path.key}
										type="button"
										style={{ opacity: isDimmed ? 0.5 : 1 }}
										onClick={() => setActivePathKey(path.key)}
										onMouseEnter={() => setHoverId(path.key)}
										onMouseLeave={() => setHoverId(null)}
										className="flex min-w-0 flex-col overflow-hidden border-2 border-[#ab8f57] opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60 dark:border-[#46372a]"
									>
										<div className="relative aspect-[3/4] w-full shrink-0 border-b-2 border-[#ab8f57] dark:border-[#46372a]">
											<img
												alt={path.name}
												width={300}
												height={400}
												className="absolute inset-0 h-full w-full object-cover object-top"
												loading="lazy"
												src={runePathCardUrl(path.key)}
											/>
										</div>
										<p className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider lg:text-sm">
											{path.name}
										</p>
									</button>
								);
							})
						)}
					</div>

					<div
						className="overflow-hidden border-2 border-[#ab8f57] lg:hidden dark:border-[#46372a]"
						aria-busy={showPathPlaceholders}
					>
						{showPathPlaceholders ? (
							<PathMobileListPlaceholder />
						) : (
							sortedPaths.map((path) => (
								<RunePathMobileRow
									key={path.key}
									expanded={expandedKeys.has(path.key)}
									onToggle={() => toggleExpanded(path.key)}
									path={path}
								/>
							))
						)}
					</div>
				</>
			)}

			<RuneDialog activePath={activePath} onClose={() => setActivePathKey(null)} />

			<div className="mt-16 4xl:mt-24">
				<h2 className="display gold-text mb-8 text-center text-4xl uppercase 4xl:mt-12">
					Create Your Playstyle
				</h2>
				<BuildRune runeShards={runeShards} />
			</div>
		</div>
	);
}
