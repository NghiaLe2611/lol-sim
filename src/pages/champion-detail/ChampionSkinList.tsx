import { Button } from '@/components/ui/button';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SKINS_PER_SLIDE = 8;

export type ChampionSkin = {
	name: string;
	id: number;
	loadScreenPath?: string | null;
	uncenteredSplashPath?: string | null;
};

function chunkSkins<T>(items: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

/** `foo.skins_bar.jpg` → `foo.jpg` */
export function normalizeSkinImgUrl(url: string): string {
	const trimmed = url.trim();
	const slash = trimmed.lastIndexOf('/');
	if (slash === -1) return trimmed;

	const filename = trimmed.slice(slash + 1);
	const firstDot = filename.indexOf('.');
	if (firstDot === -1) return trimmed;

	const lastDot = filename.lastIndexOf('.');
	if (lastDot <= firstDot) return trimmed;

	const base = filename.slice(0, firstDot);
	const ext = filename.slice(lastDot);
	return `${trimmed.slice(0, slash + 1)}${base}${ext}`;
}

function skinSplashUrl(skin: ChampionSkin): string | null {
	const raw = skin.uncenteredSplashPath?.trim() || skin.loadScreenPath?.trim();
	return raw ? normalizeSkinImgUrl(raw) : null;
}

function SkinLoadScreen({ skin, onOpen }: { skin: ChampionSkin; onOpen: () => void }) {
	const raw = skin.loadScreenPath?.trim();
	if (!raw) return null;
	const src = normalizeSkinImgUrl(raw);

	return (
		<Tooltip delayDuration={0}>
			<TooltipTrigger asChild>
				<button
					type="button"
					className="border-border/50 aspect-[11/20] w-full overflow-hidden rounded-md border bg-muted transition-colors hover:border-hex-gold/40"
					onClick={onOpen}
				>
					<img
						src={src}
						alt={skin.name}
						title={skin.name}
						className="h-full w-full object-cover object-top transition-transform hover:scale-105"
						loading="lazy"
					/>
				</button>
			</TooltipTrigger>
			<TooltipContent side="top">{skin.name}</TooltipContent>
		</Tooltip>
	);
}

function SkinGrid({
	skins,
	startIndex,
	onSkinOpen,
}: {
	skins: ChampionSkin[];
	startIndex: number;
	onSkinOpen: (index: number) => void;
}) {
	return (
		<div className="grid grid-cols-8 gap-2">
			{skins.map((skin, i) => (
				<SkinLoadScreen
					key={skin.id}
					skin={skin}
					onOpen={() => onSkinOpen(startIndex + i)}
				/>
			))}
		</div>
	);
}

function SkinCarousel({
	slides,
	onSkinOpen,
}: {
	slides: ChampionSkin[][];
	onSkinOpen: (index: number) => void;
}) {
	const [api, setApi] = useState<CarouselApi>();
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (!api) return;

		const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
		onSelect();
		api.on('select', onSelect);
		api.on('reInit', onSelect);

		return () => {
			api.off('select', onSelect);
			api.off('reInit', onSelect);
		};
	}, [api]);

	return (
		<div className="group relative">
			<Carousel opts={{ align: 'start' }} setApi={setApi}>
				<CarouselContent className="-ml-2">
					{slides.map((slideSkins, index) => (
						<CarouselItem
							key={slideSkins.map((s) => s.id).join('-')}
							className={cn(
								'pl-2 transition-opacity duration-300',
								index !== selectedIndex && 'opacity-[0.95]'
							)}
						>
							<SkinGrid
								skins={slideSkins}
								startIndex={index * SKINS_PER_SLIDE}
								onSkinOpen={onSkinOpen}
							/>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious
					className={cn(
						'left-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 border-hex-gold !bg-hex-gold !text-white shadow-md hover:!opacity-90',
						'opacity-0 transition-opacity group-hover:opacity-100',
						'disabled:pointer-events-none disabled:!opacity-50'
					)}
				/>
				<CarouselNext
					className={cn(
						'right-1 top-1/2 z-10 h-8 w-8 -translate-y-1/2 border-hex-gold !bg-hex-gold !text-white shadow-md hover:!opacity-90',
						'opacity-0 transition-opacity group-hover:opacity-100',
						'disabled:pointer-events-none disabled:!opacity-50'
					)}
				/>
			</Carousel>
		</div>
	);
}

function LightboxSplashImage({ src, alt }: { src: string; alt: string }) {
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setLoaded(false);
	}, [src]);

	const handleImgRef = (el: HTMLImageElement | null) => {
		if (el?.complete && el.naturalWidth > 0) {
			setLoaded(true);
		}
	};

	return (
		<div className="relative h-full w-full">
			<div
				className={cn(
					'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
					loaded ? 'pointer-events-none opacity-0' : 'opacity-100'
				)}
				aria-hidden={loaded}
			>
				<Spinner type="default" className="size-10 text-white/80" />
			</div>
			<img
				ref={handleImgRef}
				src={src}
				alt={alt}
				className={cn(
					'h-full w-full object-contain transition-opacity duration-300',
					loaded ? 'opacity-100 animate-in fade-in' : 'opacity-0'
				)}
				onLoad={() => setLoaded(true)}
				onError={() => setLoaded(true)}
			/>
		</div>
	);
}

