"use client";

import * as React from "react";
import { useAdaptiveDevice } from "@/hooks/use-adaptive-device";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface AdaptiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AdaptiveModal({ open, onOpenChange, children }: AdaptiveModalProps) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function AdaptiveModalContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <DrawerContent
        className={cn("p-4 pb-8 max-h-[85dvh] overflow-y-auto", className)}
        {...(props as any)}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("sm:max-w-lg", className)} {...(props as any)}>
      {children}
    </DialogContent>
  );
}

export function AdaptiveModalHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <DrawerHeader className={cn("text-left px-0 pt-2", className)} {...props}>
        {children}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader className={cn(className)} {...props}>
      {children}
    </DialogHeader>
  );
}

export function AdaptiveModalTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <DrawerTitle className={cn("text-lg font-bold", className)} {...(props as any)}>
        {children}
      </DrawerTitle>
    );
  }

  return (
    <DialogTitle className={cn(className)} {...(props as any)}>
      {children}
    </DialogTitle>
  );
}

export function AdaptiveModalDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <DrawerDescription className={cn("text-xs text-muted-foreground", className)} {...(props as any)}>
        {children}
      </DrawerDescription>
    );
  }

  return (
    <DialogDescription className={cn(className)} {...(props as any)}>
      {children}
    </DialogDescription>
  );
}

export function AdaptiveModalFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { isSmartphone } = useAdaptiveDevice();

  if (isSmartphone) {
    return (
      <DrawerFooter className={cn("px-0 pt-4 mt-auto flex-row justify-end gap-2", className)} {...props}>
        {children}
      </DrawerFooter>
    );
  }

  return (
    <DialogFooter className={cn(className)} {...props}>
      {children}
    </DialogFooter>
  );
}
