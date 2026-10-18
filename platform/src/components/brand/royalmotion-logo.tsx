"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface RoyalMotionLogoProps {
  /**
   * "full": Full horizontal brand wordmark + mark (2098x493)
   * "icon": Distinctive RMIT monogram mark (1:1)
   * "social": Facebook / Social avatar mark (1:1)
   */
  variant?: "full" | "icon" | "social";
  /**
   * "yellow": Official yellow & white/black brand identity (default)
   * "monochrome": Strict black/white
   */
  palette?: "yellow" | "monochrome";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function RoyalMotionLogo({
  variant = "full",
  palette = "yellow",
  className,
  imageClassName,
  priority = false,
}: RoyalMotionLogoProps) {
  if (variant === "icon") {
    return (
      <div className={cn("relative shrink-0 flex items-center justify-center", className)}>
        {/* Light Mode: Full Black Icon */}
        <Image
          src="/brand/icon-black.png"
          alt="RoyalMotion IT"
          width={40}
          height={40}
          priority={priority}
          className={cn("dark:hidden block object-contain", imageClassName)}
        />
        {/* Dark Mode: Full White Icon */}
        <Image
          src="/brand/icon-white.png"
          alt="RoyalMotion IT"
          width={40}
          height={40}
          priority={priority}
          className={cn("hidden dark:block object-contain", imageClassName)}
        />
      </div>
    );
  }

  if (variant === "social") {
    return (
      <div className={cn("relative shrink-0 flex items-center justify-center overflow-hidden rounded-xl", className)}>
        <Image
          src="/brand/logo-social.png"
          alt="RoyalMotion IT"
          width={48}
          height={48}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  // variant === "full"
  const lightSrc =
    palette === "yellow" ? "/brand/logo-black-yellow.png" : "/brand/logo-black.png";
  const darkSrc =
    palette === "yellow" ? "/brand/logo-white-yellow.png" : "/brand/logo-white.png";

  return (
    <div className={cn("relative shrink-0 flex items-center", className)}>
      {/* Light Mode */}
      <Image
        src={lightSrc}
        alt="RoyalMotion IT"
        width={160}
        height={38}
        priority={priority}
        className={cn("dark:hidden block h-8 w-auto object-contain", imageClassName)}
      />
      {/* Dark Mode */}
      <Image
        src={darkSrc}
        alt="RoyalMotion IT"
        width={160}
        height={38}
        priority={priority}
        className={cn("hidden dark:block h-8 w-auto object-contain", imageClassName)}
      />
    </div>
  );
}
