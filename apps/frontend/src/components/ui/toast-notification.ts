export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'default';
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
}

export type ToastType = Toast['type'];
export type ToastVariant = Toast['variant'];
