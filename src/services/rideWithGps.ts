const RWGPS_HOST = "https://ridewithgps.com";
const DEFAULT_COLLECTION_ID = "4155269";
const CACHE_TTL_MS = 5 * 60 * 1000;
const ERROR_CACHE_TTL_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 10 * 1000;
const MAX_FALLBACK_ITEMS = 32;

type ItemType = "route" | "trip";
type JsonObject = Record<string, unknown>;

interface CollectionItemRef {
  id: string;
  type: ItemType;
}

interface TourStats {
  rideCount: number;
  distanceMiles: number;
  elevationFeet: number;
  distanceLabel: string;
  elevationLabel: string;
}

export interface TourBlogEntry {
  id: string;
  type: ItemType;
  title: string;
  url: string;
  summary: string | null;
  dateIso: string | null;
  dateLabel: string | null;
  location: string | null;
  distanceMiles: number | null;
  elevationFeet: number | null;
  distanceLabel: string | null;
  elevationLabel: string | null;
  imageUrl: string | null;
}

export interface TourBlogData {
  collectionId: string;
  collectionName: string;
  sourceUrl: string;
  fetchedAtIso: string;
  fetchedAtLabel: string;
  stats: TourStats;
  entries: TourBlogEntry[];
  errorMessage: string | null;
}

interface CacheEntry {
  collectionId: string;
  expiresAt: number;
  data: TourBlogData;
}

let cache: CacheEntry | null = null;

export async function getTourBlogData(): Promise<TourBlogData> {
  const collectionId =
    process.env.RIDE_WITH_GPS_COLLECTION_ID?.trim() || DEFAULT_COLLECTION_ID;
  const now = Date.now();

  if (
    cache &&
    cache.collectionId === collectionId &&
    cache.expiresAt > now
  ) {
    return cache.data;
  }

  const apiKey = process.env.RIDE_WITH_GPS_API_KEY?.trim();
  const authToken = process.env.RIDE_WITH_GPS_AUTH_TOKEN?.trim();
  const sourceUrl = `${RWGPS_HOST}/collections/${collectionId}`;
  const baseData = buildBaseData(collectionId, sourceUrl);

  if (!apiKey) {
    return updateCache(
      {
        ...baseData,
        errorMessage:
          "Set RIDE_WITH_GPS_API_KEY to load Ride with GPS tour data.",
      },
      ERROR_CACHE_TTL_MS
    );
  }

  try {
    const collectionPayload = await fetchCollectionPayload(
      collectionId,
      apiKey,
      authToken
    );

    if (collectionPayload) {
      const collectionName = extractCollectionName(collectionPayload);
      const entries = dedupeEntries(
        normalizeEntriesFromPayload(collectionPayload, undefined)
      );

      if (entries.length > 0) {
        const sortedEntries = sortEntries(entries);
        return updateCache({
          ...baseData,
          collectionName: collectionName || baseData.collectionName,
          entries: sortedEntries,
          stats: summarizeEntries(sortedEntries),
          errorMessage: null,
        });
      }
    }

    const fallbackRefs = await scrapeCollectionReferences(collectionId);
    if (fallbackRefs.length > 0) {
      const fallbackEntries = dedupeEntries(
        await fetchFallbackEntries(fallbackRefs, apiKey, authToken)
      );

      if (fallbackEntries.length > 0) {
        const sortedEntries = sortEntries(fallbackEntries);
        return updateCache({
          ...baseData,
          entries: sortedEntries,
          stats: summarizeEntries(sortedEntries),
          errorMessage: null,
        });
      }
    }

    return updateCache(
      {
        ...baseData,
        errorMessage: authToken
          ? "Ride data is unavailable. Verify your collection permissions and API credentials."
          : "Ride data is unavailable. Add RIDE_WITH_GPS_AUTH_TOKEN if your API account requires authenticated requests.",
      },
      ERROR_CACHE_TTL_MS
    );
  } catch {
    return updateCache(
      {
        ...baseData,
        errorMessage:
          "Ride data is temporarily unavailable. Please try again shortly.",
      },
      ERROR_CACHE_TTL_MS
    );
  }
}

