const DEFAULT_APP_BRAND_NAME = 'WCS Gestor Inteligente';

export function getAppBrandName(): string {
  const envBrand = process.env.NEXT_PUBLIC_APP_NAME?.trim();
  if (envBrand) {
    return envBrand;
  }
  return DEFAULT_APP_BRAND_NAME;
}

export const APP_BRAND_NAME = getAppBrandName();
