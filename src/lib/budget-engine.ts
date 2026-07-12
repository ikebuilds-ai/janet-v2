#!/usr/bin/env node
/**
 * GC Holiday Builder — Budget Engine v2
 *
 * Multi-destination + seasonal pricing + transport legs.
 * Backward compatible: single-leg Gold Coast input produces
 * identical results to v1.
 *
 * Phase C / 5 — Budget Engine v2
 * Built: 2026-07-12 | Author: Eros (Erosium)
 */

// ═════════════════════════════════════════════════════════════════════════════
// ║  Types matching the JSON catalogue files                                 ║
// ═════════════════════════════════════════════════════════════════════════════

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
      fromCoolangatta?: { driveMinutes: number; tollEstimate: number };
      fromSunshineCoastAirport?: { driveMinutes: number; tollEstimate: number };
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

// ═════════════════════════════════════════════════════════════════════════════
// ║  V1 input / output types (kept for backward compatibility)               ║
// ═════════════════════════════════════════════════════════════════════════════

export interface FamilyInput {
  totalBudget: number;
  adults: number;
  kids: number;
  kidAges?: number[];
  nights: number;
  transportMode: 'driving' | 'flying';
  fromAirport?: 'brisbane' | 'coolangatta';
  areaPreference?: string;
  mustHaves?: string[];
  interests?: string[];
  bufferPercent?: number;
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
  legs?: PackageLeg[];
  transfer?: TransferBlock;
  seasonBand?: string;
  /** Alternative accommodation picks for this strategy (excludes the featured pick). */
  accommodationAlternatives?: AccommodationEntry[];
}

export interface BudgetEngineResult {
  packages: HolidayPackage[];
  isFeasible: boolean;
  warnings: string[];
  generatedAt: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  V2 new types                                                            ║
// ═════════════════════════════════════════════════════════════════════════════

export interface TripLeg {
  destinationId: string;
  nights: number;
  areaPreference?: string;
}

export interface BuilderInput {
  legs?: TripLeg[];
  startDate?: string;
  baseDate?: string;
  totalBudget: number;
  adults: number;
  kids: number;
  kidAges?: number[];
  transportMode: 'driving' | 'flying';
  fromAirport?: 'brisbane' | 'coolangatta';
  areaPreference?: string;
  mustHaves?: string[];
  interests?: string[];
  bufferPercent?: number;
  familyName?: string;
  nights?: number; // backward compat fallback
}

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
  distanceKm?: number;
  options: TransportLegOption[];
}

export interface TransportLegsData {
  generatedOn: string;
  notes: string[];
  currency: string;
  legs: TransportLeg[];
}

export interface PackageLeg {
  destinationId: string;
  accommodation: AccommodationEntry;
  accommodationCost: number;
  nights: number;
  days: number;
  dining: DiningGroup[];
  supermarkets: SupermarketEntry[];
  itinerary: DayPlan[];
  activities: ActivityAllocation[];
  activityCost: number;
  transport: TransportEstimate;
  accommodationAlternatives?: AccommodationEntry[];
}

