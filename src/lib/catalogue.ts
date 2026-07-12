import regionGC from '../../data/destinations/gold-coast/region.json';
import accommodationGC from '../../data/destinations/gold-coast/accommodation.json';
import activitiesGC from '../../data/destinations/gold-coast/activities.json';
import diningGC from '../../data/destinations/gold-coast/dining.json';
import supermarketsGC from '../../data/destinations/gold-coast/supermarkets.json';

import regionSun from '../../data/destinations/sunshine-coast/region.json';
import accommodationSun from '../../data/destinations/sunshine-coast/accommodation.json';
import activitiesSun from '../../data/destinations/sunshine-coast/activities.json';
import diningSun from '../../data/destinations/sunshine-coast/dining.json';
import supermarketsSun from '../../data/destinations/sunshine-coast/supermarkets.json';

import regionBne from '../../data/destinations/brisbane/region.json';
import accommodationBne from '../../data/destinations/brisbane/accommodation.json';
import activitiesBne from '../../data/destinations/brisbane/activities.json';
import diningBne from '../../data/destinations/brisbane/dining.json';
import supermarketsBne from '../../data/destinations/brisbane/supermarkets.json';

import regionNoosa from '../../data/destinations/noosa/region.json';
import accommodationNoosa from '../../data/destinations/noosa/accommodation.json';
import activitiesNoosa from '../../data/destinations/noosa/activities.json';
import diningNoosa from '../../data/destinations/noosa/dining.json';
import supermarketsNoosa from '../../data/destinations/noosa/supermarkets.json';

import regionHill from '../../data/destinations/hinterland/region.json';
import accommodationHill from '../../data/destinations/hinterland/accommodation.json';
import activitiesHill from '../../data/destinations/hinterland/activities.json';
import diningHill from '../../data/destinations/hinterland/dining.json';
import supermarketsHill from '../../data/destinations/hinterland/supermarkets.json';

import seasonsData from '../../data/seasons.json';
import transportLegsData from '../../data/transport-legs.json';

import type {
  RegionData,
  AccommodationData,
  ActivitiesData,
  DiningData,
  SupermarketData,
} from './budget-engine';

export interface DestinationCatalogue {
  region: RegionData;
  accommodation: AccommodationData;
  activities: ActivitiesData;
  dining: DiningData;
  supermarkets: SupermarketData;
}

const catalogues: Record<string, DestinationCatalogue> = {
  'gold-coast': {
    region: regionGC as unknown as RegionData,
    accommodation: accommodationGC as unknown as AccommodationData,
    activities: activitiesGC as unknown as ActivitiesData,
    dining: diningGC as unknown as DiningData,
    supermarkets: supermarketsGC as unknown as SupermarketData,
  },
  'sunshine-coast': {
    region: regionSun as unknown as RegionData,
    accommodation: accommodationSun as unknown as AccommodationData,
    activities: activitiesSun as unknown as ActivitiesData,
    dining: diningSun as unknown as DiningData,
    supermarkets: supermarketsSun as unknown as SupermarketData,
  },
  'brisbane': {
    region: regionBne as unknown as RegionData,
    accommodation: accommodationBne as unknown as AccommodationData,
    activities: activitiesBne as unknown as ActivitiesData,
    dining: diningBne as unknown as DiningData,
    supermarkets: supermarketsBne as unknown as SupermarketData,
  },
  'noosa': {
    region: regionNoosa as unknown as RegionData,
    accommodation: accommodationNoosa as unknown as AccommodationData,
    activities: activitiesNoosa as unknown as ActivitiesData,
    dining: diningNoosa as unknown as DiningData,
    supermarkets: supermarketsNoosa as unknown as SupermarketData,
  },
  'hinterland': {
    region: regionHill as unknown as RegionData,
    accommodation: accommodationHill as unknown as AccommodationData,
    activities: activitiesHill as unknown as ActivitiesData,
    dining: diningHill as unknown as DiningData,
    supermarkets: supermarketsHill as unknown as SupermarketData,
  },
};

/** Full destination catalogue map — pass to BudgetEngine for multi-destination support. */
export function loadAllDestinations(): Record<string, DestinationCatalogue> {
  return catalogues;
}

export function loadDestination(id: string): DestinationCatalogue {
  const cat = catalogues[id];
  if (!cat) {
    throw new Error(`Unknown destination: ${id}`);
  }
  return cat;
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

export function loadSeasons(): SeasonsData {
  return seasonsData as unknown as SeasonsData;
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

export function loadTransport(): TransportLegsData {
  return transportLegsData as unknown as TransportLegsData;
}

// Legacy single-destination catalogue (keep for backward compat in tests)
export const catalogue: {
  region: RegionData;
  accommodation: AccommodationData;
  activities: ActivitiesData;
  dining: DiningData;
  supermarkets: SupermarketData;
} = catalogues['gold-coast'];
