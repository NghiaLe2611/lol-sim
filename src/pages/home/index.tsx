import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Overview from './Overview';

export default function HomePage() {
	const { t } = useTranslation();
	return (
		<div>
			<section className="relative overflow-hidden">
				<div className="mx-auto max-w-container px-6 py-24 text-center">
					<h1 className="display text-5xl font-bold leading-tight md:text-7xl">
						<span className="gold-text">{t('home.titleGold')}</span>{' '}
						{t('home.titleRest')}
					</h1>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
						{t('home.subtitle')}
					</p>
					<div className="mt-9 flex flex-wrap justify-center gap-3">
						<Link
							className="rounded-md bg-gradient-to-r from-hex-gold to-hex-gold-dark px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-gold hover:opacity-90"
							to="/build"
						>
							{t('home.ctaBuild')}
						</Link>
						<Link
							className="text-hex- rounded-md border border-hex-gold/50 bg-gray-100/80 px-6 py-3 text-sm uppercase tracking-wider hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-800"
							to="/champions"
						>
							{t('home.ctaChampions')}
						</Link>
					</div>
				</div>
			</section>
			<Overview />
		</div>
	);
}
