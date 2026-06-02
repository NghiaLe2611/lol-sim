import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import './level-slider.scss';
import { calculateStats, champions, items, type Champion, type Item } from '@/data/lol';
import { formatNumber } from '@/utils/common';
import { Coins, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function BuildPage() {
	const [championSearch, setChampionSearch] = useState('');
	const [championId, setChampionId] = useState<string>('Aatrox');
	const [level, setLevel] = useState(1);
	const [skillRanks, setSkillRanks] = useState<Record<string, number>>({
		Q: 0,
		W: 0,
		E: 0,
		R: 0,
	});
	const [selected, setSelected] = useState<Item[]>([]);
	const [itemSearch, setItemSearch] = useState('');
	const [itemTag, setItemTag] = useState('All');

	const champion: Champion = useMemo(() => {
		const found = champions.find((c) => c.name.toLowerCase() === championSearch.toLowerCase());
		if (found) return found;
		return champions.find((c) => c.id === championId) ?? champions[0];
	}, [championSearch, championId]);

	const itemTags = useMemo(
		() => ['All', ...Array.from(new Set(items.flatMap((i) => i.tags)))],
		[]
	);
	const filteredItems = useMemo(() => {
		const q = itemSearch.toLowerCase();
		return items.filter((i) => {
			const ms =
				!q ||
				i.name.toLowerCase().includes(q) ||
				i.tags.join(' ').toLowerCase().includes(q);
			const mt = itemTag === 'All' || i.tags.includes(itemTag);
			return ms && mt;
		});
	}, [itemSearch, itemTag]);

	const stats = useMemo(
		() => calculateStats(champion, level, selected),
		[champion, level, selected]
	);
	const totalCost = selected.reduce((s, i) => s + i.cost, 0);

	const addItem = (item: Item) => {
		if (selected.length >= 6) return;
		setSelected([...selected, item]);
	};
	const removeItem = (idx: number) => setSelected(selected.filter((_, i) => i !== idx));

	const setRank = (key: string, max: number, value: number) => {
		setSkillRanks({ ...skillRanks, [key]: Math.min(value, Math.min(max, level)) });
	};

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display font-semibold gold-text text-4xl">Build Calculator</h1>
				<p className="text-muted-foreground text-xs lg:text-sm mt-2">
					Pick a champion, set your level, allocate skill points and equip items.
				</p>
			</header>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* lg:sticky lg:top-24 lg:self-start  */}
				<div className="space-y-6">
					<section className="hex-border rounded-lg p-4 3xl:p-6">
						<h2 className="display font-medium mb-4 text-xl text-hex-gold">Champion</h2>
						<div className="flex flex-col gap-4">
							<div className="w-full">
								<SearchAutocomplete
									getLabel={(c) => c.name}
									items={champions}
									onChange={(v) => {
										setChampionSearch(v);
										const found = champions.find(
											(c) => c.name.toLowerCase() === v.toLowerCase()
										);
										if (found) setChampionId(found.id);
									}}
									placeholder="Search champion..."
									value={championSearch}
								/>
								{/* <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
                                    {champions.map((c) => (
                                        <button
                                            key={c.id}
                                            className={
                                                'flex items-center gap-2 rounded border px-2 py-1 text-xs ' +
                                                (champion.id === c.id
                                                    ? 'border-hex-gold bg-hex-gold/10 text-hex-gold'
                                                    : 'border-border text-muted-foreground hover:text-foreground')
                                            }
                                            onClick={() => {
                                                setChampionId(c.id);
                                                setChampionSearch('');
                                                setSkillRanks({ Q: 0, W: 0, E: 0, R: 0 });
                                            }}
                                            type="button"
                                        >
                                            <img
                                                alt={c.name}
                                                className="h-6 w-6 rounded"
                                                src={c.imageUrl}
                                            />
                                            {c.name}
                                        </button>
                                    ))}
                                </div> */}
							</div>

							<div className="flex flex-1 gap-4">
								<img
									alt={champion.name}
									className="h-24 w-24 rounded-md border border-hex-gold/40"
									src={champion.imageUrl}
								/>
								<div>
									<div className="display font-medium text-2xl text-hex-gold">
										{champion.name}
									</div>
									<div className="text-muted-foreground text-sm italic">
										{champion.title}
									</div>
									<div className="mt-2 flex gap-1">
										{champion.tags.map((t) => (
											<Badge
												key={t}
												className="border-hex-blue/40 text-[10px] text-hex-blue-glow"
												variant="outline"
											>
												{t}
											</Badge>
										))}
									</div>
								</div>
							</div>
						</div>
					</section>

					<section className="hex-border rounded-lg p-4 3xl:p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="display font-medium text-xl text-hex-gold">Levels</h2>
							<div className="gold-text text-3xl font-bold">{level}</div>
						</div>
						<Slider
							className="build-level-slider"
							max={18}
							min={1}
							onValueChange={(v) => setLevel(v[0])}
							step={1}
							value={[level]}
						/>
						<div className="text-muted-foreground mt-2 flex justify-between text-xs">
							<span>1</span>
							<span>18</span>
						</div>
					</section>

					<section className="hex-border rounded-lg p-4 3xl:p-6">
						<h2 className="display font-medium mb-4 text-xl text-hex-gold">Skills</h2>
						<div className="space-y-3">
							{champion.spells.map((spell) => {
								const rank = skillRanks[spell.key] ?? 0;
								return (
									<div key={spell.key} className="flex items-start gap-3">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hex-blue/40 bg-secondary font-bold text-hex-blue-glow">
											{spell.key}
										</div>
										<div className="flex-1">
											<div className="flex justify-between">
												<span className="text-sm font-semibold">
													{spell.name}
												</span>
												<span className="text-muted-foreground text-xs">
													Rank {rank}/{spell.maxRank}
												</span>
											</div>
											<div className="mt-1 flex gap-1">
												{Array.from(
													{ length: spell.maxRank },
													(_, i) => i + 1
												).map((n) => (
													<button
														key={n}
														className={
															'h-2 flex-1 rounded-sm transition-colors ' +
															(n <= rank
																? 'bg-gradient-to-r from-hex-gold to-hex-gold-dark'
																: 'border-border bg-secondary border')
														}
														onClick={() =>
															setRank(
																spell.key,
																spell.maxRank,
																n === rank ? n - 1 : n
															)
														}
														type="button"
													/>
												))}
											</div>
											{rank > 0 && (
												<div className="text-muted-foreground mt-1 text-xs">
													CD:{' '}
													<span className="text-hex-gold">
														{spell.cooldown.split('/')[
															Math.min(
																rank - 1,
																spell.cooldown.split('/').length - 1
															)
														] ?? spell.cooldown}
													</span>
													{' • '}Cost:{' '}
													<span className="text-hex-blue-glow">
														{spell.cost.split('/')[
															Math.min(
																rank - 1,
																spell.cost.split('/').length - 1
															)
														] ?? spell.cost}
													</span>
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</section>
				</div>
				<div className="space-y-6">
					<section className="hex-border rounded-lg p-4 3xl:p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="display font-medium text-xl text-hex-gold">
								Items ({selected.length}/6)
							</h2>
							<div className="text-amber-500 font-medium flex items-center gap-1 text-sm">
								<Coins className="h-4 w-4" />
								{totalCost}
							</div>
						</div>

						<div className="mb-5 grid grid-cols-6 gap-2">
							{Array.from({ length: 6 }, (_, i) => {
								const it = selected[i];
								return (
									<div
										key={i}
										className="group border-hex-gold/30 relative flex aspect-square items-center justify-center rounded-md border bg-secondary/50 p-1 text-center hover:cursor-pointer"
										onContextMenu={
											it
												? (e) => {
														e.preventDefault();
														removeItem(i);
													}
												: undefined
										}
										title={it ? 'Right-click to remove' : undefined}
									>
										{it ? (
											<>
												<span className="text-foreground text-[10px] leading-tight">
													{it.name}
												</span>
												<button
													className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full opacity-0 group-hover:opacity-100"
													onClick={() => removeItem(i)}
													type="button"
												>
													<X size={10} />
												</button>
											</>
										) : (
											<Plus className="text-muted-foreground h-4 w-4" />
										)}
									</div>
								);
							})}
						</div>

						<div className="mb-3 md:w-72">
							<SearchAutocomplete
								getLabel={(i) => i.name}
								items={items}
								onChange={setItemSearch}
								placeholder="Search items to add..."
								value={itemSearch}
							/>
						</div>
						<div className="mb-3 flex flex-wrap gap-1.5">
							{itemTags.map((t) => (
								<button
									key={t}
									className={
										'rounded border px-2 py-1 text-[10px] uppercase tracking-wider ' +
										(itemTag === t
											? 'border-hex-gold bg-hex-gold/10 text-hex-gold'
											: 'border-border text-muted-foreground')
									}
									onClick={() => setItemTag(t)}
									type="button"
								>
									{t}
								</button>
							))}
						</div>
						<div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
							{filteredItems.map((i) => (
								<button
									key={i.id}
									className="border-border hover:border-hex-gold rounded border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
									disabled={selected.length >= 6}
									onClick={() => addItem(i)}
									type="button"
								>
									<div className="flex items-start justify-between">
										<span className="text-sm text-hex-gold">{i.name}</span>
										<span className="text-hex-gold-dark flex items-center gap-0.5 text-xs">
											<Coins className="h-3 w-3" />
											{i.cost}
										</span>
									</div>
									<div className="text-muted-foreground line-clamp-1 text-[10px]">
										{i.tags.join(' • ')}
									</div>
								</button>
							))}
						</div>
					</section>
				</div>
				<div className="space-y-6">
					{/* Stats */}
					<div className="hex-border rounded-lg p-4 3xl:p-6">
						<h2 className="display font-medium mb-4 text-xl text-hex-gold">
							Base Stats
						</h2>
						<p className="text-muted-foreground mb-4 text-xs">
							Lv. {level} · {selected.length} item(s)
						</p>
						<dl className="space-y-2 text-sm">
							<StatRow label="Health" value={stats.hp.toFixed(0)} />
							<StatRow label={champion.partype} value={stats.mp.toFixed(0)} />
							<StatRow label="Attack Damage" value={stats.ad.toFixed(1)} />
							<StatRow label="Ability Power" value={stats.ap.toFixed(0)} />
							<StatRow label="Attack Speed" value={stats.as.toFixed(3)} />
							<StatRow label="Crit Chance" value={`${stats.crit}%`} />
							<StatRow label="Armor" value={stats.armor.toFixed(0)} />
							<StatRow label="Magic Resist" value={stats.mr.toFixed(0)} />
							<StatRow label="Magic Pen" value={stats.mpen.toString()} />
							<StatRow label="Lifesteal" value={`${stats.lifesteal}%`} />
							<StatRow label="Ability Haste" value={stats.ahaste.toString()} />
							<StatRow label="Move Speed" value={stats.ms.toFixed(0)} />
							<StatRow label="HP Regen" value={stats.hpregen.toFixed(1)} />
							{/* <StatRow
                                highlight
                                label="Total Cost"
                                value={totalCost ? `${formatNumber(totalCost)}g` : '0'}
                            /> */}
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatRow({
	label,
	value,
	highlight,
}: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	return (
		<div className="border-border/40 flex justify-between border-b pb-1">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className={highlight ? 'text-hex-gold font-semibold' : 'text-foreground'}>
				{value}
			</dd>
		</div>
	);
}
