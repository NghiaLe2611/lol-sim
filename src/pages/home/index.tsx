import { champions, items, summonerSpells } from '@/data/lol';
import { Calculator, Shield, Sparkles, Sword } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function HomePage() {
    const { t } = useTranslation();

    const cards = [
        {
            to: '/champions',
            icon: Sword,
            titleKey: 'home.cards.champions.title' as const,
            count: champions.length,
            descKey: 'home.cards.champions.desc' as const,
        },
        {
            to: '/items',
            icon: Shield,
            titleKey: 'home.cards.items.title' as const,
            count: items.length,
            descKey: 'home.cards.items.desc' as const,
        },
        {
            to: '/summoners',
            icon: Sparkles,
            titleKey: 'home.cards.summoners.title' as const,
            count: summonerSpells.length,
            descKey: 'home.cards.summoners.desc' as const,
        },
        {
            to: '/build',
            icon: Calculator,
            titleKey: 'home.cards.build.title' as const,
            count: t('home.cards.build.count'),
            descKey: 'home.cards.build.desc' as const,
        },
    ];

    return (
        <div>
            <section className="relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 py-24 text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-hex-gold/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-hex-gold">
                        {t('home.patch')}
                    </div>
                    <h1 className="display text-5xl font-bold leading-tight md:text-7xl">
                        <span className="gold-text">{t('home.titleGold')}</span>{' '}
                        {t('home.titleRest')}
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg">
                        {t('home.subtitle')}
                    </p>
                    <div className="mt-9 flex flex-wrap justify-center gap-3">
                        <Link
                            className="text-primary-foreground rounded-md bg-gradient-to-r from-hex-gold to-hex-gold-dark px-6 py-3 text-sm font-semibold uppercase tracking-wider shadow-gold hover:opacity-90"
                            to="/build"
                        >
                            {t('home.ctaBuild')}
                        </Link>
                        <Link
                            className="rounded-md border border-hex-gold/50 px-6 py-3 text-sm uppercase tracking-wider text-hex- bg-gray-100/80 hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-800"
                            to="/champions"
                        >
                            {t('home.ctaChampions')}
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((c) => (
                    <Link
                        key={c.to}
                        className="hex-border group rounded-lg p-6 transition-colors hover:border-hex-gold"
                        to={c.to}
                    >
                        <c.icon className="mb-4 h-8 w-8 text-hex-gold" />
                        <div className="flex items-baseline justify-between">
                            <h3 className="display text-xl">{t(c.titleKey)}</h3>
                            <span className="gold-text text-2xl font-bold">{c.count}</span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">{t(c.descKey)}</p>
                    </Link>
                ))}
            </section>
        </div>
    );
}
