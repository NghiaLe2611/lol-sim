import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	DDRAGON_LIST_STALE_MS,
	ddragonPassiveImgUrl,
	ddragonSplashChampionUrl,
	ddragonSpellImgUrl,
} from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { getChampionDetail } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const SPELL_KEYS = ['Q', 'W', 'E', 'R'] as const;

type ChampionSpellApi = {
	id: string;
	name: string;
	description: string;
	cooldownBurn: string;
	costBurn: string;
	rangeBurn: string;
	image: { full: string };
};

/** Single champion blob from `/cdn/{v}/data/en_US/champion/{id}.json` */
export type ChampionDetailApi = {
	id: string;
	key: string;
	name: string;
	title: string;
	lore: string;
	blurb: string;
	tags: string[];
	partype: string;
	info: { attack: number; defense: number; magic: number; difficulty: number };
	stats: Record<string, number>;
	spells: ChampionSpellApi[];
	passive: { name: string; description: string; image: { full: string } };
	/** Không có trong Data Dragon chuẩn */
	releaseDate?: string;
	releasedate?: string;
	released?: string;
};

type ChampionDetailPayload = {
	data: Record<string, ChampionDetailApi>;
};

/** attackrange strictly > 200 → Ranged (theo design). */
export function detectAttackRangeType(attackRange: number): 'Ranged' | 'Melee' {
	return attackRange > 200 ? 'Ranged' : 'Melee';
}

function stripLolMarkupToText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.trim();
}

/** Data Dragon không có ngày phát hành; chỉ hiện khi có field mở rộng trong JSON. */
function getOptionalReleaseDate(champion: ChampionDetailApi): string | null {
	const v = champion.releaseDate ?? champion.releasedate ?? champion.released ?? null;
	return typeof v === 'string' && v.length > 0 ? v : null;
}

function StatBar({ label, value }: { label: string; value: number }) {
	return (
		<div>
			<div className="mb-1 flex justify-between text-xs">
				<span className="text-muted-foreground uppercase tracking-wider">{label}</span>
				<span className="text-hex-gold">{value}</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-secondary">
				<div
					className="from-yellow-200 to-hex-gold dark:from-yellow-50 dark:to-yellow-500 h-full bg-gradient-to-r"
					style={{ width: `${Math.min(10, value) * 10}%` }}
				/>
			</div>
		</div>
	);
}

