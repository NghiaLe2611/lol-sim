import { ToastActionElement, ToastPosition } from '@/components/ui/toast';
import { useToast } from './useToast';
import { useTranslation } from 'react-i18next';

type ToastSeverity = 'success' | 'warning' | 'error' | 'info';
type CustomVariant = 'default' | 'warning' | 'destructive' | 'success';

interface UseCustomToastProps {
    title?: string;
    message?: string;
    severity?: ToastSeverity;
    duration?: number;
    action?: ToastActionElement;
    position?: ToastPosition;
    translateKey?: string;
    translateValues?: Record<string, any>;
}
const CustomToast = ({ message }: { message?: string; }) => {
    return <div className='whitespace-pre-line'>{message}</div>;
};

export const useCustomToast = () => {
    const { toast } = useToast();
    const { t } = useTranslation('content');

    const showToast = ({
        title,
        message,
        severity = 'info',
        duration = 2000,
        action,
        position = 'top-right',
        translateKey,
        translateValues,
    }: UseCustomToastProps) => {
        const variantMap: Record<ToastSeverity, CustomVariant> = {
            success: 'success',
            warning: 'warning',
            error: 'destructive',
            info: 'default',
        };

        // Use translation if translateKey is provided, otherwise use the original message
        const translatedMessage = translateKey ? t(translateKey, translateValues) : message;
        
        if (!translatedMessage) {
            return;
        }

        return toast({
            title: title,
            description: <CustomToast message={translatedMessage} />,
            variant: variantMap[severity],
            duration,
            action,
            position,
        });
    };

    return { showToast };
};
