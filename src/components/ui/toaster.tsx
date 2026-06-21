import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';

export function Toaster() {
	const { toasts } = useToast();
	const lastToastPosition = toasts[toasts.length - 1]?.position || 'top-right';

	return (
		<ToastProvider>
			{toasts.map(function ({
				id,
				title,
				description,
				action,
				showCloseButton = true,
				dedupeKey: _dedupeKey,
				...props
			}) {
				return (
					<Toast key={id} {...props} showCloseButton={showCloseButton}>
						<div className="grid w-full gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && <ToastDescription>{description}</ToastDescription>}
						</div>
						{action}
						{/* <ToastClose variant={props.variant} /> */}
						{showCloseButton && <ToastClose variant={props.variant} />}
					</Toast>
				);
			})}
			<ToastViewport position={lastToastPosition} />
		</ToastProvider>
	);
}
