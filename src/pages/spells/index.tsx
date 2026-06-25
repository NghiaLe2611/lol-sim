import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import SpellPopover from '@/pages/spells/components/SpellPopover';
import {
	parseClassicSummonerSpells,
	summonerSpellSpriteUrl,
	type DdragonSummonerPayload,
	type SummonerSpellView,
} from '@/pages/spells/utils';
import { getSummonerSpells } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

function SummonerSpellIcon({
	spell,
	patchVersion,
}: {
	spell: SummonerSpellView;
	patchVersion: string;
}) {
	const { image } = spell;
	const spriteUrl = summonerSpellSpriteUrl(patchVersion, image.sprite);

	return (
		<div
			className="rounded-sm shrink-0 border border-[#8a7344]/80 bg-black/25 transition-all duration-200 hover:scale-105 hover:cursor-pointer"
			style={{
				width: image.w,
				height: image.h,
				backgroundImage: `url(${spriteUrl})`,
				backgroundPosition: `-${image.x}px -${image.y}px`,
				backgroundRepeat: 'no-repeat',
			}}
			role="img"
			aria-label={spell.name}
		/>
	);
}

export default function SummonersPage() {
	const { patchVersion, isPatchReady } = useAppContext();

	const spellsQuery = useQuery({
		queryKey: ['spells', patchVersion],
		queryFn: () => getSummonerSpells(patchVersion!),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: DdragonSummonerPayload) => parseClassicSummonerSpells(raw),
	});

	const spells = spellsQuery.data ?? [];
	const isLoading = spellsQuery.isLoading || spellsQuery.isFetching;

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">Spells</h1>
				<p className="mt-2 text-xs text-muted-foreground lg:text-sm">
					Summoner spells are special abilities that all players can have access to based
					on the map, in addition to their champion abilities. Players choose their two
					preferred summoner spells during champion select.
				</p>
			</header>

			{isLoading ? (
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
					<Spinner type="default" className="size-10 text-hex-gold" />
					<Skeleton className="h-4 w-48" />
				</div>
			) : spellsQuery.isError ? (
				<div className="flex items-center justify-center py-12">
					<p className="text-center text-muted-foreground">Failed to load spells.</p>
				</div>
			) : (
				<div className="flex flex-wrap gap-4">
					{spells.map((spell) => (
						<SpellPopover key={spell.id} spell={spell}>
							{patchVersion ? (
								<SummonerSpellIcon spell={spell} patchVersion={patchVersion} />
							) : null}
							<p className="max-w-[4.5rem] truncate text-center text-xs font-medium text-foreground lg:text-sm">
								{spell.name}
							</p>
						</SpellPopover>
					))}
				</div>
			)}
		</div>
	);
}
