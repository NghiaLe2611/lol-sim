import { cn } from '@/lib/utils';

const MAX_DIFFICULTY_SEGMENTS = 3;
const SEGMENT_GRADIENT_CLASS = [
	'bg-gradient-to-r from-cyan-200 to-cyan-300 dark:from-sky-100 dark:to-sky-300',
	'bg-gradient-to-r from-cyan-300 to-cyan-500 dark:from-sky-300 dark:to-sky-500',
	'bg-gradient-to-r from-cyan-500 to-cyan-700 dark:from-sky-500 dark:to-sky-700',
] as const;

type DifficultyRatingProps = {
	rating: number;
	className?: string;
};

export default function DifficultyRating({ rating, className }: DifficultyRatingProps) {
	const n = typeof rating === 'string' ? Number.parseInt(rating, 10) : Number(rating);
	const filled = Math.min(MAX_DIFFICULTY_SEGMENTS, Math.max(1, Number.isNaN(n) ? 1 : n));

	return (
		<div
			className={cn('ml-auto grid w-full max-w-[11rem] grid-cols-3 gap-1', className)}
			role="img"
			aria-label={`Difficulty ${filled} of ${MAX_DIFFICULTY_SEGMENTS}`}
		>
			{Array.from({ length: MAX_DIFFICULTY_SEGMENTS }, (_, i) => {
				const isActive = i < filled;
				return (
					<div
						key={i}
						className={cn(
							'h-1.5 rounded-[4px] 2xl:h-2',
							isActive ? SEGMENT_GRADIENT_CLASS[i] : 'bg-muted dark:bg-white/10'
							// isActive
							// 	? 'bg-gradient-to-r from-sky-600 to-sky-200 dark:from-cyan-500 dark:to-cyan-100'
							// 	: 'bg-muted dark:bg-white/10'
						)}
					/>
				);
			})}
		</div>
	);
}
