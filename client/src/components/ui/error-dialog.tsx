import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

// Define the error types
export type ErrorType = 'error' | 'warning' | 'info';

// Props for the error dialog
interface ErrorDialogProps {
  title: string;
  message: string;
  type: ErrorType;
  onClose?: () => void;
}

// State singleton to control the dialog
let errorDialogState: {
  isOpen: boolean;
  title: string;
  message: string;
  type: ErrorType;
  onClose?: () => void;
  setOpen: (open: boolean) => void;
} = {
  isOpen: false,
  title: '',
  message: '',
  type: 'error',
  onClose: undefined,
  setOpen: () => {}
};

// Function to show the error dialog
export function showErrorDialog(props: Omit<ErrorDialogProps, 'open'>) {
  errorDialogState.title = props.title;
  errorDialogState.message = props.message;
  errorDialogState.type = props.type;
  errorDialogState.onClose = props.onClose;
  errorDialogState.setOpen(true);
}

// UI Component for the error dialog
export function ErrorDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState<ErrorType>('error');
  const [onClose, setOnClose] = React.useState<(() => void) | undefined>(undefined);

  // Connect to the singleton state on mount
  React.useEffect(() => {
    errorDialogState.setOpen = (newOpen) => {
      setOpen(newOpen);
      // Call onClose when dialog is closed
      if (!newOpen && onClose) {
        onClose();
      }
    };

    // Update local state when singleton state changes
    const updateFromState = () => {
      setTitle(errorDialogState.title);
      setMessage(errorDialogState.message);
      setType(errorDialogState.type);
      setOnClose(() => errorDialogState.onClose);
    };

    // Initial update
    updateFromState();

    // Cleanup on unmount
    return () => {
      errorDialogState.setOpen = () => {};
    };
  }, [onClose]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Get icon and color based on type
  const getDialogStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: '⚠️',
          headerColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: '⚠️',
          headerColor: 'text-yellow-500'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          headerColor: 'text-blue-500'
        };
      default:
        return {
          icon: '⚠️',
          headerColor: 'text-red-500'
        };
    }
  };

  const styles = getDialogStyles();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className={`flex items-center gap-2 ${styles.headerColor}`}>
            <span>{styles.icon}</span> {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleClose} className="bg-primary hover:bg-primary/90">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Also provide a default export for backward compatibility
export default ErrorDialog;