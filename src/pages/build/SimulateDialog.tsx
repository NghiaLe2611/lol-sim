import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface SimulateDialogProps {
	data: Record<string, any>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}
const SimulateDialog = ({ data, open, onOpenChange }: SimulateDialogProps) => {
	console.log(data);
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="outline:none max-w-3xl gap-3 !ring-0 sm:max-w-3xl"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<VisuallyHidden.Root>
					<DialogTitle>Simulate Damage</DialogTitle>
					<DialogDescription>Simulate Damage</DialogDescription>
				</VisuallyHidden.Root>
				<div className="space-y-2"></div>
			</DialogContent>
		</Dialog>
	);
};

export default SimulateDialog;
