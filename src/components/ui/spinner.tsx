import { Ellipsis, LoaderIcon, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { VariantProps, cva } from 'class-variance-authority';
import clsx from 'clsx';

const spinnerVariants = cva('flex-col items-center justify-center', {
	variants: {
		show: {
			true: 'flex',
			false: 'hidden',
		},
	},
	defaultVariants: {
		show: true,
	},
});

const loaderVariants = cva('animate-spin text-primary', {
	variants: {
		size: {
			small: 'size-6',
			medium: 'size-8',
			large: 'size-12',
		},
	},
	defaultVariants: {
		size: 'medium',
	},
});

type SpinnerType = 'default' | 'ellipsis' | 'bars';

interface SpinnerContentProps
	extends VariantProps<typeof spinnerVariants>, VariantProps<typeof loaderVariants> {
	className?: string;
	children?: React.ReactNode;
	type?: SpinnerType;
}

const bars = [0, 0.1, 0.2, 0.3, 0.4];

export function Spinner({ size, show, type, children, className }: SpinnerContentProps) {
	return (
		<span className={spinnerVariants({ show })}>
			{/* <Loader2 className={cn(loaderVariants({ size }), className)} /> */}

			{type === 'ellipsis' && (
				<Ellipsis role="status" aria-label="Loading" className={cn('size-4', className)} />
			)}

			{type === 'bars' && (
				<div className="flex justify-center items-end h-10 space-x-1">
					{bars.map((delay, index) => (
						<div
							key={index}
							className={clsx(
								'w-[2px] h-full bg-primary inline-block animate-loading-bars',
								className
							)}
							style={{
								animationDelay: `${-1.2 + delay}s`,
							}}
						/>
					))}
				</div>
			)}

			{type === 'default' && (
				<LoaderIcon
					role="status"
					aria-label="Loading"
					className={cn('size-4 animate-spin', className)}
				/>
			)}

			{/* <Loader2 className={cn(loaderVariants({ size }), className)} /> */}
			{children}
		</span>
	);
}