export default function ChampionDetailPage() {
	const { championId = '' } = useParams<{ championId: string }>();
	const { patchVersion: version } = useAppContext();

	const {
		data: champion,
		isPending,
		isError,
	} = useQuery({
		queryKey: ['championDetail', version, championId],
		queryFn: () => getChampionDetail(version!, championId),
		enabled: Boolean(version && championId),
		staleTime: DDRAGON_LIST_STALE_MS,
		gcTime: DDRAGON_LIST_STALE_MS,
		select: (raw: ChampionDetailPayload): ChampionDetailApi | null => {
			if (!raw?.data || !championId) return null;
			return raw.data[championId] ?? Object.values(raw.data)[0] ?? null;
		},
	});

	useEffect(() => {
		document.title = champion ? `${champion.name}, ${champion.title}` : 'Champion';
	}, [champion]);

	const showNotFound =
		!isPending && Boolean(version && championId) && (isError || champion == null);

	if (showNotFound) {
		return (
			<div className="p-12 text-center">
				<p className="text-muted-foreground">Champion not found.</p>
				<Link className="text-hex-gold underline" to="/champions">
					Back to champions
				</Link>
			</div>
		);
	}

	if (!version || isPending || champion == null) {
		return (
			<div className="mx-auto max-w-container px-6 py-8">
				<Skeleton className="mb-6 h-80 w-full rounded-lg" />
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="space-y-4 lg:col-span-2">
						<Skeleton className="h-40 rounded-lg" />
						<Skeleton className="h-64 rounded-lg" />
					</div>
					<div className="space-y-4">
						<Skeleton className="h-56 rounded-lg" />
						<Skeleton className="h-72 rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	return <ChampionDetailContent champion={champion} patchVersion={version} />;
}

function ChampionDetailContent({
	champion: c,
	patchVersion,
}: {
	champion: ChampionDetailApi;
	patchVersion: string;
}) {
	const rangeLabel = detectAttackRangeType(c.stats.attackrange ?? 0);
	const release = getOptionalReleaseDate(c);

	return (
		<div className="mx-auto max-w-container">
			<div className="relative h-80 overflow-hidden">
				<img
					alt={c.name}
					className="h-full w-full object-cover object-top"
					src={ddragonSplashChampionUrl(c.id)}
				/>
				<div className="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-background/20" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="mb-2 flex flex-wrap gap-2">
						{c.tags.map((t) => (
							<Badge
								key={t}
								className="border-hex-gold/40 bg-hex-gold/15 text-hex-gold"
								variant="outline"
							>
								{t}
							</Badge>
						))}
					</div>
					<h1 className="display gold-text text-5xl">{c.name}</h1>
					<p className="text-muted-foreground capitalize italic">{c.title}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 py-8 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<div className="hex-border rounded-lg p-6">
						<h3 className="display mb-4 text-lg font-semibold text-hex-gold 3xl:text-xl">
							Introduction
						</h3>

						<dl className="text-muted-foreground mb-6 grid gap-3 text-sm sm:grid-cols-2">
							<div className="flex flex-col gap-0.5">
								<dt className="font-medium text-foreground/80">Resource</dt>
								<dd>{c.partype}</dd>
							</div>
							<div className="flex flex-col gap-0.5">
								<dt className="font-medium text-foreground/80">Range type</dt>
								<dd>{rangeLabel}</dd>
							</div>
							{release != null ? (
								<div className="flex flex-col gap-0.5 sm:col-span-2">
									<dt className="font-medium text-foreground/80">Release date</dt>
									<dd>{release}</dd>
								</div>
							) : null}
						</dl>

						<p className="text-muted-foreground whitespace-pre-line leading-relaxed">
							{stripLolMarkupToText(c.lore)}
						</p>
					</div>

					<div className="hex-border rounded-lg p-6">
						<h2 className="display mb-4 text-lg font-semibold text-hex-gold 3xl:text-xl">
							Abilities
						</h2>
						<div className="space-y-4">
							<div className="flex gap-4">
								<img
									alt=""
									className="h-12 w-12 shrink-0 rounded-md border border-hex-gold/30 object-cover"
									height={48}
									loading="lazy"
									src={ddragonPassiveImgUrl(patchVersion, c.passive.image.full)}
									width={48}
								/>
								<div className="min-w-0">
									<div className="font-semibold">
										{c.passive.name}{' '}
										<span className="text-muted-foreground ml-2 text-xs">
											Passive
										</span>
									</div>
									<p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
										{stripLolMarkupToText(c.passive.description)}
									</p>
								</div>
							</div>

							{c.spells.map((s, idx) => {
								const slot = SPELL_KEYS[idx] ?? '?';
								return (
									<div key={s.id} className="flex gap-4">
										<img
											alt=""
											className="h-12 w-12 shrink-0 rounded-md border border-hex-blue/40 object-cover"
											height={48}
											loading="lazy"
											src={ddragonSpellImgUrl(patchVersion, s.image.full)}
											width={48}
										/>
										<div className="min-w-0 flex-1">
											<div className="font-semibold">
												{s.name}{' '}
												<span className="text-muted-foreground ml-2 text-xs font-normal">
													({slot})
												</span>
											</div>
											<p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
												{stripLolMarkupToText(s.description)}
											</p>
											<div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
												<span>
													CD:{' '}
													<span className="text-hex-gold">
														{s.cooldownBurn}
													</span>
												</span>
												<span>
													Cost:{' '}
													<span className="text-hex-blue-glow">
														{s.costBurn}
													</span>
												</span>
												<span>
													Range:{' '}
													<span className="text-foreground">
														{s.rangeBurn}
													</span>
												</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="hex-border rounded-lg p-6">
						<h3 className="display mb-4 text-lg font-semibold text-hex-gold 3xl:text-xl">
							Class Profile
						</h3>
						<div className="space-y-3">
							<StatBar label="Attack" value={c.info.attack} />
							<StatBar label="Defense" value={c.info.defense} />
							<StatBar label="Magic" value={c.info.magic} />
							<StatBar label="Difficulty" value={c.info.difficulty} />
						</div>
					</div>

					<div className="hex-border rounded-lg p-6">
						<h3 className="display mb-4 text-lg font-semibold text-hex-gold 3xl:text-xl">
							Base Stats (Lv.1)
						</h3>
						<dl className="grid grid-cols-2 gap-y-2 text-sm">
							<dt className="text-muted-foreground">Health</dt>
							<dd className="text-right">{c.stats.hp}</dd>
							<dt className="text-muted-foreground">{c.partype}</dt>
							<dd className="text-right">{c.stats.mp}</dd>
							<dt className="text-muted-foreground">Attack Damage</dt>
							<dd className="text-right">{c.stats.attackdamage}</dd>
							<dt className="text-muted-foreground">Attack Speed</dt>
							<dd className="text-right">{c.stats.attackspeed.toFixed(3)}</dd>
							<dt className="text-muted-foreground">Armor</dt>
							<dd className="text-right">{c.stats.armor}</dd>
							<dt className="text-muted-foreground">Magic Resist</dt>
							<dd className="text-right">{c.stats.spellblock}</dd>
							<dt className="text-muted-foreground">Move Speed</dt>
							<dd className="text-right">{c.stats.movespeed}</dd>
							<dt className="text-muted-foreground">Range</dt>
							<dd className="text-right">{c.stats.attackrange}</dd>
							<dt className="text-muted-foreground">Range type</dt>
							<dd className="text-right">{rangeLabel}</dd>
						</dl>
					</div>

					<Link
						className="text-primary-foreground block rounded-md bg-gradient-to-r from-hex-gold to-hex-gold-dark px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider"
						to="/build"
					>
						Build
					</Link>
				</div>
			</div>
		</div>
	);
}
