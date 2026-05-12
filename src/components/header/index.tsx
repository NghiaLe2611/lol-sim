import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { links } from '@/constants/common';
import { useTheme } from '@/providers/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import VersionTag from './VersionTag';

export function Header() {
	const path = useLocation().pathname;
	const { t, i18n } = useTranslation();
	const { theme, setTheme } = useTheme();
	const lang = i18n.language.startsWith('vi') ? 'vi' : 'en';

	return (
		<header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md shadow-[0_4px_6px_-1px_rgba(83,83,83,0.1)] dark:shadow-[0_4px_6px_-1px_#0a2738] light:bg-sky-100/5">
			<div className="mx-auto flex max-w-container items-center justify-between gap-4 px-6 py-4">
				<Link className="flex items-center gap-4" to="/">
					{/* <div className="border-hex-gold from-hex-gold/30 h-9 w-9 rotate-45 border-2 bg-gradient-to-br to-hex-blue/40" /> */}
					<img src="/images/logo.svg" alt="LOL Builder" className="w-8" />
					<span className="display gold-text-flow text-xl font-bold">{t('brand')}</span>
				</Link>
				<nav className="header-nav flex flex-wrap items-center justify-center gap-1">
					{links.map((l) => {
						const active =
							l.to === '/'
								? path === '/'
								: path === l.prefix || path.startsWith(`${l.prefix}/`);
						return (
							<Link
								key={l.to}
								className={
									'rounded-md px-4 py-2 text-sm uppercase tracking-wider transition-colors ' +
									(active
										? 'border border-hex-gold/40 bg-secondary text-hex-gold'
										: 'text-muted-foreground hover:bg-secondary/50 hover:text-hex-gold')
								}
								to={l.to}
							>
								{t(l.labelKey)}
							</Link>
						);
					})}
				</nav>
				<nav className="border-border border-l pl-3 flex items-center gap-2">
					<VersionTag />
					<div className="ml-2 flex items-center gap-2">
						{/* <Languages size={28} aria-hidden className="text-muted-foreground" /> */}
						<Select
							onValueChange={(value) => void i18n.changeLanguage(value)}
							value={lang}
						>
							<SelectTrigger
								aria-label={t('nav.language')}
								className="light:bg-white/80 lborder-border bg-background text-foreground h-9 w-[min(100%,9.5rem)] rounded-md border px-2 text-xs uppercase tracking-wider [&>span]:flex [&>span]:items-center"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								<SelectItem value="en">English</SelectItem>
								<SelectItem value="vi">Tiếng Việt</SelectItem>
							</SelectContent>
						</Select>
						<Button
							aria-label={t('nav.toggleTheme')}
							className="light:bg-white/80 lborder-border text-hex-gold hover:bg-secondary h-9 w-9 shrink-0 border"
							onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
							size="icon"
							type="button"
							variant="ghost"
						>
							{theme === 'dark' ? (
								<Sun className="h-4 w-4" />
							) : (
								<Moon className="h-4 w-4" />
							)}
						</Button>
					</div>
				</nav>
			</div>
		</header>
	);
}
