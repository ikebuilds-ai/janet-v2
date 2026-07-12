/**
 * URL encode/decode helpers for Janet v2 multi-leg trips.
 *
 * Legs string format: "gold-coast:3,brisbane:2"
 * Each leg is "destinationId:nights"
 */

export interface TripLeg {
  destinationId: string;
  nights: number;
}

/**
 * Encode an array of TripLeg objects into a URL-safe string.
 * Example: [{ destinationId: 'gold-coast', nights: 3 }, { destinationId: 'brisbane', nights: 2 }]
 *          => "gold-coast:3,brisbane:2"
 */
export function encodeLegs(legs: TripLeg[]): string {
  return legs.map((l) => `${l.destinationId}:${l.nights}`).join(',');
}

/**
 * Decode a legs string back into an array of TripLeg objects.
 * Tolerates empty strings, extra commas, and missing values.
 */
export function decodeLegs(str: string): TripLeg[] {
  if (!str.trim()) return [];
  return str
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colonIndex = part.lastIndexOf(':');
      if (colonIndex === -1) return null;
      const destinationId = part.slice(0, colonIndex).trim();
      const nights = parseInt(part.slice(colonIndex + 1), 10);
      if (!destinationId || isNaN(nights) || nights <= 0) return null;
      return { destinationId, nights };
    })
    .filter((leg): leg is TripLeg => leg !== null);
}

/**
 * All supported destination IDs for the v2 dropdowns.
 * Order: Gold Coast first (legacy default), then others alphabetically by label.
 */
export const DESTINATION_OPTIONS: { id: string; label: string }[] = [
  { id: 'gold-coast', label: 'Gold Coast' },
  { id: 'brisbane', label: 'Brisbane' },
  // The hinterland data is stored under the slug "hinterland" (Sunshine Coast Hinterland).
  { id: 'hinterland', label: 'Sunshine Coast Hinterland' },
  { id: 'noosa', label: 'Noosa' },
  { id: 'sunshine-coast', label: 'Sunshine Coast' },
];

export function getDestinationLabel(id: string): string {
  return DESTINATION_OPTIONS.find((d) => d.id === id)?.label ?? id;
}
