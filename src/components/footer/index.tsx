import { useTranslation } from 'react-i18next';

export function Footer() {
	const { t } = useTranslation();

	return (
		<footer className="border-border/60 border-t py-6 text-center text-xs text-muted-foreground 2xl:text-sm">
			{t('footer')}
		</footer>
	);
}
