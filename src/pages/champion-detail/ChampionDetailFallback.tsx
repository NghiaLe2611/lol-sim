import { Badge } from '@/components/ui/badge';
import { passiveImgUrl, skillImgUrl, splashChampionImg } from '@/constants/common';
import {
	type AbilitySlotToken,
	riotAbilityVideoUrl,
} from '@/pages/champion-detail/AbilityVideoDialog';
import AbilityPopover from '@/pages/champion-detail/AbilityPopover';
import ChampionSkinList from '@/pages/champion-detail/ChampionSkinList';
import DdragonStatGrid from '@/pages/champion-detail/DdragonStatGrid';
import { mapDdragonSkinsToChampionSkins } from '@/pages/champion-detail/ddragon-skins';
import type { ChampionDetailApi } from '@/types/champions';
import { getOptionalReleaseDate, stripLolMarkupToText } from '@/pages/champion-detail/utils';
import HoverPopover from '@/components/HoverPopover';
import { AudioLines } from 'lucide-react';
import { useMemo, useRef } from 'react';

function AttributeBarRow({ label, value, max }: { label: string; value: number; max?: number }) {
	const mx = max ?? 10;
	const pct = mx > 0 ? Math.min(100, (Math.max(0, value) / mx) * 100) : 0;
	return (
		<div>
			<div className="mb-1 flex justify-between text-xs lg:text-sm">
				<span className="uppercase tracking-wider text-muted-foreground">{label}</span>
				<span className="text-hex-gold">{value}</span>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-secondary">
				<div
					className="h-full bg-gradient-to-r from-yellow-200 to-hex-gold dark:from-yellow-50 dark:to-yellow-500"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

export default function ChampionDetailFallback({
	champion: c,
	patchVersion,
}: {
	champion: ChampionDetailApi;
	patchVersion: string;
}) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const release = getOptionalReleaseDate(c);
	const legacyChampionMediaId = c.key;
	const passiveVideoUrl = riotAbilityVideoUrl(legacyChampionMediaId, 'P');

	const handlePlayVoice = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		const audio = new Audio(
			`https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/${c.key}.ogg`
		);
		audio.volume = 0.5;
		audio.play().catch(console.error);
		audioRef.current = audio;
	};

	const skinList = useMemo(() => mapDdragonSkinsToChampionSkins(c.id, c.skins), [c.id, c.skins]);

	return (
		<div className="mx-auto max-w-container">
			<div className="relative h-96 overflow-hidden 3xl:h-[50vh]">
				<img
					alt={c.name}
					className="h-full w-full object-cover object-top"
					src={splashChampionImg(c.id)}
				/>
				<div className="via-background/60 to-background/20 absolute inset-0 bg-gradient-to-t from-background" />
				<div className="absolute inset-x-0 bottom-0 mx-auto px-6 pb-6">
					<div className="mb-4">
						<div className="mb-2 flex flex-wrap gap-2">
							{c.tags.map((t) => (
								<Badge
									key={t}
									className="border-hex-gold/40 bg-hex-gold/15 text-hex-gold light:border-hex-gold light:bg-hex-gold light:text-white"
									variant="outline"
								>
									{t}
								</Badge>
							))}
						</div>
						<h1 className="display gold-text mb-2 text-5xl font-medium">{c.name}</h1>
						<div className="flex items-center gap-4">
							<p className="capitalize italic text-muted-foreground">{c.title}</p>
							<span title="Play voice" onClick={handlePlayVoice}>
								<AudioLines className="text-muted-foreground hover:cursor-pointer hover:text-foreground" />
							</span>
						</div>
						{release ? (
							<p className="mt-2 text-sm text-muted-foreground">
								Released: {release}
							</p>
						) : null}
					</div>
					<p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground lg:text-sm 4xl:text-base">
						{c.lore}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2 4xl:gap-y-12">
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Attributes
					</h3>
					<div className="space-y-3">
						<AttributeBarRow label="Attack" max={10} value={c.info.attack} />
						<AttributeBarRow label="Defense" max={10} value={c.info.defense} />
						<AttributeBarRow label="Magic" max={10} value={c.info.magic} />
						<AttributeBarRow label="Difficulty" max={10} value={c.info.difficulty} />
					</div>
				</div>
				<div className="hex-border rounded-lg p-6">
					<h3 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Base Stats
					</h3>
					<DdragonStatGrid stats={c.stats} />
				</div>

				{/* Abilities */}
				<div className="space-y-6 lg:col-span-full">
					<h2 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Abilities
					</h2>
					<div className="space-y-4">
						<div className="flex gap-4">
							<HoverPopover
								align="end"
								content={({ open }) => (
									<AbilityPopover
										caption={`${c.passive.name} (Passive)`}
										isOpen={open}
										src={passiveVideoUrl}
									/>
								)}
								contentClassName="rounded-md border-0 bg-transparent p-0 shadow-xl"
							>
								<button
									type="button"
									className="shrink-0 rounded-md border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hex-gold/60"
									aria-label={`Video preview on hover — ${c.passive.name} (Passive)`}
								>
									<img
										alt=""
										className="pointer-events-none h-12 w-12 shrink-0 rounded-md border border-hex-gold/30 object-cover"
										src={passiveImgUrl(patchVersion, c.passive.image.full)}
									/>
								</button>
							</HoverPopover>
							<div className="min-w-0">
								<div className="font-semibold">
									{c.passive.name}
									<span className="ml-2 text-sm uppercase text-muted-foreground">
										Passive
									</span>
								</div>
								<p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
									{stripLolMarkupToText(c.passive.description)}
								</p>
							</div>
						</div>

						{(['Q', 'W', 'E', 'R'] as const).map((slot, idx) => {
							const s = c.spells[idx];
							if (!s) return null;
							const slotToken = slot as AbilitySlotToken;
							const spellVideoUrl = riotAbilityVideoUrl(
								legacyChampionMediaId,
								slotToken
							);

							return (
								<div key={s.id} className="flex gap-4">
									<HoverPopover
										content={({ open }) => (
											<AbilityPopover
												caption={`${s.name} (${slot})`}
												isOpen={open}
												src={spellVideoUrl}
											/>
										)}
										contentClassName="rounded-md border-0 bg-transparent p-0 shadow-xl"
									>
										<button
											type="button"
											className="focus-visible:ring-hex-blue/60 shrink-0 rounded-md border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
											aria-label={`Video preview on hover — ${s.name} (${slot})`}
										>
											<img
												alt=""
												className="border-hex-blue/40 pointer-events-none h-12 w-12 shrink-0 rounded-md border object-cover"
												src={skillImgUrl(patchVersion, s.image.full)}
											/>
										</button>
									</HoverPopover>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="flex flex-wrap items-center font-semibold">
												{s.name}
												<span className="ml-2 text-sm font-normal text-muted-foreground">
													({slot})
												</span>
											</div>
											<div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground 2xl:text-sm">
												<span>
													<span className="whitespace-nowrap font-medium uppercase text-cyan-600 dark:text-sky-400">
														Cost:
													</span>{' '}
													<span>{s.costBurn}</span>
												</span>
												<span>
													<span className="whitespace-nowrap font-medium uppercase text-cyan-600 dark:text-sky-400">
														Cooldown:
													</span>{' '}
													<span>{s.cooldownBurn}</span>
												</span>
												<span>
													<span className="whitespace-nowrap font-medium uppercase text-cyan-600 dark:text-sky-400">
														Range:
													</span>{' '}
													<span>{s.rangeBurn}</span>
												</span>
											</div>
										</div>
										<p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
											{stripLolMarkupToText(s.description)}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="lg:col-span-full">
					<h2 className="display mb-4 text-xl font-semibold text-hex-gold 3xl:text-2xl">
						Champion Skins
					</h2>
					<ChampionSkinList skins={skinList} />
				</div>
			</div>
		</div>
	);
}
