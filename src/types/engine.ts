/**
 * GC Holiday Builder — Engine Types (v2)
 *
 * Shared types used by the budget engine, catalogue loader, and UI.
 */

// ─── Catalogue types (from JSON) ──────────────────────────────────────────

export interface RegionData {
  name: string;
  slug: string;
  destinationId?: string;
  displayName?: string;
  heroTagline?: string;
  region: {
    city: string;
    state: string;
    country: string;
    currency: string;
    currencySymbol: string;
    description: string;
  };
  areas: AreaEntry[];
  areaDistances: Record<string, Record<string, number>>;
  transport: {
    flyingIn: {
      fromBrisbane: { driveMinutes: number; tollEstimate: number };
      fromCoolangatta: { driveMinutes: number; tollEstimate: number };
    };
    driving: { fuelPerKmEstimate: number; parkingNote: string };
    airportTransfer: { familyShuttle: string; rideShare: string };
  };
  supermarketChains: { chain: string; url: string }[];
  meta: { dataGenerated: string; priceAccuracyNote: string; disclaimer: string };
}

export interface AreaEntry {
  id: string;
  name: string;
  description: string;
}

export interface AccommodationEntry {
  id: string;
  name: string;
  area: string;
  url: string;
  pricePerNightFrom: number;
  priceBand: 'budget' | 'mid' | 'premium';
  features: string[];
  description: string;
  bedrooms: string[];
  sleepsMax: number;
  hasKitchen: boolean;
  bestFor: string;
  bestForFamilies: boolean;
}

export interface AccommodationData {
  meta: { lastVerified: string; note: string; count: number };
  properties: AccommodationEntry[];
}

export interface ActivityEntry {
  id: string;
  name: string;
  type: string;
  area: string;
  url: string;
  description: string;
  adultPrice: number;
  childPrice: number;
  familyOf4Total: number;
  durationHours: number;
  bestForAges: string;
  hasFreeParking: boolean;
  needsFullDay: boolean;
  note: string;
}

export interface ActivitiesData {
  meta: { lastVerified: string; note: string; count: number };
  attractions: ActivityEntry[];
}

export interface DiningEntry {
  id: string;
  name: string;
  area: string;
  priceBand: '$' | '$$' | '$$$';
  cuisine: string;
  notes: string;
  url: string;
}

export interface DiningData {
  meta: { lastVerified: string; note: string; count: number };
  venues: DiningEntry[];
}

export interface SupermarketEntry {
  id: string;
  chain: string;
  name: string;
  area: string;
  address: string;
  hours: string;
  notes: string;
}

export interface SupermarketData {
  meta: { lastVerified: string; note: string; count: number };
  stores: SupermarketEntry[];
}

export interface DestinationCatalogue {
  region: RegionData;
  accommodation: AccommodationData;
  activities: ActivitiesData;
  dining: DiningData;
  supermarkets: SupermarketData;
}

// ─── Seasons & Transport ──────────────────────────────────────────────────

export interface SeasonBand {
  id: string;
  label: string;
  accomMultiplier: number;
  activityMultiplier: number;
}

export interface SeasonCalendarEntry {
  from: string;
  to: string;
  band: string;
  reason: string;
}

export interface SeasonsData {
  generatedOn: string;
  notes: string[];
  bands: SeasonBand[];
  calendar: SeasonCalendarEntry[];
  defaultBand: string;
}

export interface TransportLegOption {
  mode: 'own-car' | 'train' | 'bus' | 'shuttle';
  costEstimate: number;
  perPerson?: boolean;
  kidDiscount?: number;
  durationMin: number;
  note: string;
}

export interface TransportLeg {
  from: string;
  to: string;
  distanceKm: number;
  options: TransportLegOption[];
}

export interface TransportLegsData {
  generatedOn: string;
  notes: string[];
  currency: string;
  legs: TransportLeg[];
}

// ─── Engine input / output types ──────────────────────────────────────────

export interface FamilyInput {
  /** Total holiday budget in AUD */
  totalBudget: number;
  /** Number of adults (13+) */
  adults: number;
  /** Number of children (0–12) */
  kids: number;
  /** Rough kid ages for filtering (optional) */
  kidAges?: number[];
  /** Number of nights staying */
  nights: number;
  /** Transport mode */
  transportMode: 'driving' | 'flying';
  /** Airport origin, relevant only for flying mode */
  fromAirport?: 'brisbane' | 'coolangatta';
  /** Area preference — area.id or 'no-preference' */
  areaPreference?: string;
  /** Required features */
  mustHaves?: string[];
  /** Activity interests */
  interests?: string[];
  /** Buffer % to set aside */
  bufferPercent?: number;
}

export interface TripLeg {
  destinationId: string;
  nights: number;
  /** Per-leg area filter */
  areaPreference?: string;
}

export interface BuilderInput extends FamilyInput {
  /** Multi-leg trip definition (overrides `nights` / `areaPreference` when present) */
  legs?: TripLeg[];
  /** Trip start date (ISO) — optional. When absent, default seasonal band is used. */
  startDate?: string;
  /** Override "now" for deterministic tests */
  baseDate?: string;
}

export interface TransportEstimate {
  mode: string;
  description: string;
  cost: number;
  breakdown: string[];
}

export interface ActivityAllocation {
  activity: ActivityEntry;
  cost: number;
  dayIndex: number;
  slot: number;
  reason: string;
}

export interface DayPlan {
  day: number;
  label: string;
  morning?: ActivityAllocation;
  afternoon?: ActivityAllocation;
}

export interface DiningGroup {
  tier: string;
  priceBand: '$' | '$$' | '$$$';
  venues: DiningEntry[];
}

export interface TransferBlock {
  from: string;
  to: string;
  mode: string;
  cost: number;
  durationMin: number;
  note: string;
}

export interface PackageLeg {
  destinationId: string;
  destinationDisplayName: string;
  accommodation: AccommodationEntry;
  accommodationCost: number;
  activities: ActivityAllocation[];
  activityCost: number;
  transport: TransportEstimate;
  dining: DiningGroup[];
  supermarkets: SupermarketEntry[];
  itinerary: DayPlan[];
}

export interface HolidayPackage {
  name: string;
  tagline: string;
  strategy: 'value' | 'fun' | 'relax';
  accommodation: AccommodationEntry;
  accommodationCost: number;
  activities: ActivityAllocation[];
  activityCost: number;
  transport: TransportEstimate;
  bufferAmount: number;
  bufferPercentActual: number;
  totalCost: number;
  remainingBudget: number;
  dining: DiningGroup[];
  supermarkets: SupermarketEntry[];
  itinerary: DayPlan[];
  warnings: string[];
  /** v2 — per-leg breakdown */
  legs?: PackageLeg[];
  /** v2 — inter-leg transfer */
  transfer?: TransferBlock;
}

export interface BudgetEngineResult {
  packages: HolidayPackage[];
  isFeasible: boolean;
  warnings: string[];
  generatedAt: string;
}
