import { Input } from '@/components/ui/input';
import { summonerSpells } from '@/data/lol';
import { Search, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function SummonersPage() {
	const [q, setQ] = useState('');
	const filtered = useMemo(() => {
		const s = q.toLowerCase();
		return summonerSpells.filter(
			(sp) => sp.name.toLowerCase().includes(s) || sp.description.toLowerCase().includes(s)
		);
	}, [q]);

	return (
		<div className="mx-auto max-w-container px-6 py-12">
			<header className="mb-8">
				<h1 className="display gold-text text-4xl">Spells</h1>
				<p className="text-muted-foreground mt-2">Choose your two spells wisely.</p>
			</header>

			<div className="relative mb-8 md:w-96">
				<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
				<Input
					className="bg-input/60 pl-9"
					onChange={(e) => setQ(e.target.value)}
					placeholder="Filter spells..."
					value={q}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{filtered.map((s) => (
					<div key={s.id} className="hex-border rounded-lg p-5">
						<div className="mb-2 flex items-center gap-3">
							<div className="h-10 w-10 rotate-45 border border-hex-gold/60 bg-gradient-to-br from-hex-gold/30 to-hex-blue/30" />
							<div className="display text-lg text-hex-gold">{s.name}</div>
						</div>
						<p className="text-muted-foreground text-sm">{s.description}</p>
						<div className="text-muted-foreground mt-3 flex justify-between text-xs">
							<span className="flex items-center gap-1">
								<Timer className="h-3 w-3" />
								{s.cooldown}s
							</span>
							<span>
								Range: <span className="text-foreground">{s.range}</span>
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
