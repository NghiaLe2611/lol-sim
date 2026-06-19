import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;
export type ToastPosition =
	| 'top-right'
	| 'top'
	| 'top-left'
	| 'bottom'
	| 'bottom-left'
	| 'bottom-right';

interface ToastViewportProps extends React.ComponentPropsWithoutRef<
	typeof ToastPrimitives.Viewport
> {
	position?: ToastPosition;
}

const ToastViewport = React.forwardRef<
	React.ElementRef<typeof ToastPrimitives.Viewport>,
	ToastViewportProps
>(({ className, position, ...props }, ref) => {
	const positionClasses: Record<ToastPosition, string> = {
		'top-left': 'top-0 left-0',
		top: 'top-0 left-1/2 -translate-x-1/2',
		'top-right': 'top-0 right-0',
		'bottom-left': 'bottom-0 left-0',
		bottom: 'bottom-0 left-1/2 -translate-x-1/2',
		'bottom-right': 'bottom-0 right-0',
	};

	return (
		<ToastPrimitives.Viewport
			ref={ref}
			className={cn(
				'fixed z-[100] flex max-h-screen w-full flex-col-reverse gap-1 p-4 sm:flex-col md:max-w-[420px]',
				position ? positionClasses[position] : positionClasses['top-right'],
				className
			)}
			{...props}
		/>
	);
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
	'text-white group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-3 xl:p-4 xl:pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in',
	{
		variants: {
			variant: {
				default: 'border bg-background',
				warning: 'border-warning bg-warning warning',
				success: 'border-success bg-success success',
				destructive: 'destructive group border-destructive bg-destructive',
			},
			// position: {
			//     'top-left': 'data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full',
			//     top: 'data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full',
			//     'top-right': 'data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full',
			//     'bottom-left': 'data-[state=open]:slide-in-from-left-full data-[state=closed]:slide-out-to-left-full',
			//     bottom: 'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
			//     'bottom-right':
			//         'data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full',
			// },
		},
		defaultVariants: {
			variant: 'default',
			// position: 'top-right',
		},
	}
);

type ToastVariantProps = VariantProps<typeof toastVariants>;
interface ToastProps
	extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, ToastVariantProps {
	position?: ToastViewportProps['position'];
	showCloseButton?: boolean;
	clickToClose?: boolean;
}
// const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
//     ({ className, variant, ...props }, ref) => (
//         <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
//     ),
// );
const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
	(
		{
			className,
			variant,
			showCloseButton = true,
			clickToClose = false,
			onOpenChange,
			...props
		},
		ref
	) => {
		const handleClick = (e: React.MouseEvent<any>) => {
			if (clickToClose && onOpenChange) {
				onOpenChange(false);
			}
			props.onClick?.(e);
		};

		return (
			<ToastPrimitives.Root
				ref={ref}
				className={cn(toastVariants({ variant }), className)}
				onOpenChange={onOpenChange}
				onClick={handleClick}
				{...props}
			/>
		);
	}
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
	React.ElementRef<typeof ToastPrimitives.Action>,
	React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Action
		ref={ref}
		className={cn(
			'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm 3xl:text-md font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
			className
		)}
		{...props}
	/>
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

interface ToastCloseProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {
	variant?: 'default' | 'warning' | 'success' | 'destructive' | null | undefined;
}
const ToastClose = React.forwardRef<
	React.ElementRef<typeof ToastPrimitives.Close>,
	ToastCloseProps
>(({ className, variant, ...props }, ref) => {
	return (
		<ToastPrimitives.Close
			ref={ref}
			className={cn(
				'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
				className
			)}
			toast-close=""
			{...props}
		>
			<X
				className={cn('h-4 w-4', {
					'text-white': variant !== 'default',
				})}
			/>
		</ToastPrimitives.Close>
	);
});
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
	React.ElementRef<typeof ToastPrimitives.Title>,
	React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Title
		ref={ref}
		className={cn('text-sm font-semibold 3xl:text-md', className)}
		{...props}
	/>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
	React.ElementRef<typeof ToastPrimitives.Description>,
	React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
	<ToastPrimitives.Description
		ref={ref}
		className={cn('text-sm 3xl:text-md opacity-90', className)}
		{...props}
	/>
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
	type ToastProps,
	type ToastActionElement,
	ToastProvider,
	ToastViewport,
	Toast,
	ToastTitle,
	ToastDescription,
	ToastClose,
	ToastAction,
};
