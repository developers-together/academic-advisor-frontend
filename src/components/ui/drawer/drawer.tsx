import * as DrawerPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

const Drawer = DrawerPrimitive.Root;

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerClose = DrawerPrimitive.Close;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const drawerVariants = cva(
  'fixed z-50 max-h-dvh overflow-y-auto gap-4 bg-card p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=closed]:animate-out data-[state=open]:duration-300 data-[state=open]:animate-in',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 inset-s-0 size-full border-e sm:w-3/4 sm:max-w-sm ltr:data-[state=closed]:slide-out-to-left ltr:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-right rtl:data-[state=open]:slide-in-from-right',
        right:
          'inset-y-0 inset-e-0 h-full w-3/4 border-s sm:max-w-sm ltr:data-[state=closed]:slide-out-to-right ltr:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-left',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

type DrawerContentProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Content
> &
  VariantProps<typeof drawerVariants> & { showClose?: boolean };

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(
  (
    { side = 'right', className, children, showClose = true, ...props },
    ref,
  ) => {
    const { t } = useTranslation();

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          ref={ref}
          className={cn(drawerVariants({ side }), className)}
          {...props}
        >
          {children}
          {showClose && (
            <DrawerPrimitive.Close className="absolute inset-e-2 top-2 flex size-11 items-center justify-center rounded-md text-muted-foreground opacity-70 ring-offset-background transition-opacity hover:bg-accent hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="size-4" aria-hidden />
              <span className="sr-only">{t('actions.close')}</span>
            </DrawerPrimitive.Close>
          )}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    );
  },
);
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 pe-10 text-start', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2',
      className,
    )}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
