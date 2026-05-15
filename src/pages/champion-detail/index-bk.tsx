import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_MS, passiveImgUrl, splashChampionImg, skillImgUrl } from '@/constants/common';
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
		staleTime: STALE_MS,
		gcTime: STALE_MS,
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
			<div className="relative h-96 3xl:h-[50vh] overflow-hidden">
				<img
					alt={c.name}
					className="h-full w-full object-cover object-top"
					src={splashChampionImg(c.id)}
				/>
				<div className="absolute inset-0 from-background via-background/60 bg-gradient-to-t to-background/20" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="mb-4">
						<div className="mb-2 flex flex-wrap gap-2">
							{c.tags.map((t) => (
								<Badge
									key={t}
									className="border-hex-gold/40 bg-hex-gold/15 text-hex-gold light:bg-hex-gold light:border-hex-gold light:text-white"
									variant="outline"
								>
									{t}
								</Badge>
							))}
						</div>
						<h1 className="display gold-text text-5xl font-medium mb-2">{c.name}</h1>
						<p className="text-muted-foreground capitalize italic">{c.title}</p>
					</div>
					<p className="text-muted-foreground whitespace-pre-line leading-relaxed">
						{c.lore}
					</p>
				</div>
			</div>

			{/* <dl className="text-muted-foreground mb-6 grid gap-3 text-sm sm:grid-cols-2">
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
			</dl> */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-8">
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-lg 3xl:text-xl font-semibold text-hex-gold">
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
					<h3 className="display mb-4 text-lg 3xl:text-xl font-semibold text-hex-gold">
						Base Stats
					</h3>
					<div className="grid grid-cols-2 gap-2 gap-x-8 text-sm">
						<div className="flex justify-between">
							<div className="text-muted-foreground">Health</div>
							<div className="text-right">{c.stats.hp}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Attack Damage</div>
							<div className="text-right">{c.stats.attackdamage}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Attack Speed</div>
							<div className="text-right">{c.stats.attackspeed.toFixed(3)}</div>
						</div>

						<div className="flex justify-between">
							<div className="text-muted-foreground">Armor</div>
							<div className="text-right">{c.stats.armor}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Magic Resist</div>
							<div className="text-right">{c.stats.spellblock}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Move Speed</div>
							<div className="text-right">{c.stats.movespeed}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Range</div>
							<div className="text-right">{c.stats.attackrange}</div>
						</div>
						<div className="flex justify-between">
							<div className="text-muted-foreground">Range type</div>
							<div className="text-right">{rangeLabel}</div>
						</div>
					</div>
				</div>

				<div className="space-y-6 lg:col-span-full">
					<div className="hex-border rounded-lg p-6">
						<h2 className="display mb-4 text-lg 3xl:text-xl font-semibold text-hex-gold">
							Abilities
						</h2>
						<div className="space-y-4">
							<div className="flex gap-4">
								<img
									alt=""
									className="h-12 w-12 shrink-0 rounded-md border border-hex-gold/30 object-cover"
									height={48}
									loading="lazy"
									src={passiveImgUrl(patchVersion, c.passive.image.full)}
									width={48}
								/>
								<div className="min-w-0">
									<div className="font-semibold">
										{c.passive.name}
										<span className="text-muted-foreground ml-2 text-sm uppercase">
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
											src={skillImgUrl(patchVersion, s.image.full)}
											width={48}
										/>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between">
												<div className="flex items-center font-semibold">
													{s.name}
													<span className="text-muted-foreground ml-2 text-sm font-normal">
														({slot})
													</span>
												</div>
												<div className="text-muted-foreground flex flex-wrap gap-4 text-xs 3xl:text-sm">
													<span>
														<span className="font-medium">Cost: </span>
														<span className="text-hex-blue-glow">
															{s.costBurn}
														</span>
													</span>
													<span>
														<span className="font-medium">
															Cooldown:{' '}
														</span>
														<span className="text-hex-gold">
															{s.cooldownBurn}
														</span>
													</span>
													<span>
														<span className="font-medium">Range: </span>
														<span className="text-foreground">
															{s.rangeBurn}
														</span>
													</span>
												</div>
											</div>
											<p className="text-muted-foreground mt-1 whitespace-pre-line text-sm">
												{stripLolMarkupToText(s.description)}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* <Link
					className="text-primary-foreground block rounded-md bg-gradient-to-r from-hex-gold to-hex-gold-dark px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider"
					to="/build"
				>
					Build
				</Link> */}
			</div>
		</div>
	);
}