function buildBaseData(collectionId: string, sourceUrl: string): TourBlogData {
  const fetchedAt = new Date();

  return {
    collectionId,
    collectionName: "Cross-Country Bicycle Tour",
    sourceUrl,
    fetchedAtIso: fetchedAt.toISOString(),
    fetchedAtLabel: formatDateTime(fetchedAt),
    stats: {
      rideCount: 0,
      distanceMiles: 0,
      elevationFeet: 0,
      distanceLabel: "0 mi",
      elevationLabel: "0 ft",
    },
    entries: [],
    errorMessage: null,
  };
}

function updateCache(data: TourBlogData, ttlMs = CACHE_TTL_MS): TourBlogData {
  cache = {
    collectionId: data.collectionId,
    expiresAt: Date.now() + ttlMs,
    data,
  };

  return data;
}

async function fetchCollectionPayload(
  collectionId: string,
  apiKey: string,
  authToken?: string
): Promise<unknown | null> {
  const endpoint = `${RWGPS_HOST}/api/v1/collections/${collectionId}.json`;
  const paramsToTry = buildAuthParamVariants(apiKey, authToken);

  for (const params of paramsToTry) {
    const payload = await fetchJson(endpoint, params);
    if (!payload || hasApiErrors(payload)) {
      continue;
    }

    return payload;
  }

  return null;
}

async function fetchFallbackEntries(
  refs: CollectionItemRef[],
  apiKey: string,
  authToken?: string
): Promise<TourBlogEntry[]> {
  const limitedRefs = refs.slice(0, MAX_FALLBACK_ITEMS);
  const results = await mapWithConcurrency(
    limitedRefs,
    6,
    async (itemRef): Promise<TourBlogEntry | null> => {
      const payload = await fetchItemPayload(itemRef, apiKey, authToken);
      if (!payload) {
        return null;
      }

      const normalized = normalizeEntriesFromPayload(payload, itemRef.type);
      return normalized[0] || null;
    }
  );

  return results.filter((entry): entry is TourBlogEntry => entry !== null);
}

async function fetchItemPayload(
  itemRef: CollectionItemRef,
  apiKey: string,
  authToken?: string
): Promise<unknown | null> {
  const endpoint = `${RWGPS_HOST}/api/v1/${itemRef.type}s/${itemRef.id}.json`;
  const paramsToTry = buildAuthParamVariants(apiKey, authToken);

  for (const params of paramsToTry) {
    const payload = await fetchJson(endpoint, params);
    if (!payload || hasApiErrors(payload)) {
      continue;
    }

    return payload;
  }

  return null;
}

