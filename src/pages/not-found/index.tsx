import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="hex-border max-w-md rounded-lg p-10 text-center">
                <h1 className="display gold-text text-7xl">{t('notFound.title')}</h1>
                <p className="text-muted-foreground mt-3">{t('notFound.body')}</p>
                <Link
                    className="border-hex-gold/50 text-hex-gold hover:bg-hex-gold/10 mt-6 inline-block rounded-md border px-4 py-2"
                    to="/"
                >
                    {t('notFound.cta')}
                </Link>
            </div>
        </div>
    );
}
