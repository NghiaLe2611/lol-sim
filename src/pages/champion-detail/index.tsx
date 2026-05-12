import { Badge } from '@/components/ui/badge';
import { champions, type Champion } from '@/data/lol';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function StatBar({ label, value }: { label: string; value: number }) {
	return (
		<div>
			<div className="mb-1 flex justify-between text-xs">
				<span className="text-muted-foreground uppercase tracking-wider">{label}</span>
				<span className="text-hex-gold">{value}/10</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-secondary">
				<div
					className="h-full bg-gradient-to-r from-hex-blue to-hex-gold"
					style={{ width: `${value * 10}%` }}
				/>
			</div>
		</div>
	);
}

export default function ChampionDetailPage() {
	const { championId } = useParams<{ championId: string }>();
	const c = champions.find((x) => x.id === championId);

	useEffect(() => {
		document.title = c ? `${c.name}, ${c.title} — Runeterra Sim` : 'Champion — Runeterra Sim';
	}, [c]);

	if (!c) {
		return (
			<div className="p-12 text-center">
				<p className="text-muted-foreground">Champion not found.</p>
				<Link className="text-hex-gold underline" to="/champions">
					Back to champions
				</Link>
			</div>
		);
	}

	return <ChampionDetailContent champion={c} />;
}

function ChampionDetailContent({ champion: c }: { champion: Champion }) {
	return (
		<div>
			<div className="relative h-80 overflow-hidden">
				<img
					alt={c.name}
					className="h-full w-full object-cover object-top"
					src={c.splashUrl}
				/>
				<div className="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-background/20" />
				<div className="absolute inset-x-0 bottom-0 mx-auto max-w-container px-6 pb-6">
					<Badge className="mb-2 border-hex-gold/40 bg-hex-gold/20 text-hex-gold">
						{c.partype}
					</Badge>
					<h1 className="display gold-text text-5xl">{c.name}</h1>
					<p className="text-muted-foreground italic">{c.title}</p>
				</div>
			</div>

			<div className="mx-auto grid max-w-container grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<div className="hex-border rounded-lg p-6">
						<h2 className="display mb-3 text-xl text-hex-gold">Lore</h2>
						<p className="text-muted-foreground leading-relaxed">{c.blurb}</p>
						<div className="mt-4 flex gap-2">
							{c.tags.map((t) => (
								<Badge
									key={t}
									className="border-hex-blue/40 text-hex-blue-glow"
									variant="outline"
								>
									{t}
								</Badge>
							))}
						</div>
					</div>

					<div className="hex-border rounded-lg p-6">
						<h2 className="display mb-4 text-xl text-hex-gold">Abilities</h2>
						<div className="space-y-4">
							<div className="flex gap-4">
								<div className="text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-hex-gold to-hex-gold-dark font-bold">
									P
								</div>
								<div>
									<div className="font-semibold">
										{c.passive.name}{' '}
										<span className="text-muted-foreground ml-2 text-xs">
											Passive
										</span>
									</div>
									<p className="text-muted-foreground mt-1 text-sm">
										{c.passive.description}
									</p>
								</div>
							</div>
							{c.spells.map((s) => (
								<div key={s.key} className="flex gap-4">
									<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-hex-blue/40 bg-secondary text-center font-bold text-hex-blue-glow">
										{s.key}
									</div>
									<div className="flex-1">
										<div className="font-semibold">{s.name}</div>
										<p className="text-muted-foreground mt-1 text-sm">
											{s.description}
										</p>
										<div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
											<span>
												CD:{' '}
												<span className="text-hex-gold">{s.cooldown}</span>
											</span>
											<span>
												Cost:{' '}
												<span className="text-hex-blue-glow">{s.cost}</span>
											</span>
											<span>
												Range:{' '}
												<span className="text-foreground">{s.range}</span>
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="hex-border rounded-lg p-6">
						<h3 className="display mb-4 text-lg text-hex-gold">Class Profile</h3>
						<div className="space-y-3">
							<StatBar label="Attack" value={c.info.attack} />
							<StatBar label="Defense" value={c.info.defense} />
							<StatBar label="Magic" value={c.info.magic} />
							<StatBar label="Difficulty" value={c.info.difficulty} />
						</div>
					</div>

					<div className="hex-border rounded-lg p-6">
						<h3 className="display mb-4 text-lg text-hex-gold">Base Stats (Lv.1)</h3>
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
						</dl>
					</div>

					<Link
						className="text-primary-foreground block rounded-md bg-gradient-to-r from-hex-gold to-hex-gold-dark px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider"
						to="/build"
					>
						Build with {c.name}
					</Link>
				</div>
			</div>
		</div>
	);
}
