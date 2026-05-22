import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

const ABILITY_VIDEO_URL = 'https://lol.dyn.riotcdn.net/x/videos/champion-abilities';

export type AbilitySlotToken = 'P' | 'Q' | 'W' | 'E' | 'R';

/** Riot CDN: `266` → `0266`, file `ability_0266_Q1.mp4`. */
export function riotAbilityVideoUrl(
	championNumericId: number | string,
	slot: AbilitySlotToken
): string {
	const raw =
		typeof championNumericId === 'number'
			? championNumericId
			: parseInt(String(championNumericId).trim(), 10);
	const n = Number.isFinite(raw) ? Math.trunc(raw) : 0;
	const padded = String(Math.max(0, n)).padStart(4, '0');
	return `${ABILITY_VIDEO_URL}/${padded}/ability_${padded}_${slot}1.mp4`;
}

type AbilityVideoDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	videoUrl: string;
	title?: string;
};

export default function AbilityVideoDialog({
	open,
	onOpenChange,
	videoUrl,
	title = 'Ability preview',
}: AbilityVideoDialogProps) {
	const [unavailable, setUnavailable] = useState(false);

	useEffect(() => {
		if (open) {
			setUnavailable(!videoUrl.trim());
		}
	}, [open, videoUrl]);

	const emptyUrl = videoUrl.trim().length === 0;
	const showPlayer = !emptyUrl && !unavailable;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl gap-3 sm:max-w-3xl outline:none !ring-0">
				<DialogHeader className='mb-4'>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription className="sr-only">
						Official ability spotlight video from Riot CDN when available.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<div className="relative isolate mx-auto aspect-video min-h-[200px] w-full shrink-0 overflow-hidden rounded-md bg-black sm:min-h-[240px]">
						{showPlayer ? (
							<video
								key={videoUrl}
								className="pointer-events-auto absolute inset-0 h-full w-full object-contain"
								controls
								playsInline
								preload="metadata"
								onError={() => setUnavailable(true)}
							>
								<source src={videoUrl} type="video/mp4" />
							</video>
						) : null}
					</div>
					{unavailable ? (
						<p className="text-muted-foreground text-center text-sm">
							Video not available.
						</p>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
