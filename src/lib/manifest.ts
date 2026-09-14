import { API_SCHEMA_VERSION, type ApiManifest } from "./api";

/** True when the app’s schema is still accepted by the site. */
export function isSchemaSupported(manifest: ApiManifest): boolean {
  return API_SCHEMA_VERSION >= manifest.minSupportedSchemaVersion;
}

export function shouldShowUpdateRequired(manifest: ApiManifest): boolean {
  return !isSchemaSupported(manifest);
}

export function shouldShowManifestBanner(manifest: ApiManifest): boolean {
  return Boolean(manifest.message?.trim());
}
