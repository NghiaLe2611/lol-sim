import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { links } from '@/constants/common';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/providers/theme-provider';
import { Menu, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import HoverPopover from '../HoverPopover';
import VersionTag from './VersionTag';
// import { useMediaQuery } from '@/hooks/useMedia';

const headerClassName =
	'border-border/60 bg-background/70 sticky top-0 z-40 border-b shadow-[0_4px_6px_-1px_rgba(83,83,83,0.1)] backdrop-blur-md bg-sky-100/5 dark:shadow-[0_4px_6px_-1px_#0a2738]';
const sidebarClassName =
	'border-border/60 bg-sky-100 dark:bg-background inset-x-auto inset-y-0 left-0 top-0 bottom-0 mt-0 h-full w-[min(100%,280px)] max-w-[85vw] rounded-none border-0 border-r shadow-[4px_0_6px_-1px_rgba(83,83,83,0.1)] dark:shadow-[4px_0_6px_-1px_#0a2738] [&>div:first-child]:hidden';

function MobileHeader() {
	const path = useLocation().pathname;
	const { t, i18n } = useTranslation();
	const { theme, setTheme } = useTheme();
	const lang = i18n.language.startsWith('vi') ? 'vi' : 'en';
	const [open, setOpen] = useState(false);

	const closeSidebar = () => setOpen(false);

	return (
		<>
			<header className={headerClassName}>
				<div className="mx-auto flex max-w-container items-center gap-4 px-6 py-4">
					<button
						type="button"
						aria-label="Open menu"
						className="text-foreground"
						onClick={() => setOpen(true)}
					>
						<Menu />
					</button>
					<Link className="flex items-center gap-4" to="/">
						<img src="/images/logo.svg" alt="LOL Builder" className="w-8" />
						<span className="display gold-text-flow text-xl font-bold">
							{t('brand')}
						</span>
					</Link>
				</div>
			</header>

			<Drawer
				direction="left"
				onOpenChange={setOpen}
				open={open}
				shouldScaleBackground={false}
			>
				<DrawerContent className={sidebarClassName}>
					<DrawerTitle className="sr-only">Menu</DrawerTitle>
					<div className="flex h-full flex-col gap-6 px-6 py-6">
						<Link className="flex items-center gap-4" onClick={closeSidebar} to="/">
							<img src="/images/logo.svg" alt="LOL Builder" className="w-8" />
							<span className="display gold-text-flow text-xl font-bold">
								{t('brand')}
							</span>
						</Link>

						<ul className="flex flex-col gap-1">
							{links.map((l) => {
								const active =
									l.to === '/'
										? path === '/'
										: path === l.prefix || path.startsWith(`${l.prefix}/`);
								return (
									<li key={l.to}>
										<Link
											className={
												'block rounded-md px-4 py-2 text-sm uppercase tracking-wider transition-colors ' +
												(active
													? 'text-hex-gold'
													: 'hover:bg-secondary/50 text-muted-foreground hover:text-hex-gold')
											}
											onClick={closeSidebar}
											to={l.to}
										>
											{t(l.labelKey)}
										</Link>
									</li>
								);
							})}
						</ul>

						<div className="mt-auto flex flex-col gap-4">
							<div className="flex items-center gap-2">
								<span className="text-sm">Language:</span>{' '}
								<Select
									onValueChange={(value) => void i18n.changeLanguage(value)}
									value={lang}
								>
									<SelectTrigger
										aria-label={t('nav.language')}
										className="lborder-border h-9 w-full rounded-md border bg-background px-2 text-xs uppercase tracking-wider text-foreground light:bg-white/80 [&>span]:flex [&>span]:items-center"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent align="start">
										<SelectItem value="en">English</SelectItem>
										<SelectItem value="vi">Tiếng Việt</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm">Theme:</span>
								<Button
									aria-label={t('nav.toggleTheme')}
									className="lborder-border h-9 w-9 shrink-0 border text-hex-gold hover:bg-secondary light:bg-white/80"
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
							<div className="flex items-center gap-2">
								<span className="text-sm">Version:</span>
								<VersionTag />
							</div>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</>
	);
}

export function Header() {
	const path = useLocation().pathname;
	const { t, i18n } = useTranslation();
	const { theme, setTheme } = useTheme();
	const lang = i18n.language.startsWith('vi') ? 'vi' : 'en';

	const isMobile = useIsMobile();

	if (isMobile) {
		return <MobileHeader />;
	}
	return (
		<header className={headerClassName}>
			<div className="mx-auto flex max-w-container items-center justify-between gap-4 px-6 py-4">
				<Link className="flex items-center gap-4" to="/">
					{/* <div className="border-hex-gold from-hex-gold/30 h-9 w-9 rotate-45 border-2 bg-gradient-to-br to-hex-blue/40" /> */}
					<img src="/images/logo.svg" alt="LOL Builder" className="w-8" />
					<span className="display gold-text-flow text-xl font-bold">{t('brand')}</span>
				</Link>

				<div className="flex xl:hidden items-center flex-1 ml-4">
					<HoverPopover
						side="bottom"
						sideOffset={5}
						content={({ open }) => (
							<div className="rounded-sm border border-border bg-background p-2 shadow-sm">
								<ul>
									{links.map((l) => {
										const active =
											l.to === '/'
												? path === '/'
												: path === l.prefix ||
													path.startsWith(`${l.prefix}/`);
										return (
											<li key={l.to}>
												<Link
													className={
														'block px-4 py-2 text-sm uppercase tracking-wider transition-colors ' +
														(active
															? // border border-hex-gold/40 bg-secondary
																'text-hex-gold'
															: 'hover:bg-secondary/50 text-muted-foreground hover:text-hex-gold')
													}
													to={l.to}
												>
													{t(l.labelKey)}
												</Link>
											</li>
										);
									})}
								</ul>
							</div>
						)}
						contentClassName="rounded-md border-0 bg-transparent p-0 shadow-xl"
					>
						<button>
							<Menu />
						</button>
					</HoverPopover>
				</div>
				<nav className="header-nav hidden xl:flex flex-wrap items-center justify-center gap-1">
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
										? // border border-hex-gold/40 bg-secondary
											'text-hex-gold'
										: 'hover:bg-secondary/50 text-muted-foreground hover:text-hex-gold')
								}
								to={l.to}
							>
								{t(l.labelKey)}
							</Link>
						);
					})}
				</nav>
				<nav className="flex items-center gap-2 border-l border-border pl-3">
					<VersionTag />
					<div className="ml-2 flex items-center gap-2">
						{/* <Languages size={28} aria-hidden className="text-muted-foreground" /> */}
						<Select
							onValueChange={(value) => void i18n.changeLanguage(value)}
							value={lang}
						>
							<SelectTrigger
								aria-label={t('nav.language')}
								className="lborder-border h-9 w-[min(100%,9.5rem)] rounded-md border bg-background px-2 text-xs uppercase tracking-wider text-foreground light:bg-white/80 [&>span]:flex [&>span]:items-center"
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
							className="lborder-border h-9 w-9 shrink-0 border text-hex-gold hover:bg-secondary light:bg-white/80"
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
