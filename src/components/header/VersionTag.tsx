import { useAppContext } from '@/contexts/AppContext';

export default function VersionTag() {
	const { patchVersion, isPatchPending, isPatchError } = useAppContext();

	return (
		<div
			className="lborder-border text-hex-gold inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs tracking-wide tabular-nums light:bg-white/80"
			title="Latest League patch (Data Dragon)"
		>
			<span className="inline-grid grid-cols-1 grid-rows-1 place-items-center">
				<span
					aria-hidden
					className="pointer-events-none invisible col-start-1 row-start-1 whitespace-pre tabular-nums"
				>
					99.99.99
				</span>
				<span className="col-start-1 row-start-1 flex min-h-[1lh] items-center justify-center">
					{isPatchPending ? (
						<span
							aria-busy="true"
							aria-label="Loading patch version"
							className="bg-muted-foreground/25 h-[0.65lh] w-full max-w-[7ch] animate-pulse rounded-sm"
						/>
					) : isPatchError ? (
						<span aria-label="Patch unavailable">—</span>
					) : (
						patchVersion
					)}
				</span>
			</span>
		</div>
	);
}
