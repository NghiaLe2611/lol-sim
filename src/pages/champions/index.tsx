import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { Badge } from '@/components/ui/badge';
import { champions } from '@/data/lol';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ChampionsPage() {
    const [search, setSearch] = useState('');
    const [tag, setTag] = useState<string>('All');

    const tags = useMemo(
        () => ['All', ...Array.from(new Set(champions.flatMap((c) => c.tags)))],
        []
    );

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return champions.filter((c) => {
            const matchesSearch =
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q) ||
                c.tags.join(' ').toLowerCase().includes(q);
            const matchesTag = tag === 'All' || c.tags.includes(tag);
            return matchesSearch && matchesTag;
        });
    }, [search, tag]);

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <header className="mb-8">
                <h1 className="display gold-text text-4xl">Champions</h1>
                <p className="text-muted-foreground mt-2">
                    Click any champion for detailed stats and abilities.
                </p>
            </header>

            <div className="mb-8 flex flex-col gap-4 md:flex-row">
                <div className="md:w-96">
                    <SearchAutocomplete
                        getKeywords={(c) => [c.title, ...c.tags]}
                        getLabel={(c) => c.name}
                        items={champions}
                        onChange={setSearch}
                        placeholder="Search champions..."
                        value={search}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tg) => (
                        <button
                            key={tg}
                            className={
                                'rounded-md border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ' +
                                (tag === tg
                                    ? 'border-hex-gold bg-hex-gold/10 text-hex-gold'
                                    : 'border-border text-muted-foreground hover:text-foreground')
                            }
                            onClick={() => setTag(tg)}
                            type="button"
                        >
                            {tg}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((c) => (
                    <Link
                        key={c.id}
                        className="hex-border group overflow-hidden rounded-lg transition-all hover:-translate-y-1 hover:border-hex-gold"
                        to={`/champions/${c.id}`}
                    >
                        <div className="aspect-square overflow-hidden bg-secondary">
                            <img
                                alt={c.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                loading="lazy"
                                src={c.imageUrl}
                            />
                        </div>
                        <div className="p-3">
                            <div className="display text-lg text-hex-gold">{c.name}</div>
                            <div className="text-muted-foreground line-clamp-1 text-xs italic">
                                {c.title}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {c.tags.map((tg) => (
                                    <Badge
                                        key={tg}
                                        className="border-hex-blue/40 text-[10px] text-hex-blue-glow"
                                        variant="outline"
                                    >
                                        {tg}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Link>
                ))}
                {filtered.length === 0 && (
                    <div className="text-muted-foreground col-span-full py-12 text-center">
                        No champions match your search.
                    </div>
                )}
            </div>
        </div>
    );
}
