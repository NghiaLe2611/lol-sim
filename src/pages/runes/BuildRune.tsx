import { STALE_MS } from '@/constants/common';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/useMobile';
import RunePopover from '@/pages/runes/components/RunePopover';
import { parseRunePaths, runePerkImgUrl, type DdragonRunePath } from '@/pages/runes/utils';
import { getRunes } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import './build-rune.scss';
import RuneDetail from './components/RuneDetail';

// Subtitle maps matching the preseason design
const PATH_SUBTITLES: Record<string, { body: string; footer: string }> = {
	Precision: {
		body: 'Become a legend',
		footer: 'Improved attacks and sustained damage',
	},
	Domination: {
		body: 'Hunt and eliminate prey',
		footer: 'Burst damage and target access',
	},
	Sorcery: {
		body: 'Unleash destruction',
		footer: 'Empowered abilities and resource manipulation',
	},
	Resolve: {
		body: 'Live forever',
		footer: 'Durability and crowd control',
	},
	Inspiration: {
		body: 'Outwit mere mortals',
		footer: 'Creative tools and rule bending',
	},
};

// Shorthand keys for files
const KEY_MAP: Record<string, string> = {
	Precision: 'p',
	Domination: 'd',
	Sorcery: 's',
	Resolve: 'r',
	Inspiration: 'i',
};

export default function BuildRune() {
	const isMobile = useIsMobile();
	const { patchVersion, isPatchReady } = useAppContext();
	const [activePath, setActivePath] = useState<string | null>(null);

	const runesQuery = useQuery({
		queryKey: ['runes', patchVersion],
		queryFn: () => getRunes(patchVersion!),
		enabled: isPatchReady,
		staleTime: STALE_MS,
		gcTime: STALE_MS,
		select: (raw: DdragonRunePath[]) => parseRunePaths(raw),
	});

	const paths = runesQuery.data ?? [];

	const sortedPaths = useMemo(() => {
		return [...paths].sort((a, b) => a.id - b.id);
	}, [paths]);

	useEffect(() => {
		if (isMobile && sortedPaths.length > 0 && !activePath) {
			setActivePath(sortedPaths[0].key);
		}
	}, [isMobile, sortedPaths, activePath]);

	const activePathData = useMemo(() => {
		return sortedPaths.find((p) => p.key === activePath);
	}, [sortedPaths, activePath]);

	if (runesQuery.isLoading) {
		return (
			<div
				className={clsx(
					'flex items-center justify-center border border-hex-gold/30 bg-[#010a13]',
					isMobile ? 'min-h-[240px]' : 'h-[645px]'
				)}
			>
				<span className="animate-pulse font-medium text-hex-gold">
					Loading Rune Builder...
				</span>
			</div>
		);
	}

	if (isMobile) {
		return (
			<div className="build-rune-container build-rune-container--mobile">
				<div className="rune-mobile-tabs">
					{sortedPaths.map((path) => {
						const shortKey = KEY_MAP[path.key] || 'd';
						return (
							<button
								key={path.id}
								type="button"
								onClick={() => setActivePath(path.key)}
								className={clsx(
									'rune-mobile-tab',
									activePath === path.key && 'rune-mobile-tab--active'
								)}
								title={path.name}
							>
								<img
									src={`/images/runes/icon-${shortKey}-36x36.png`}
									alt={path.name}
									draggable={false}
								/>
							</button>
						);
					})}
				</div>
				{activePathData && (
					<div className="rune-mobile-detail">
						<RuneDetail
							key={activePathData.key}
							isMobile
							onClose={() => setActivePath(null)}
							onPathChange={setActivePath}
							activePathData={activePathData}
							allPaths={sortedPaths}
						/>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="build-rune-container">
			<div
				className={clsx(
					'rune-content rune-content-detail',
					activePath && 'rune-content-visible'
				)}
				aria-hidden={!activePath}
			>
				<RuneDetail
					key={activePathData?.key ?? 'none'}
					onClose={() => setActivePath(null)}
					onPathChange={setActivePath}
					activePathData={activePathData ?? null}
					allPaths={sortedPaths}
				/>
			</div>

			<div
				className={clsx(
					'rune-content rune-content-picker animate-running',
					!activePath && 'rune-content-visible'
				)}
				aria-hidden={Boolean(activePath)}
			>
				{sortedPaths.map((path) => {
					const shortKey = KEY_MAP[path.key] || 'd';
					const subs = PATH_SUBTITLES[path.key] || {
						body: 'Custom playstyle',
						footer: 'Strategic enhancements',
					};

					const keystones = path.slots?.[0]?.runes || [];

					return (
						<div
							key={path.id}
							className="path-block"
							onClick={() => setActivePath(path.key)}
						>
							<div className="perk-wrap">
								<img className="perk-lines" src="/images/runes/lines.png" alt="" />
								<img
									className="perk-glow"
									src={`/images/runes/glow-${shortKey}.png`}
									alt=""
								/>

								<div className="path-icon-wrap">
									<div className="path-icon">
										<img
											className="path-icon-symbol"
											src={`/images/runes/icon-${shortKey}.png`}
											alt=""
										/>
									</div>
									<img
										className="path-vfx"
										src={`/images/runes/vfx-${shortKey}.png`}
										alt=""
									/>
									<div className="path-header">
										<p className="path-title">{path.name}</p>
										<p className="path-body">{subs.body}</p>
									</div>
								</div>

								<div className="keystones-container">
									{keystones.slice(0, 3).map((rune) => (
										<div key={rune.id} className="keystone-node">
											<RunePopover rune={rune}>
												<div className="keystone-inner">
													<img
														className="keystone-img"
														src={runePerkImgUrl(rune.icon)}
														alt={rune.name}
													/>
												</div>
											</RunePopover>
										</div>
									))}
								</div>

								<div className="path-footer">{subs.footer}</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
