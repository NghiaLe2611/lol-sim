import AnimatedNumber from '@/components/AnimatedNumber';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { getChampions, getItems, getRunes, getSummonerSpells } from '@/services/api';
import { useQueries } from '@tanstack/react-query';
import { Book, Shield, Sparkles, Sword } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

type KeyedDragonPayload = {
	data: Record<string, unknown>;
};

const cards = [
	{
		to: '/champions',
		icon: Sword,
		titleKey: 'home.cards.champions.title' as const,
		descKey: 'home.cards.champions.desc' as const,
	},
	{
		to: '/items',
		icon: Shield,
		titleKey: 'home.cards.items.title' as const,
		descKey: 'home.cards.items.desc' as const,
	},
	{
		to: '/runes',
		icon: Book,
		titleKey: 'home.cards.runes.title' as const,
		descKey: 'home.cards.runes.desc' as const,
	},
	{
		to: '/spells',
		icon: Sparkles,
		titleKey: 'home.cards.spells.title' as const,
		descKey: 'home.cards.spells.desc' as const,
	},
	// {
	// 	to: '/build',
	// 	icon: Calculator,
	// 	titleKey: 'home.cards.build.title' as const,
	// 	descKey: 'home.cards.build.desc' as const,
	// },
] as const;

const Overview = () => {
	const { t } = useTranslation();
	const { patchVersion: version } = useAppContext();

	const [championsQ, itemsQ, runesQ, spellsQ] = useQueries({
		queries: [
			{
				queryKey: ['champions', version],
				queryFn: () => getChampions(version!),
				enabled: Boolean(version),
				staleTime: STALE_MS,
				gcTime: STALE_MS,
				select: (payload: KeyedDragonPayload) => Object.keys(payload.data).length,
			},
			{
				queryKey: ['items', version],
				queryFn: () => getItems(version!),
				enabled: Boolean(version),
				staleTime: STALE_MS,
				gcTime: STALE_MS,
				select: (payload: KeyedDragonPayload) => Object.keys(payload.data).length,
			},
			{
				queryKey: ['runes', version],
				queryFn: () => getRunes(version!),
				enabled: Boolean(version),
				staleTime: STALE_MS,
				gcTime: STALE_MS,
				select: (payload: unknown[]) => (Array.isArray(payload) ? payload.length : 0),
			},
			{
				queryKey: ['spells', version],
				queryFn: () => getSummonerSpells(version!),
				enabled: Boolean(version),
				staleTime: STALE_MS,
				gcTime: STALE_MS,
				select: (payload: KeyedDragonPayload) => Object.keys(payload.data).length,
			},
		],
	});

	const queryByPath = {
		'/champions': championsQ,
		'/items': itemsQ,
		'/runes': runesQ,
		'/spells': spellsQ,
	} as const;

	return (
		<section className="mx-auto grid max-w-container grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
			{cards.map((c) => {
				const q = queryByPath[c.to];
				const count = q.data;
				const showSkeleton = !q.isError && count === undefined;

				return (
					<Link
						key={c.to}
						className="border-2 hex-border group rounded-lg p-6 hover:border-hex-gold hover:scale-105 transition-transform"
						to={c.to}
					>
						<div className="flex items-center justify-center gap-4 pr-4 mb-6">
							<c.icon className="h-8 w-8 shrink-0 text-hex-gold" />
							<h3 className="display text-xl font-semibold leading-snug">
								{t(c.titleKey)}
							</h3>
						</div>

						<div
							className="flex h-8 min-w-[3.75rem] shrink-0 items-center justify-center"
							aria-busy={showSkeleton}
						>
							{q.isError ? (
								<span className="text-muted-foreground text-4xl font-bold leading-none">
									–
								</span>
							) : showSkeleton ? (
								<Skeleton className="h-8 w-14 shrink-0 rounded-md" aria-hidden />
							) : (
								<span className="gold-text text-4xl font-bold tabular-nums leading-none">
									{/* {count} */}
									<AnimatedNumber to={count ?? 0} />
								</span>
							)}
						</div>
						{/* <p className="text-muted-foreground mt-2 text-sm">{t(c.descKey)}</p> */}
					</Link>
				);
			})}
		</section>
	);
};

export default Overview;
