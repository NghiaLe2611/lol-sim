import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Badge } from '@/components/ui/badge';
import { items } from '@/data/lol';
import { Coins } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function ItemsPage() {
    const [search, setSearch] = useState('');
    const [tag, setTag] = useState('All');
    const tags = useMemo(() => ['All', ...Array.from(new Set(items.flatMap((i) => i.tags)))], []);
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter((i) => {
            const ms =
                !q ||
                i.name.toLowerCase().includes(q) ||
                i.tags.join(' ').toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q);
            const mt = tag === 'All' || i.tags.includes(tag);
            return ms && mt;
        });
    }, [search, tag]);

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <header className="mb-8">
                <h1 className="display gold-text text-4xl">Item Shop</h1>
                <p className="text-muted-foreground mt-2">
                    Inspect items, stats and unique effects.
                </p>
            </header>

            <div className="mb-8 flex flex-col gap-4 md:flex-row">
                <div className="md:w-96">
                    <SearchAutocomplete
                        getKeywords={(i) => i.tags}
                        getLabel={(i) => i.name}
                        items={items}
                        onChange={setSearch}
                        placeholder="Search items..."
                        value={search}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map((t) => (
                        <button
                            key={t}
                            className={
                                'rounded-md border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ' +
                                (tag === t
                                    ? 'border-hex-gold bg-hex-gold/10 text-hex-gold'
                                    : 'border-border text-muted-foreground hover:text-foreground')
                            }
                            onClick={() => setTag(t)}
                            type="button"
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((i) => (
                    <div
                        key={i.id}
                        className="hex-border hover:border-hex-gold rounded-lg p-5 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="display text-lg text-hex-gold">{i.name}</div>
                                <div className="text-hex-gold-dark mt-0.5 flex items-center gap-1 text-sm">
                                    <Coins className="h-3.5 w-3.5" />
                                    <span>{i.cost}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1">
                                {i.tags.map((t) => (
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
                        <p className="text-muted-foreground mt-3 text-sm italic">{i.description}</p>
                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            {Object.entries(i.stats).map(([k, v]) => (
                                <div
                                    key={k}
                                    className="border-border/50 flex justify-between border-b py-0.5"
                                >
                                    <span className="text-muted-foreground uppercase">{k}</span>
                                    <span className="text-foreground">+{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="text-muted-foreground col-span-full py-12 text-center">
                        No items match your search.
                    </div>
                )}
            </div>
        </div>
    );
}
