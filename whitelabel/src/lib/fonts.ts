/**
 * Global Font Optimization & Google Fonts Mapping
 * Ensures optimal variable font weights or explicit weight ranges for all available tenant fonts.
 */
export const GOOGLE_FONT_WEIGHTS: Record<string, string> = {
  "Bebas Neue": "wght@400",
  "Cinzel": "wght@400..900",
  "DM Sans": "ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000",
  "Epilogue": "ital,wght@0,100..900;1,100..900",
  "Inter": "wght@100..900",
  "Lexend": "wght@100..900",
  "Manrope": "wght@200..800",
  "Montserrat": "ital,wght@0,100..900;1,100..900",
  "Oswald": "wght@200..700",
  "Outfit": "wght@100..900",
  "Playfair Display": "ital,wght@0,400..900;1,400..900",
  "Plus Jakarta Sans": "ital,wght@0,200..800;1,200..800",
  "Poppins": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900",
  "Raleway": "ital,wght@0,100..900;1,100..900",
  "Roboto": "ital,wght@0,300;0,400;0,500;0,700;0,900;1,300;1,400;1,500;1,700;1,900",
  "Sora": "wght@100..800",
  "Space Grotesk": "wght@300..700",
  "Syne": "wght@400..800",
  "Urbanist": "ital,wght@0,100..900;1,100..900",
};

export function getGoogleFontUrl(fontFamily?: string | null): string {
  const fontName = fontFamily?.trim().replace(/['"]/g, "") || "Inter";
  const weightSpec =
    GOOGLE_FONT_WEIGHTS[fontName] || "wght@300;400;500;600;700;800;900";
  const encodedName = encodeURIComponent(fontName).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encodedName}:${weightSpec}&display=swap`;
}

export function getFontFamilyCss(fontFamily?: string | null): string {
  const fontName = fontFamily?.trim().replace(/['"]/g, "") || "Inter";

  // Match appropriate system fallbacks based on font archetype
  if (fontName === "Cinzel" || fontName === "Playfair Display") {
    return `'${fontName}', Georgia, Cambria, 'Times New Roman', Times, serif`;
  }
  if (
    fontName === "Bebas Neue" ||
    fontName === "Oswald" ||
    fontName === "Space Grotesk" ||
    fontName === "Syne"
  ) {
    return `'${fontName}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  }

  return `'${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
}