function SkinLightbox({
	skins,
	index,
	open,
	onOpenChange,
	onIndexChange,
}: {
	skins: ChampionSkin[];
	index: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onIndexChange: (index: number) => void;
}) {
	const skin = skins[index];
	const splashSrc = skin ? skinSplashUrl(skin) : null;
	const total = skins.length;
	const canNavigate = total > 1;

	const goPrev = useCallback(() => {
		onIndexChange((index - 1 + total) % total);
	}, [index, onIndexChange, total]);

	const goNext = useCallback(() => {
		onIndexChange((index + 1) % total);
	}, [index, onIndexChange, total]);

	useEffect(() => {
		if (!open || !canNavigate) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				goPrev();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				goNext();
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, canNavigate, goPrev, goNext]);

	if (!skin) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className={cn(
					'group/lightbox max-w-[min(1215px,calc(100vw-2rem))] gap-0 overflow-hidden border-none bg-transparent p-0 shadow-md',
					'[&>button:last-child]:text-white [&>button:last-child]:opacity-70 [&>button:last-child]:hover:opacity-100'
				)}
			>
				<DialogTitle className="sr-only">{skin.name}</DialogTitle>
				<DialogDescription className="sr-only">
					Skin {index + 1} of {total}: {skin.name}
				</DialogDescription>

				<span className="absolute left-4 top-4 z-20 text-sm font-medium text-white/90">
					{index + 1} / {total}
				</span>

				<div className="relative w-full">
					{canNavigate ? (
						<>
							<button
								type="button"
								aria-label="Previous skin"
								className={cn(
									'flex items-center justify-center',
									'absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-black/40 !text-white 4xl:h-12 4xl:w-12',
									'opacity-0 transition-opacity hover:bg-black/60 group-hover/lightbox:opacity-100'
								)}
								onClick={goPrev}
							>
								<ChevronLeft className="-ml-1 h-4 w-4 4xl:h-6 4xl:w-6" />
							</button>
							<button
								type="button"
								aria-label="Next skin"
								className={cn(
									'flex items-center justify-center',
									'absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full bg-black/40 !text-white 4xl:h-12 4xl:w-12',
									'opacity-0 transition-opacity hover:bg-black/60 group-hover/lightbox:opacity-100'
								)}
								onClick={goNext}
							>
								<ChevronRight className="ml-1 h-4 w-4 4xl:h-6 4xl:w-6" />
							</button>
						</>
					) : null}

					<div className="aspect-[1215/715] w-full">
						{splashSrc ? (
							<LightboxSplashImage src={splashSrc} alt={skin.name} />
						) : (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								Image unavailable
							</div>
						)}
					</div>
				</div>

				<p className="mt-3 px-4 text-center text-sm font-medium text-white/90 sm:text-base 4xl:text-lg">
					{skin.name}
				</p>
			</DialogContent>
		</Dialog>
	);
}

export default function ChampionSkinList({ skins }: { skins: ChampionSkin[] | undefined }) {
	const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

	const visibleSkins = useMemo(
		() => (skins ?? []).filter((s) => s.loadScreenPath?.trim()),
		[skins]
	);
	const slides = useMemo(() => chunkSkins(visibleSkins, SKINS_PER_SLIDE), [visibleSkins]);

	const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);

	if (visibleSkins.length === 0) {
		return <p className="text-sm text-muted-foreground">No skins available.</p>;
	}

	return (
		<>
			{visibleSkins.length <= SKINS_PER_SLIDE ? (
				<SkinGrid skins={visibleSkins} startIndex={0} onSkinOpen={openLightbox} />
			) : (
				<SkinCarousel slides={slides} onSkinOpen={openLightbox} />
			)}

			{lightboxIndex !== null ? (
				<SkinLightbox
					skins={visibleSkins}
					index={lightboxIndex}
					open={lightboxIndex !== null}
					onOpenChange={(next) => {
						if (!next) setLightboxIndex(null);
					}}
					onIndexChange={setLightboxIndex}
				/>
			) : null}
		</>
	);
}