export interface TransferBlock {
  from: string;
  to: string;
  mode: string;
  cost: number;
  durationMin: number;
  note: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Scoring constants                                                       ║
// ═════════════════════════════════════════════════════════════════════════════

const FUN_SCORES: Record<string, number> = {
  theme_park: 10, water_park: 9, adventure: 8, wildlife: 7,
  entertainment: 6, free: 3, shopping: 2,
};

const RELAX_SCORES: Record<string, number> = {
  free: 10, wildlife: 8, entertainment: 5, shopping: 4, adventure: 3,
  theme_park: 1, water_park: 1,
};

const VALUE_SCORES: Record<string, number> = {
  free: 10, entertainment: 6, wildlife: 5, shopping: 4, adventure: 3,
  theme_park: 2, water_park: 2,
};

const DINING_TIER_LABELS: Record<'$' | '$$' | '$$$', string> = {
  $: 'Quick & Affordable', $$: 'Family-Friendly Casual', $$$: 'Something Special',
};

// ═════════════════════════════════════════════════════════════════════════════
// ║  Season helpers                                                          ║
// ═════════════════════════════════════════════════════════════════════════════

function resolveBand(dateStr: string, seasons: SeasonsData): string {
  const date = new Date(dateStr + 'T00:00:00');
  for (const entry of seasons.calendar) {
    const from = new Date(entry.from + 'T00:00:00');
    const to = new Date(entry.to + 'T23:59:59');
    if (date >= from && date <= to) return entry.band;
  }
  return seasons.defaultBand;
}

function getSeasonMultiplier(bandId: string, seasons: SeasonsData): number {
  const band = seasons.bands.find((b) => b.id === bandId);
  return band?.accomMultiplier ?? 1.0;
}

function getSeasonMultipliers(
  startDate: string | undefined,
  nights: number,
  seasons: SeasonsData
): number[] {
  const multipliers: number[] = [];
  if (!startDate) {
    // No date = v1 behavior (no multiplier)
    return Array(nights).fill(1.0);
  }
  const start = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < nights; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const band = resolveBand(dateStr, seasons);
    multipliers.push(getSeasonMultiplier(band, seasons));
  }
  return multipliers;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Inter-leg transport helpers                                             ║
// ═════════════════════════════════════════════════════════════════════════════

function findTransportLeg(
  from: string,
  to: string,
  data: TransportLegsData
): TransportLeg | undefined {
  return data.legs.find(
    (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from)
  );
}

function computeTransportCost(
  option: TransportLegOption,
  adults: number,
  kids: number
): number {
  if (!option.perPerson) return Math.round(option.costEstimate);
  const kidDiscount = option.kidDiscount ?? 0.5;
  return Math.round((adults + kids * kidDiscount) * option.costEstimate);
}

function selectTransportOption(
  options: TransportLegOption[],
  strategy: 'value' | 'fun' | 'relax'
): TransportLegOption {
  if (strategy === 'value') {
    return [...options].sort((a, b) => a.costEstimate - b.costEstimate)[0];
  }
  // Fun / Relax: prefer own-car if available
  const ownCar = options.find((o) => o.mode === 'own-car');
  if (ownCar) return ownCar;
  return [...options].sort((a, b) => a.costEstimate - b.costEstimate)[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Accommodation helpers                                                   ║
// ═════════════════════════════════════════════════════════════════════════════

function filterAccommodation(
  props: AccommodationEntry[],
  totalPeople: number,
  areaPref: string | undefined,
  mustHaves: string[]
): AccommodationEntry[] {
  return props.filter((p) => {
    if (p.sleepsMax < totalPeople) return false;
    if (areaPref && areaPref !== 'no-preference' && p.area !== areaPref) return false;
    return mustHaves.every((f) => p.features.includes(f));
  });
}

function sortAccommodation(
  props: AccommodationEntry[],
  strategy: 'value' | 'fun' | 'relax'
): AccommodationEntry[] {
  const copy = [...props];
  switch (strategy) {
    case 'value':
      return copy.sort((a, b) => a.pricePerNightFrom - b.pricePerNightFrom);
    case 'fun':
      return copy.sort((a, b) => {
        const bandScore = { budget: 1, mid: 3, premium: 3 };
        const funFeatures = (p: AccommodationEntry) =>
          (p.features.includes('waterslides') ? 3 : 0) +
          (p.features.includes('pool') ? 2 : 0) +
          (p.features.includes('kidsClub') ? 2 : 0);
        const aScore =
          (bandScore[a.priceBand] ?? 1) +
          (a.bestForFamilies ? 2 : 0) +
          funFeatures(a);
        const bScore =
          (bandScore[b.priceBand] ?? 1) +
          (b.bestForFamilies ? 2 : 0) +
          funFeatures(b);
        // Higher score first; ties broken toward the BETTER property (more expensive)
        return bScore - aScore || b.pricePerNightFrom - a.pricePerNightFrom;
      });
    case 'relax':
      return copy.sort((a, b) => {
        const bandScore = { premium: 3, mid: 2, budget: 1 };
        const aScore =
          (bandScore[a.priceBand] ?? 1) +
          (a.features.includes('pool') ? 2 : 0) +
          (a.features.includes('beachfront') ? 3 : 0) +
          (a.features.includes('kitchen') ? 1 : 0);
        const bScore =
          (bandScore[b.priceBand] ?? 1) +
          (b.features.includes('pool') ? 2 : 0) +
          (b.features.includes('beachfront') ? 3 : 0) +
          (b.features.includes('kitchen') ? 1 : 0);
        return bScore - aScore || b.pricePerNightFrom - a.pricePerNightFrom;
      });
  }
}

function pickCheapest(props: AccommodationEntry[]): AccommodationEntry {
  return [...props].sort((a, b) => a.pricePerNightFrom - b.pricePerNightFrom)[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Transport estimate helpers                                              ║
// ═════════════════════════════════════════════════════════════════════════════

function getDistance(region: RegionData, areaA: string, areaB: string): number {
  if (areaA === areaB) return 0;
  return (
    region.areaDistances[areaA]?.[areaB] ??
    region.areaDistances[areaB]?.[areaA] ??
    50
  );
}

function estimateTransport(
  input: FamilyInput,
  region: RegionData,
  acc: AccommodationEntry
): TransportEstimate {
  if (input.transportMode === 'flying') {
    const airport = input.fromAirport ?? 'coolangatta';
    const arrivalArea = acc.area;
    const nearAirport =
      airport === 'coolangatta' &&
      (arrivalArea === 'coolangatta' || getDistance(region, 'coolangatta', arrivalArea) <= 15);
    const nearBrisbane =
      airport === 'brisbane' &&
      (arrivalArea === 'surfers-paradise' ||
        arrivalArea === 'main-beach' ||
        arrivalArea === 'southport');

    if (nearAirport) {
      return {
        mode: 'flying',
        description: 'Airport transfer (Coolangatta)',
        cost: 60,
        breakdown: [
          'Return family shuttle from Coolangatta Airport',
          'Short trip — accommodation near airport',
        ],
      };
    }
    if (nearBrisbane) {
      return {
        mode: 'flying',
        description: `Airport transfer (Brisbane + ${acc.area})`,
        cost: 120,
        breakdown: [
          'Return family shuttle from Brisbane Airport',
          `~${region.transport.flyingIn.fromBrisbane.driveMinutes} min drive`,
          '$10 in tolls',
        ],
      };
    }
    return {
      mode: 'flying',
      description: 'Airport transfer (Coolangatta)',
      cost: 100,
      breakdown: [
        'Estimated return family shuttle from Coolangatta Airport',
        'Approx. $80–120 for a family of 4',
      ],
    };
  }

  const localKmPerDay = 30;
  const totalLocalKm = localKmPerDay * input.nights;
  const fuelCost = Math.round(totalLocalKm * region.transport.driving.fuelPerKmEstimate);
  const parkingPerDay = acc.features.includes('parking') ? 0 : 10;
  const parkingTotal = parkingPerDay * input.nights;
  const drivingTotal = fuelCost + parkingTotal;

  return {
    mode: 'driving',
    description: 'Local driving (fuel + parking)',
    cost: drivingTotal,
    breakdown: [
      `~${totalLocalKm} km local driving @ $${region.transport.driving.fuelPerKmEstimate}/km = $${fuelCost}`,
      acc.features.includes('parking')
        ? 'Free parking included at accommodation'
        : `Parking ~$${parkingPerDay}/day × ${input.nights} nights = $${parkingTotal}`,
      `Total local transport: $${drivingTotal}`,
    ],
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Activity helpers                                                        ║
// ═════════════════════════════════════════════════════════════════════════════

function activityCostForFamily(
  activity: ActivityEntry,
  adults: number,
  kids: number
): number {
  if (activity.type === 'free' || activity.familyOf4Total === 0) return 0;
  if (adults === 2 && kids === 2 && activity.familyOf4Total > 0) {
    return activity.familyOf4Total;
  }
  return adults * activity.adultPrice + kids * activity.childPrice;
}

function allocateActivities(
  input: FamilyInput,
  activities: ActivityEntry[],
  strategy: 'value' | 'fun' | 'relax',
  budgetRemaining: number,
  days: number,
  accArea: string,
  interests: string[] | undefined,
  warnings: string[],
  dayOffset: number = 0
): ActivityAllocation[] {
  if (budgetRemaining <= 0) {
    warnings.push(
      'No budget remaining for activities after accommodation and transport.'
    );
    return [];
  }

  let candidates = activities.filter((act) => {
    if (!interests) return true;
    return interests.some((i) => act.type === i);
  });

  if (candidates.length === 0 && interests && interests.length > 0) {
    candidates = [...activities];
    warnings.push(
      'No activities match your selected interests — showing all available activities.'
    );
  }

  const scored = candidates.map((act) => {
    const cost = activityCostForFamily(act, input.adults, input.kids);
    const scoreMap =
      strategy === 'value' ? VALUE_SCORES : strategy === 'fun' ? FUN_SCORES : RELAX_SCORES;
    const baseScore = scoreMap[act.type] ?? 5;
    const proximityBonus = act.area === accArea ? 2 : 0;
    const freeBonus = strategy === 'value' && cost === 0 ? 5 : 0;
    const durationFactor =
      strategy === 'relax'
        ? act.needsFullDay
          ? -5
          : act.durationHours <= 2
            ? 3
            : 0
        : 0;
    return { activity: act, cost, score: baseScore + proximityBonus + freeBonus + durationFactor };
  });

  switch (strategy) {
    case 'value':
      scored.sort((a, b) => {
        if (a.cost === 0 && b.cost > 0) return -1;
        if (b.cost === 0 && a.cost > 0) return 1;
        const effA = a.cost / Math.max(1, a.activity.durationHours);
        const effB = b.cost / Math.max(1, b.activity.durationHours);
        return effA - effB || a.cost - b.cost;
      });
      break;
    case 'fun':
      scored.sort((a, b) => b.score - a.score || b.cost - a.cost);
      break;
    case 'relax':
      scored.sort((a, b) => b.score - a.score || a.cost - b.cost);
      break;
  }

  const allocations: ActivityAllocation[] = [];
  let remainingBudget = budgetRemaining;
  const daySlots: Array<[number, number]> = [];
  for (let d = 0; d < days; d++) {
    daySlots.push([d, 0], [d, 1]);
  }
  let slotIndex = 0;
  let fullDayCount = 0;

  for (const item of scored) {
    if (remainingBudget < 0) break;
    if (slotIndex >= daySlots.length) break;
    if (item.cost > remainingBudget && item.cost > 0) continue;
    if (days === 1 && item.activity.needsFullDay && fullDayCount >= 1) continue;
    if (item.activity.needsFullDay) {
      if (fullDayCount >= days) continue;
      fullDayCount++;
    }
    if (allocations.some((a) => a.activity.id === item.activity.id)) continue;

    const [day, slot] = daySlots[slotIndex];
    const cost = item.cost;
    if (cost > 0 && cost > remainingBudget) continue;

    allocations.push({
      activity: item.activity,
      cost,
      dayIndex: day + dayOffset,
      slot,
      reason: strategyReason(strategy, item.activity, item.score),
    });
    remainingBudget -= cost;
    if (item.activity.needsFullDay) slotIndex += 2;
    else slotIndex += 1;
  }

  if (allocations.length === 0 && budgetRemaining > 0 && scored.length > 0) {
    const cheapest = scored.filter((s) => s.cost <= budgetRemaining);
    if (cheapest.length > 0) {
      const pick = cheapest[0];
      allocations.push({
        activity: pick.activity,
        cost: pick.cost,
        dayIndex: dayOffset,
        slot: 0,
        reason: `Only activity fitting within remaining budget ($${budgetAmount})`,
      });
    }
  }

  if (allocations.length === 0 && scored.length > 0) {
    warnings.push(
      'No activities fit within your budget after accommodation and transport. Consider a higher budget, fewer nights, or cheaper accommodation.'
    );
  }

  return allocations;
}

// ─── Itinerary builder ─────────────────────────────────────────────────────

function buildItinerary(
  nights: number,
  allocations: ActivityAllocation[],
  dayOffset: number = 0
): DayPlan[] {
  const days: DayPlan[] = [];
  for (let d = 0; d < nights; d++) {
    const dayLabel =
      d === 0
        ? 'Day ' + (dayOffset + d + 1) + (dayOffset === 0 ? ' (Arrival)' : '')
        : d === nights - 1 && nights > 1
          ? `Day ${dayOffset + d + 1} (Last Full Day)`
          : `Day ${dayOffset + d + 1}`;
    const morning = allocations.find((a) => a.dayIndex === dayOffset + d && a.slot === 0);
    const afternoon = allocations.find((a) => a.dayIndex === dayOffset + d && a.slot === 1);
    days.push({ day: dayOffset + d + 1, label: dayLabel, morning, afternoon });
  }
  return days;
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Dining / Supermarket helpers                                            ║
// ═════════════════════════════════════════════════════════════════════════════

function groupDining(dining: DiningEntry[], area: string): DiningGroup[] {
  const nearby = dining
    .filter((v) => v.area === area)
    .sort((a, b) => {
      const order = { $: 0, $$: 1, $$$: 2 };
      return (order[a.priceBand] ?? 0) - (order[b.priceBand] ?? 0);
    });
  const groups: DiningGroup[] = [];
  for (const tier of ['$', '$$', '$$$'] as const) {
    const venues = nearby.filter((v) => v.priceBand === tier);
    if (venues.length > 0) {
      groups.push({ tier: DINING_TIER_LABELS[tier], priceBand: tier, venues });
    }
  }
  return groups;
}

function groupSupermarkets(
  supermarkets: SupermarketEntry[],
  area: string
): SupermarketEntry[] {
  return supermarkets
    .filter((s) => s.area === area)
    .sort((a, b) => {
      const chainOrder: Record<string, number> = {
        Woolworths: 0, Coles: 1, ALDI: 2, IGA: 3, FoodWorks: 4, SPAR: 5,
      };
      return (chainOrder[a.chain] ?? 9) - (chainOrder[b.chain] ?? 9);
    });
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Informational / fallback package                                        ║
// ═════════════════════════════════════════════════════════════════════════════

function buildInfoPackage(
  input: FamilyInput,
  catalogue: {
    region: RegionData;
    accommodation: AccommodationData;
    activities: ActivitiesData;
    dining: DiningData;
    supermarkets: SupermarketData;
  },
  bufferPct: number,
  warnings: string[],
  seasonMultipliers?: number[]
): HolidayPackage {
  const cheapestProp = [...catalogue.accommodation.properties].sort(
    (a, b) => a.pricePerNightFrom - b.pricePerNightFrom
  )[0];

  let accCost: number;
  if (seasonMultipliers && seasonMultipliers.length > 0) {
    accCost = Math.round(
      seasonMultipliers.reduce((sum, m) => sum + cheapestProp.pricePerNightFrom * m, 0)
    );
  } else {
    accCost = cheapestProp.pricePerNightFrom * input.nights;
  }

  const transport = estimateTransport(input, catalogue.region, cheapestProp);
  const totalCost = accCost + transport.cost;
  const bufferAmount = Math.max(0, input.totalBudget - totalCost);

  return {
    name: 'Informational (insufficient budget)',
    tagline: 'We could not build a package within your budget — see suggestions',
    strategy: 'value',
    accommodation: cheapestProp,
    accommodationCost: accCost,
    activities: [],
    activityCost: 0,
    transport,
    bufferAmount,
    bufferPercentActual:
      bufferAmount >= 0 ? Math.round((bufferAmount / input.totalBudget) * 100) : 0,
    totalCost,
    remainingBudget: bufferAmount,
    dining: groupDining(catalogue.dining.venues, cheapestProp.area),
    supermarkets: groupSupermarkets(
      catalogue.supermarkets.stores,
      cheapestProp.area
    ),
    itinerary: buildItinerary(input.nights, []),
    warnings,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Core single-destination package builder (used by v1 & v2)               ║
// ═════════════════════════════════════════════════════════════════════════════

interface DestinationCatalogue {
  region: RegionData;
  accommodation: AccommodationData;
  activities: ActivitiesData;
  dining: DiningData;
  supermarkets: SupermarketData;
}

function buildSingleDestinationPackage(
  cat: DestinationCatalogue,
  input: FamilyInput,
  fittingProps: AccommodationEntry[],
  strategy: 'value' | 'fun' | 'relax',
  bufferPct: number,
  seasonMultipliers?: number[]
): HolidayPackage {
  const totalPeople = input.adults + input.kids;
  const effectiveBudget = Math.floor(input.totalBudget * (1 - bufferPct / 100));
  const days = input.nights;
  const pkgWarnings: string[] = [];

  function getAccomCost(prop: AccommodationEntry): number {
    if (seasonMultipliers && seasonMultipliers.length > 0) {
      return Math.round(
        seasonMultipliers.reduce((sum, m) => sum + prop.pricePerNightFrom * m, 0)
      );
    }
    return prop.pricePerNightFrom * input.nights;
  }

  const sortedProps = sortAccommodation(fittingProps, strategy);
  let pickedAccom = sortedProps[0];
  let accCost = getAccomCost(pickedAccom);

  const maxFraction = strategy === 'relax' ? 0.70 : strategy === 'fun' ? 0.55 : 0.40;
  if (strategy === 'value') {
    // Best Value: cheapest suitable, as before
    for (const prop of sortedProps) {
      const cost = getAccomCost(prop);
      if (cost <= effectiveBudget * maxFraction) {
        pickedAccom = prop;
        accCost = cost;
        break;
      }
    }
  } else {
    // Fun/Relax: spend up — among properties that fit the budget cap, take the
    // highest-ranked (sort order is score-first, price-desc). This makes bigger
    // budgets unlock better properties instead of defaulting to cheap ones.
    const cap = effectiveBudget * maxFraction;
    const fitting = sortedProps.filter((p) => getAccomCost(p) <= cap);
    if (fitting.length > 0) {
      pickedAccom = fitting[0];
      accCost = getAccomCost(pickedAccom);
    } else {
      // Nothing fits the cap — fall back to cheapest suitable
      pickedAccom = pickCheapest(fittingProps);
      accCost = getAccomCost(pickedAccom);
    }
  }

  if (accCost > effectiveBudget * 0.9) {
    pickedAccom = pickCheapest(fittingProps);
    accCost = getAccomCost(pickedAccom);
    if (accCost > effectiveBudget) {
      pkgWarnings.push(
        `Cheapest suitable accommodation (${pickedAccom.name} at $${pickedAccom.pricePerNightFrom}/night) consumes most of your budget. ${strategyLabel(strategy)} package may have few activities.`
      );
    }
  }

  // Alternative picks: next-best properties for this strategy that still fit
  // the budget cap (fall back to nearest-priced if fewer than 4 fit).
  const altCap = effectiveBudget * (strategy === 'value' ? 0.55 : maxFraction * 1.15);
  const alternatives = sortedProps
    .filter((p) => p.id !== pickedAccom.id && getAccomCost(p) <= altCap)
    .slice(0, 4);
  if (alternatives.length < 4) {
    const seen = new Set([pickedAccom.id, ...alternatives.map((a) => a.id)]);
    for (const p of sortedProps) {
      if (alternatives.length >= 4) break;
      if (!seen.has(p.id)) {
        alternatives.push(p);
        seen.add(p.id);
      }
    }
  }

  const transport = estimateTransport(input, cat.region, pickedAccom);

  const activityBudgetTarget = effectiveBudget - accCost - transport.cost;
  const interests =
    input.interests && input.interests.length > 0 ? input.interests : undefined;

  const allocations = allocateActivities(
    input,
    cat.activities.attractions,
    strategy,
    activityBudgetTarget,
    days,
    pickedAccom.area,
    interests,
    pkgWarnings
  );
  const activityCost = allocations.reduce((sum, a) => sum + a.cost, 0);

  const totalCost = accCost + transport.cost + activityCost;
  const bufferAmount = input.totalBudget - totalCost;
  const bufferPercentActual =
    bufferAmount >= 0 ? Math.round((bufferAmount / input.totalBudget) * 100) : 0;

  const itinerary = buildItinerary(input.nights, allocations);
  const dining = groupDining(cat.dining.venues, pickedAccom.area);
  const supermarkets = groupSupermarkets(
    cat.supermarkets.stores,
    pickedAccom.area
  );

  return {
    name: strategyName(strategy),
    tagline: strategyTagline(strategy),
    strategy,
    accommodation: pickedAccom,
    accommodationCost: accCost,
    activities: allocations,
    activityCost,
    transport,
    bufferAmount: Math.max(0, bufferAmount),
    bufferPercentActual: Math.max(0, bufferPercentActual),
    totalCost: Math.max(0, totalCost),
    remainingBudget: Math.max(0, bufferAmount),
    dining,
    supermarkets,
    itinerary,
    warnings: pkgWarnings,
    accommodationAlternatives: alternatives,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  V1 orchestration                                                        ║
// ═════════════════════════════════════════════════════════════════════════════

function buildPackagesV1(
  input: FamilyInput,
  cat: DestinationCatalogue
): BudgetEngineResult {
  const warnings: string[] = [];

  if (input.totalBudget <= 0) warnings.push('Budget must be greater than $0.');
  if (input.nights <= 0) warnings.push('Nights must be at least 1.');
  if (input.adults + input.kids <= 0) warnings.push('At least one person required.');

  const totalPeople = input.adults + input.kids;
  const bufferPct = clamp(input.bufferPercent ?? 10, 0, 50);

  const mustHaves = input.mustHaves ?? [];
  const areaPref =
    input.areaPreference && input.areaPreference !== 'no-preference'
      ? input.areaPreference
      : undefined;

  const fittingProps = filterAccommodation(
    cat.accommodation.properties,
    totalPeople,
    areaPref,
    mustHaves
  );

  if (fittingProps.length === 0) {
    const fallback = [...cat.accommodation.properties].sort(
      (a, b) => a.pricePerNightFrom - b.pricePerNightFrom
    );
    warnings.push(
      `No accommodation found that fits ${totalPeople} people${
        areaPref ? ` in ${areaPref}` : ''
      }${
        mustHaves.length > 0 ? ` with features: ${mustHaves.join(', ')}` : ''
      }. Try relaxing filters.`
    );
    const infoPkg = buildInfoPackage(input, cat, bufferPct, warnings);
    return {
      packages: [infoPkg, infoPkg, infoPkg],
      isFeasible: false,
      warnings,
      generatedAt: '', // filled by BudgetEngine wrapper
    };
  }

  const packages: HolidayPackage[] = [];
  const strategies: Array<'value' | 'fun' | 'relax'> = ['value', 'fun', 'relax'];

  for (const strategy of strategies) {
    try {
      packages.push(
        buildSingleDestinationPackage(cat, input, fittingProps, strategy, bufferPct)
      );
    } catch (e) {
      const cheapest = [...fittingProps].sort(
        (a, b) => a.pricePerNightFrom - b.pricePerNightFrom
      );
      packages.push(
        buildSingleDestinationPackage(cat, input, cheapest, 'value', bufferPct)
      );
    }
  }

  const isFeasible = packages.some((p) => p.totalCost <= input.totalBudget);

  return {
    packages,
    isFeasible,
    warnings,
    generatedAt: '',
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  BudgetEngine class (v1 public API + v2 extension)                       ║
// ═════════════════════════════════════════════════════════════════════════════

export class BudgetEngine {
  private cat: DestinationCatalogue;
  private seasonsData?: SeasonsData;
  private transportLegsData?: TransportLegsData;
  private catalogueMap?: Record<
    string,
    {
      region: RegionData;
      accommodation: AccommodationData;
      activities: ActivitiesData;
      dining: DiningData;
      supermarkets: SupermarketData;
    }
  >;

  /** Resolve the catalogue for a destination; falls back to the primary catalogue. */
  private resolveCat(destinationId: string) {
    return this.catalogueMap?.[destinationId] ?? this.cat;
  }

  constructor(
    catalogue: {
      region: RegionData;
      accommodation: AccommodationData;
      activities: ActivitiesData;
      dining: DiningData;
      supermarkets: SupermarketData;
    },
    seasons?: SeasonsData,
    transportLegs?: TransportLegsData,
    catalogueMap?: Record<
      string,
      {
        region: RegionData;
        accommodation: AccommodationData;
        activities: ActivitiesData;
        dining: DiningData;
        supermarkets: SupermarketData;
      }
    >
  ) {
    this.catalogueMap = catalogueMap;
    this.cat = {
      region: catalogue.region,
      accommodation: catalogue.accommodation,
      activities: catalogue.activities,
      dining: catalogue.dining,
      supermarkets: catalogue.supermarkets,
    };
    this.seasonsData = seasons;
    this.transportLegsData = transportLegs;
  }

  /** V1 API — exact backward-compatible path. */
  buildPackages(input: FamilyInput): BudgetEngineResult {
    const result = buildPackagesV1(input, this.cat);
    result.generatedAt = this.makeGeneratedAt(input as BuilderInput);
    return result;
  }

  /** V2 API — multi-leg + seasonal + transport. */
  buildPackagesV2(input: BuilderInput): BudgetEngineResult {
    const warnings: string[] = [];

    // Normalise legs
    let legs: TripLeg[] = input.legs ?? [
      { destinationId: 'gold-coast', nights: input.nights ?? 1 },
    ];

    // Cap at 2 legs
    if (legs.length > 2) {
      warnings.push('Maximum 2 destinations supported in this version.');
      legs = legs.slice(0, 2);
    }

    const totalNights = legs.reduce((s, l) => s + l.nights, 0);
    if (totalNights <= 0) warnings.push('Total nights must be at least 1.');
    if (input.totalBudget <= 0) warnings.push('Budget must be greater than $0.');
    if (input.adults + input.kids <= 0) warnings.push('At least one person required.');

    const bufferPct = clamp(input.bufferPercent ?? 10, 0, 50);
    const effectiveBudget = Math.floor(input.totalBudget * (1 - bufferPct / 100));

    // Single leg => exact v1 path (preserves backward compat)
    if (legs.length === 1) {
      const v1Input: FamilyInput = {
        totalBudget: input.totalBudget,
        adults: input.adults,
        kids: input.kids,
        kidAges: input.kidAges,
        nights: legs[0].nights,
        transportMode: input.transportMode,
        fromAirport: input.fromAirport,
        areaPreference:
          legs[0].areaPreference ??
          (input.areaPreference && input.areaPreference !== 'no-preference'
            ? input.areaPreference
            : undefined),
        mustHaves: input.mustHaves,
        interests: input.interests,
        bufferPercent: input.bufferPercent,
      };
      const result = buildPackagesV1(
        v1Input,
        this.resolveCat(legs[0].destinationId)
      );
      result.generatedAt = this.makeGeneratedAt(input);

      // Add season band label when seasons loaded
      if (this.seasonsData && input.startDate) {
        const band = resolveBand(input.startDate, this.seasonsData);
        const mult = getSeasonMultiplier(band, this.seasonsData);
        result.packages.forEach((p) => {
          p.seasonBand = `${band} season (×${mult.toFixed(2)})`;
        });
      } else if (this.seasonsData) {
        result.packages.forEach((p) => {
          p.seasonBand = 'No date selected — mid-season estimates';
        });
        if (!result.warnings.some((w) => w.includes('mid-season'))) {
          result.warnings.push(
            'Prices are mid-season estimates — pick your dates for a sharper number.'
          );
        }
      }

      // Map to v2 leg structure for tests that expect it
      result.packages.forEach((pkg) => {
        pkg.legs = [
          {
            destinationId: legs[0].destinationId,
            accommodation: pkg.accommodation,
            accommodationCost: pkg.accommodationCost,
            nights: legs[0].nights,
            days: legs[0].nights,
            dining: pkg.dining,
            supermarkets: pkg.supermarkets,
            itinerary: pkg.itinerary,
            activities: pkg.activities,
            activityCost: pkg.activityCost,
            transport: pkg.transport,
          },
        ];
      });

      return result;
    }

    // ── Two legs ──────────────────────────────────────────────────────────

    const dest1 = legs[0].destinationId;
    const dest2 = legs[1].destinationId;

    // Inter-leg transport
    let transferBlock: TransferBlock | undefined;
    let transferCost = 0;

    if (this.transportLegsData) {
      const legPair = findTransportLeg(dest1, dest2, this.transportLegsData);
      if (legPair) {
        // Strategy-specific selection: all strategies get own-car for simplicity
        // since tests expect own-car for fun and cheapest for value.
        // We compute per-strategy later; for budget split we use cheapest.
        const cheapestOption = [...legPair.options].sort(
          (a, b) => a.costEstimate - b.costEstimate
        )[0];
        transferCost = computeTransportCost(
          cheapestOption,
          input.adults,
          input.kids
        );
        transferBlock = {
          from: legPair.from,
          to: legPair.to,
          mode: cheapestOption.mode,
          cost: transferCost,
          durationMin: cheapestOption.durationMin,
          note: cheapestOption.note,
        };
      } else {
        warnings.push(`No transport data between ${dest1} and ${dest2}.`);
      }
    }

    const budgetAfterTransfer = Math.max(0, effectiveBudget - transferCost);

    const strategies: Array<'value' | 'fun' | 'relax'> = ['value', 'fun', 'relax'];
    const packages = strategies.map((strategy) => {
      // Select strategy-specific transport option
      let strategyTransfer: TransferBlock | undefined;
      let strategyTransferCost = 0;
      if (this.transportLegsData) {
        const legPair = findTransportLeg(dest1, dest2, this.transportLegsData);
        if (legPair) {
          const option = selectTransportOption(legPair.options, strategy);
          strategyTransferCost = computeTransportCost(
            option,
            input.adults,
            input.kids
          );
          strategyTransfer = {
            from: legPair.from,
            to: legPair.to,
            mode: option.mode,
            cost: strategyTransferCost,
            durationMin: option.durationMin,
            note: option.note,
          };
        }
      }

      const strategyBudgetAfterTransfer = Math.max(
        0,
        effectiveBudget - strategyTransferCost
      );

      const legPackages: PackageLeg[] = [];
      const allActivities: ActivityAllocation[] = [];
      let totalAccomCost = 0;
      let totalActivityCost = 0;
      let totalLocalTransport = 0;
      let globalDayOffset = 0;

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const legBudget = Math.floor(
          strategyBudgetAfterTransfer * (leg.nights / totalNights)
        );

        const legStartDate = input.startDate
          ? addDays(
              input.startDate,
              legs.slice(0, i).reduce((s, l) => s + l.nights, 0)
            )
          : undefined;

        const seasonMultipliers = this.seasonsData
          ? getSeasonMultipliers(legStartDate, leg.nights, this.seasonsData)
          : undefined;

        // Resolve the catalogue for this leg's destination
        const cat = this.resolveCat(leg.destinationId);
        const v1Input: FamilyInput = {
          totalBudget: legBudget,
          adults: input.adults,
          kids: input.kids,
          kidAges: input.kidAges,
          nights: leg.nights,
          transportMode: 'driving',
          areaPreference:
            leg.areaPreference ??
            (input.areaPreference && input.areaPreference !== 'no-preference'
              ? input.areaPreference
              : undefined),
          mustHaves: input.mustHaves,
          interests: input.interests,
          bufferPercent: 0,
        };

        const totalPeople = input.adults + input.kids;
        const mustHaves = v1Input.mustHaves ?? [];
        const areaPref =
          v1Input.areaPreference && v1Input.areaPreference !== 'no-preference'
            ? v1Input.areaPreference
            : undefined;

        let fittingProps = filterAccommodation(
          cat.accommodation.properties,
          totalPeople,
          areaPref,
          mustHaves
        );

        if (fittingProps.length === 0) {
          const fallback = [...cat.accommodation.properties].sort(
            (a, b) => a.pricePerNightFrom - b.pricePerNightFrom
          );
          const infoPkg = buildInfoPackage(
            v1Input,
            cat,
            0,
            [`No accommodation fits ${totalPeople} people for ${leg.destinationId}.`],
            seasonMultipliers
          );
          legPackages.push({
            destinationId: leg.destinationId,
            accommodation: infoPkg.accommodation,
            accommodationCost: infoPkg.accommodationCost,
            nights: leg.nights,
            days: leg.nights,
            dining: infoPkg.dining,
            supermarkets: infoPkg.supermarkets,
            itinerary: infoPkg.itinerary,
            activities: infoPkg.activities,
            activityCost: infoPkg.activityCost,
            transport: infoPkg.transport,
          });
          totalAccomCost += infoPkg.accommodationCost;
          totalLocalTransport += infoPkg.transport.cost;
          continue;
        }

        const legPkg = buildSingleDestinationPackage(
          cat,
          v1Input,
          fittingProps,
          strategy,
          0,
          seasonMultipliers
        );

        // Offset itinerary days for merged output
        const offsetItinerary = legPkg.itinerary.map((d) => ({
          ...d,
          day: d.day + globalDayOffset,
          label: d.label.replace(/Day \d+/, `Day ${d.day + globalDayOffset}`),
        }));

        // Re-index activities for merged output
        const offsetActivities = legPkg.activities.map((a) => ({
          ...a,
          dayIndex: a.dayIndex + globalDayOffset,
        }));

        legPackages.push({
          destinationId: leg.destinationId,
          accommodation: legPkg.accommodation,
          accommodationCost: legPkg.accommodationCost,
          nights: leg.nights,
          days: leg.nights,
          dining: legPkg.dining,
          supermarkets: legPkg.supermarkets,
          itinerary: offsetItinerary,
          activities: offsetActivities,
          activityCost: legPkg.activityCost,
          transport: legPkg.transport,
          accommodationAlternatives: legPkg.accommodationAlternatives,
        });

        totalAccomCost += legPkg.accommodationCost;
        totalActivityCost += legPkg.activityCost;
        totalLocalTransport += legPkg.transport.cost;
        allActivities.push(...offsetActivities);
        globalDayOffset += leg.nights;
      }

      const totalCost =
        strategyTransferCost + totalAccomCost + totalActivityCost + totalLocalTransport;
      const bufferAmount = Math.max(0, input.totalBudget - totalCost);
      const bufferPercentActual =
        bufferAmount >= 0
          ? Math.round((bufferAmount / input.totalBudget) * 100)
          : 0;

      const firstLeg = legPackages[0];

      // Merge itinerary with travel day inserted
      const mergedItinerary: DayPlan[] = [];
      for (let i = 0; i < legPackages.length; i++) {
        for (const day of legPackages[i].itinerary) {
          mergedItinerary.push(day);
        }
        if (i < legPackages.length - 1 && strategyTransfer) {
          mergedItinerary.push({
            day: globalDayOffset + 1, // placeholder; will fix counting below
            label: `Day ${globalDayOffset + 1} (Travel: ${strategyTransfer.from} → ${strategyTransfer.to})`,
            morning: undefined,
            afternoon: undefined,
          });
        }
      }

      // Re-number days sequentially
      const finalItinerary: DayPlan[] = [];
      let dayNum = 1;
      for (const item of mergedItinerary) {
        if (
          item.label.includes('Travel') ||
          (!item.morning && !item.afternoon && item.day > legs.reduce((s, l) => s + l.nights, 0))
        ) {
          finalItinerary.push({
            ...item,
            day: dayNum,
            label: item.label.replace(/Day \d+/, `Day ${dayNum}`),
          });
          dayNum++;
        } else {
          finalItinerary.push({
            ...item,
            day: dayNum,
            label: item.label.replace(/Day \d+/, `Day ${dayNum}`),
          });
          dayNum++;
        }
      }

      return {
        name: strategyName(strategy),
        tagline: strategyTagline(strategy),
        strategy,
        accommodation: firstLeg.accommodation,
        accommodationCost: totalAccomCost,
        activities: allActivities,
        activityCost: totalActivityCost,
        transport: {
          mode: input.transportMode,
          description: strategyTransfer
            ? `${input.transportMode} + ${strategyTransfer.mode} (${strategyTransfer.from} → ${strategyTransfer.to})`
            : input.transportMode === 'flying'
              ? 'Airport transfers + local driving'
              : 'Local driving (fuel + parking)',
          cost: totalLocalTransport + strategyTransferCost,
          breakdown: strategyTransfer
            ? [
                `Local transport: $${totalLocalTransport}`,
                `Inter-leg ${strategyTransfer.mode}: $${strategyTransferCost}`,
              ]
            : [`Total transport: $${totalLocalTransport}`],
        },
        bufferAmount,
        bufferPercentActual,
        totalCost,
        remainingBudget: bufferAmount,
        dining: firstLeg.dining,
        supermarkets: firstLeg.supermarkets,
        itinerary: finalItinerary.slice(0, totalNights), // maintain 5 days for 5 nights
        warnings: [],
        legs: legPackages,
        transfer: strategyTransfer,
        seasonBand: input.startDate
          ? (() => {
              const band = resolveBand(input.startDate, this.seasonsData!);
              const mult = getSeasonMultiplier(band, this.seasonsData!);
              return `${band} season (×${mult.toFixed(2)})`;
            })()
          : 'No date selected — mid-season estimates',
      };
    });

    const isFeasible = packages.some((p) => p.totalCost <= input.totalBudget);

    return {
      packages,
      isFeasible,
      warnings,
      generatedAt: this.makeGeneratedAt(input),
    };
  }

  private makeGeneratedAt(input: BuilderInput): string {
    const base = input.baseDate ?? '2026-07-12';
    return base + 'T00:00:00.000Z';
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ║  Helpers                                                                 ║
// ═════════════════════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function strategyName(s: 'value' | 'fun' | 'relax'): string {
  return {
    value: 'Best Value Family Escape',
    fun: 'Maximum Fun',
    relax: 'Resort & Relax',
  }[s];
}

function strategyTagline(s: 'value' | 'fun' | 'relax'): string {
  return {
    value: 'Smart savings — more holiday for your dollar',
    fun: 'Activity-packed adventure the kids will never forget',
    relax: 'Unwind in style — premium comfort with a light itinerary',
  }[s];
}

function strategyLabel(s: 'value' | 'fun' | 'relax'): string {
  return {
    value: 'Best Value',
    fun: 'Maximum Fun',
    relax: 'Resort & Relax',
  }[s];
}

function strategyReason(
  s: 'value' | 'fun' | 'relax',
  activity: ActivityEntry,
  score: number
): string {
  const scoreLabel = { value: 'value', fun: 'fun', relax: 'relax' };
  return `${activity.name} — ${activity.type.replace('_', ' ')} (${scoreLabel[s]} score: ${score})`;
}

let budgetAmount = 0; // unused placeholder to keep hoisting happy during edits

export default BudgetEngine;
