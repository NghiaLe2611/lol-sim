// import AbilityVideoDialog from '@/pages/champion-detail/AbilityVideoDialog';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useRef, useState } from 'react';

export default function AbilityPopover({
	src,
	isOpen,
	caption,
}: {
	src: string;
	isOpen: boolean;
	caption?: string;
}) {
	const ref = useRef<HTMLVideoElement>(null);
	const [videoLoading, setVideoLoading] = useState(true);

	useEffect(() => {
		setVideoLoading(true);
	}, [src]);

	useEffect(() => {
		const el = ref.current;
		if (!el || !src.trim()) return;

		if (isOpen) {
			el.preload = 'auto';
			void el.play().catch(() => {});
		} else {
			el.pause();
		}
	}, [isOpen, src]);

	if (!src.trim()) {
		return (
			<p className="text-muted-foreground px-3 py-2 text-center text-xs">
				Video not available
			</p>
		);
	}

	return (
		<div className="w-[min(350px,85vw)] rounded-md border border-border bg-background from-background p-3 4xl:p-4 shadow-lg">
			{caption ? (
				<p className="mb-2 truncate bg-muted/30 text-xs font-medium leading-snug text-muted-foreground 4xl:text-sm">
					{caption}
				</p>
			) : null}
			<div className="relative aspect-video max-h-[250px] min-h-[150px] w-full overflow-hidden rounded-sm bg-muted">
				{videoLoading ? (
					<div
						className="absolute inset-0 z-10 flex items-center justify-center bg-muted"
						aria-busy="true"
						aria-live="polite"
					>
						<Spinner className="size-8 text-muted-foreground" />
					</div>
				) : null}
				<video
					key={src}
					ref={ref}
					className="absolute inset-0 h-full w-full object-cover object-center bg-black"
					src={src}
					muted
					loop
					playsInline
					preload="metadata"
					tabIndex={-1}
					onLoadedData={() => setVideoLoading(false)}
					onError={() => setVideoLoading(false)}
				/>
			</div>
		</div>
	);
}
