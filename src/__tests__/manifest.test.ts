import { API_SCHEMA_VERSION, type ApiManifest } from "../lib/api";
import {
  isSchemaSupported,
  shouldShowManifestBanner,
  shouldShowUpdateRequired,
} from "../lib/manifest";

function manifest(overrides: Partial<ApiManifest> = {}): ApiManifest {
  return {
    schemaVersion: 1,
    minSupportedSchemaVersion: 1,
    commentsApiBase: null,
    message: null,
    site: "https://patonsports.com",
    ...overrides,
  };
}

describe("manifest gating", () => {
  it("allows the feed when minSupportedSchemaVersion is at or below the app", () => {
    expect(isSchemaSupported(manifest({ minSupportedSchemaVersion: 1 }))).toBe(
      true
    );
    expect(
      isSchemaSupported(
        manifest({ minSupportedSchemaVersion: API_SCHEMA_VERSION })
      )
    ).toBe(true);
    expect(
      shouldShowUpdateRequired(
        manifest({ minSupportedSchemaVersion: API_SCHEMA_VERSION })
      )
    ).toBe(false);
  });

  it("requires an update when minSupportedSchemaVersion is above the app", () => {
    const blocked = manifest({
      minSupportedSchemaVersion: API_SCHEMA_VERSION + 1,
    });
    expect(isSchemaSupported(blocked)).toBe(false);
    expect(shouldShowUpdateRequired(blocked)).toBe(true);
  });

  it("shows a banner only when message is non-null and non-empty", () => {
    expect(shouldShowManifestBanner(manifest({ message: null }))).toBe(false);
    expect(shouldShowManifestBanner(manifest({ message: "   " }))).toBe(false);
    expect(
      shouldShowManifestBanner(manifest({ message: "Stadium Wi-Fi is down." }))
    ).toBe(true);
  });
});