async function fetchJson(
  url: string,
  params?: URLSearchParams
): Promise<unknown | null> {
  const requestUrl = new URL(url);
  if (params) {
    for (const [key, value] of params.entries()) {
      requestUrl.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();
    if (!text.trim()) {
      return null;
    }

    return JSON.parse(text) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildAuthParamVariants(
  apiKey: string,
  authToken?: string
): URLSearchParams[] {
  const variants: URLSearchParams[] = [];

  const apikeyParams = new URLSearchParams();
  apikeyParams.set("apikey", apiKey);
  if (authToken) {
    apikeyParams.set("auth_token", authToken);
  }
  variants.push(apikeyParams);

  const apiKeyParams = new URLSearchParams();
  apiKeyParams.set("api_key", apiKey);
  if (authToken) {
    apiKeyParams.set("auth_token", authToken);
  }
  variants.push(apiKeyParams);

  variants.push(new URLSearchParams());

  const deduped = new Map<string, URLSearchParams>();
  for (const params of variants) {
    deduped.set(params.toString(), params);
  }

  return Array.from(deduped.values());
}

function hasApiErrors(payload: unknown): boolean {
  const record = asRecord(payload);
  if (!record) {
    return false;
  }

  const results = asArray(record.results);
  if (!results) {
    return false;
  }

  return results.some((item) => {
    const resultRecord = asRecord(item);
    if (!resultRecord) {
      return false;
    }

    const errors = asArray(resultRecord.errors);
    return Boolean(errors && errors.length > 0);
  });
}

function extractCollectionName(payload: unknown): string | null {
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const value = queue.shift();
    if (value === undefined || visited.has(value)) {
      continue;
    }
    visited.add(value);

    const record = asRecord(value);
    if (!record) {
      continue;
    }

    if ("collection" in record) {
      const collectionRecord = asRecord(record.collection);
      const collectionName = collectionRecord
        ? pickString(collectionRecord, ["name", "title"])
        : null;
      if (collectionName) {
        return collectionName;
      }
    }

    const directName = pickString(record, ["collection_name"]);
    if (directName) {
      return directName;
    }

    for (const child of Object.values(record)) {
      if (child && typeof child === "object") {
        queue.push(child);
      }
    }
  }

  return null;
}

function normalizeEntriesFromPayload(
  payload: unknown,
  fallbackType?: ItemType
): TourBlogEntry[] {
  const candidates = findRideCandidates(payload);
  const normalized: TourBlogEntry[] = [];

  for (const candidate of candidates) {
    const entry = normalizeEntry(candidate, fallbackType);
    if (entry) {
      normalized.push(entry);
    }
  }

  return normalized;
}

function findRideCandidates(payload: unknown): JsonObject[] {
  const queue: Array<{ value: unknown; depth: number }> = [
    { value: payload, depth: 0 },
  ];
  const visited = new Set<unknown>();
  const candidates: JsonObject[] = [];
  const MAX_DEPTH = 6;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const { value, depth } = current;
    if (value === null || typeof value !== "object" || visited.has(value)) {
      continue;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      if (depth >= MAX_DEPTH) {
        continue;
      }

      for (const item of value) {
        queue.push({ value: item, depth: depth + 1 });
      }
      continue;
    }

    const record = value as JsonObject;
    if (looksLikeRide(record)) {
      candidates.push(record);
    }

    if (depth < MAX_DEPTH) {
      for (const child of Object.values(record)) {
        if (child && typeof child === "object") {
          queue.push({ value: child, depth: depth + 1 });
        }
      }
    }
  }

  return candidates;
}

function looksLikeRide(record: JsonObject): boolean {
  const hasId =
    pickString(record, ["id", "route_id", "trip_id"]) !== null ||
    pickNumber(record, ["id", "route_id", "trip_id"]) !== null;
  const hasSpecificId = "route_id" in record || "trip_id" in record;
  const hasName = pickString(record, ["name", "title"]) !== null;
  const hasDistance =
    pickNumber(record, [
      "distance",
      "distance_miles",
      "distance_in_miles",
      "distance_km",
      "distance_in_kilometers",
    ]) !== null;
  const rideUrl = pickString(record, [
    "url",
    "permalink",
    "route_url",
    "trip_url",
    "web_url",
    "canonical_url",
  ]);
  const hasRideUrl = Boolean(rideUrl && /\/(?:routes|trips)\//.test(rideUrl));
  const hasRideDate =
    pickString(record, [
      "departed_at",
      "started_at",
      "start_time",
      "completed_at",
      "ended_at",
      "finished_at",
    ]) !== null;

  const typeLabel = pickString(record, ["object_type", "type"]);
  const hasTypeLabel = Boolean(
    typeLabel &&
      (typeLabel.toLowerCase().includes("route") ||
        typeLabel.toLowerCase().includes("trip"))
  );
  const hasNonRideTypeLabel = Boolean(
    typeLabel &&
      !typeLabel.toLowerCase().includes("route") &&
      !typeLabel.toLowerCase().includes("trip")
  );

  if (hasNonRideTypeLabel) {
    return false;
  }

  return (
    hasSpecificId ||
    (hasId && hasName && (hasDistance || hasRideUrl || hasRideDate || hasTypeLabel)) ||
    (hasId && hasDistance) ||
    (hasName && hasDistance) ||
    hasRideUrl ||
    hasTypeLabel
  );
}

function normalizeEntry(
  record: JsonObject,
  fallbackType?: ItemType
): TourBlogEntry | null {
  const type = inferType(record, fallbackType);
  const id =
    pickString(record, [`${type}_id`, "id"]) ||
    idFromUrl(pickString(record, ["route_url", "trip_url", "url", "permalink"]));
  if (!id) {
    return null;
  }

  const title = pickString(record, ["name", "title"]) || `${toTitleCase(type)} ${id}`;

  const url = normalizeUrl(
    pickString(record, ["permalink", "url", "web_url", `${type}_url`]),
    type,
    id
  );

  const summary = normalizeSummary(
    pickString(record, [
      "description",
      "summary",
      "notes",
      "route_description",
      "trip_description",
    ])
  );

  const dateIso = toIsoString(
    pickString(record, [
      "departed_at",
      "started_at",
      "start_time",
      "completed_at",
      "ended_at",
      "finished_at",
      "created_at",
      "updated_at",
    ])
  );

  const distanceMiles = resolveDistanceMiles(record);
  const elevationFeet = resolveElevationFeet(record);

  return {
    id,
    type,
    title,
    url,
    summary,
    dateIso,
    dateLabel: dateIso ? formatDate(dateIso) : null,
    location: resolveLocation(record),
    distanceMiles,
    elevationFeet,
    distanceLabel: distanceMiles !== null ? `${distanceMiles.toFixed(1)} mi` : null,
    elevationLabel:
      elevationFeet !== null
        ? `${Math.round(elevationFeet).toLocaleString("en-US")} ft`
        : null,
    imageUrl: normalizeUrlOrNull(resolveImageUrl(record)),
  };
}

function inferType(record: JsonObject, fallbackType?: ItemType): ItemType {
  if (fallbackType) {
    return fallbackType;
  }

  const explicitType = pickString(record, ["type", "object_type"])?.toLowerCase();
  if (explicitType?.includes("trip")) {
    return "trip";
  }
  if (explicitType?.includes("route")) {
    return "route";
  }

  if (
    "trip_id" in record ||
    pickString(record, ["trip_url"]) !== null ||
    pickString(record, ["url"])?.includes("/trips/")
  ) {
    return "trip";
  }

  return "route";
}

function idFromUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const match = url.match(/\/(?:routes|trips)\/(\d+)/);
  const rideId = match?.[1];
  return rideId ?? null;
}

function normalizeSummary(summary: string | null): string | null {
  if (!summary) {
    return null;
  }

  const noHtml = summary.replace(/<[^>]+>/g, " ");
  const collapsed = noHtml.replace(/\s+/g, " ").trim();
  return collapsed || null;
}

function resolveDistanceMiles(record: JsonObject): number | null {
  const miles = pickNumber(record, [
    "distance_miles",
    "distance_in_miles",
    "distance_mi",
    "total_distance_miles",
  ]);
  if (miles !== null) {
    return round(miles, 1);
  }

  const kilometers = pickNumber(record, [
    "distance_km",
    "distance_in_kilometers",
    "total_distance_km",
  ]);
  if (kilometers !== null) {
    return round(kilometers * 0.621371, 1);
  }

  const meters = pickNumber(record, [
    "distance",
    "total_distance",
    "moving_distance",
  ]);
  if (meters !== null) {
    if (meters > 300) {
      return round(meters * 0.000621371, 1);
    }

    return round(meters, 1);
  }

  return null;
}

function resolveElevationFeet(record: JsonObject): number | null {
  const feet = pickNumber(record, [
    "elevation_gain_in_feet",
    "elevation_gain_feet",
    "total_ascent_feet",
    "elevation_feet",
  ]);
  if (feet !== null) {
    return round(feet, 0);
  }

  const meters = pickNumber(record, [
    "elevation_gain",
    "elevation_gain_meters",
    "total_ascent",
    "ascent",
  ]);
  if (meters !== null) {
    return round(meters * 3.28084, 0);
  }

  return null;
}

function resolveLocation(record: JsonObject): string | null {
  const rawLocation = pickString(record, ["location", "start_location"]);
  if (rawLocation) {
    return rawLocation;
  }

  const city = pickString(record, [
    "city",
    "locality",
    "start_city",
    "nearest_city",
  ]);
  const region = pickString(record, [
    "state",
    "administrative_area",
    "region",
    "province",
  ]);
  const country = pickString(record, ["country", "country_code"]);

  const pieces = [city, region, country].filter(
    (value): value is string => Boolean(value)
  );

  if (pieces.length === 0) {
    return null;
  }

  return Array.from(new Set(pieces)).join(", ");
}

function resolveImageUrl(record: JsonObject): string | null {
  const direct = pickString(record, [
    "map_image_url",
    "thumbnail_url",
    "preview_image_url",
    "cover_photo_url",
    "photo_url",
    "image_url",
  ]);
  if (direct) {
    return direct;
  }

  const coverPhotoUrls = asRecord(record.cover_photo_urls);
  if (coverPhotoUrls) {
    const nested = pickString(coverPhotoUrls, ["large", "medium", "small"]);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function normalizeUrl(url: string | null, type: ItemType, id: string): string {
  const normalized = normalizeUrlOrNull(url);
  if (normalized) {
    return normalized;
  }

  return `${RWGPS_HOST}/${type}s/${id}`;
}

function normalizeUrlOrNull(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${RWGPS_HOST}${url}`;
  }

  return `${RWGPS_HOST}/${url.replace(/^\/+/, "")}`;
}

function summarizeEntries(entries: TourBlogEntry[]): TourStats {
  const totalDistanceMiles = entries.reduce((sum, entry) => {
    return sum + (entry.distanceMiles || 0);
  }, 0);

  const totalElevationFeet = entries.reduce((sum, entry) => {
    return sum + (entry.elevationFeet || 0);
  }, 0);

  return {
    rideCount: entries.length,
    distanceMiles: round(totalDistanceMiles, 1),
    elevationFeet: round(totalElevationFeet, 0),
    distanceLabel: `${round(totalDistanceMiles, 1).toLocaleString("en-US")} mi`,
    elevationLabel: `${Math.round(totalElevationFeet).toLocaleString("en-US")} ft`,
  };
}

function sortEntries(entries: TourBlogEntry[]): TourBlogEntry[] {
  const sorted = [...entries];
  sorted.sort((a, b) => {
    const aDate = a.dateIso ? Date.parse(a.dateIso) : 0;
    const bDate = b.dateIso ? Date.parse(b.dateIso) : 0;

    if (aDate !== bDate) {
      return bDate - aDate;
    }

    const aId = Number(a.id);
    const bId = Number(b.id);
    if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
      return bId - aId;
    }

    return b.title.localeCompare(a.title);
  });

  return sorted;
}

function dedupeEntries(entries: TourBlogEntry[]): TourBlogEntry[] {
  const entryMap = new Map<string, TourBlogEntry>();

  for (const entry of entries) {
    const key = `${entry.type}:${entry.id}`;
    const existing = entryMap.get(key);
    if (!existing) {
      entryMap.set(key, entry);
      continue;
    }

    if (isHigherQualityEntry(entry, existing)) {
      entryMap.set(key, entry);
    }
  }

  return Array.from(entryMap.values());
}

function isHigherQualityEntry(a: TourBlogEntry, b: TourBlogEntry): boolean {
  const score = (entry: TourBlogEntry): number => {
    let value = 0;
    if (entry.summary) value += 1;
    if (entry.dateIso) value += 1;
    if (entry.distanceMiles !== null) value += 1;
    if (entry.elevationFeet !== null) value += 1;
    if (entry.location) value += 1;
    if (entry.imageUrl) value += 1;
    return value;
  };

  return score(a) > score(b);
}

async function scrapeCollectionReferences(
  collectionId: string
): Promise<CollectionItemRef[]> {
  const collectionUrl = `${RWGPS_HOST}/collections/${collectionId}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(collectionUrl, {
      headers: { Accept: "text/html" },
      signal: controller.signal,
    });
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const refs = new Map<string, CollectionItemRef>();

    const urlPattern = /\/(routes|trips)\/(\d+)/g;
    let urlMatch = urlPattern.exec(html);
    while (urlMatch !== null) {
      const type = urlMatch[1] === "trips" ? "trip" : "route";
      const id = urlMatch[2];
      if (!id) {
        urlMatch = urlPattern.exec(html);
        continue;
      }

      refs.set(`${type}:${id}`, { type, id });
      urlMatch = urlPattern.exec(html);
    }

    const idPattern = /\b(route|trip)_id["']?\s*[:=]\s*["']?(\d+)/g;
    let idMatch = idPattern.exec(html);
    while (idMatch !== null) {
      const type = idMatch[1] === "trip" ? "trip" : "route";
      const id = idMatch[2];
      if (!id) {
        idMatch = idPattern.exec(html);
        continue;
      }

      refs.set(`${type}:${id}`, { type, id });
      idMatch = idPattern.exec(html);
    }

    return Array.from(refs.values());
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= values.length) {
        return;
      }

      results[currentIndex] = await mapper(values[currentIndex]!);
    }
  }

  const workerCount = Math.min(Math.max(concurrency, 1), values.length);
  const workers: Promise<void>[] = [];

  for (let index = 0; index < workerCount; index += 1) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

function pickString(record: JsonObject, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return null;
}

function pickNumber(record: JsonObject, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/,/g, "").trim();
      if (!normalized) {
        continue;
      }

      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toIsoString(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function toTitleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function asRecord(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}
