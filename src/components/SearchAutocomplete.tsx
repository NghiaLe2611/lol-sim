import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type Props<T> = {
    items: T[];
    getLabel: (item: T) => string;
    getKeywords?: (item: T) => string[];
    placeholder?: string;
    onChange: (value: string) => void;
    value: string;
};

export function SearchAutocomplete<T>({
    items,
    getLabel,
    getKeywords,
    placeholder = 'Search...',
    onChange,
    value,
}: Props<T>) {
    const [focused, setFocused] = useState(false);

    const suggestions = useMemo(() => {
        if (!value.trim()) return [];
        const q = value.toLowerCase();
        return items
            .filter((it) => {
                const label = getLabel(it).toLowerCase();
                const kws = getKeywords?.(it).join(' ').toLowerCase() ?? '';
                return label.includes(q) || kws.includes(q);
            })
            .slice(0, 6);
    }, [items, value, getLabel, getKeywords]);

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    placeholder={placeholder}
                    className="pl-9 bg-input/60 border-border/60 focus:border-hex-gold"
                />
            </div>
            {focused && suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-popover border border-hex-gold/30 rounded-md shadow-hex overflow-hidden">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onMouseDown={() => onChange(getLabel(s))}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-secondary text-foreground"
                        >
                            {getLabel(s)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
