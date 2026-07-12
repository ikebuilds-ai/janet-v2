'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  catalogue,
  loadSeasons,
  loadTransport,
  loadAllDestinations,
} from '../../lib/catalogue';
import {
  BudgetEngine,
  type BuilderInput,
  type HolidayPackage,
  type PackageLeg,
  type ActivityAllocation,
  type DayPlan,
} from '../../lib/budget-engine';
import { decodeLegs } from '../../lib/url-helpers';

type PageState = 'loading' | 'results' | 'error' | 'empty';

// ── URL parser (v2-aware, backward compatible) ─────────────────────────────

function parseSearchParams(): BuilderInput {
  const p = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );

  let legs = decodeLegs(p.get('legs') || '');
  if (legs.length === 0) {
    // v1 fallback: old ?nights=3 without ?legs=...
    const fallbackNights = parseInt(p.get('nights') || '3', 10) || 1;
    legs = [{ destinationId: 'gold-coast', nights: fallbackNights }];
  }

  const rawAirport = p.get('airport');
  const airport: 'brisbane' | 'coolangatta' | undefined =
    rawAirport === 'brisbane' || rawAirport === 'coolangatta' ? rawAirport : undefined;

  const transport: 'driving' | 'flying' =
    (p.get('transport') as 'driving' | 'flying') || 'driving';

  return {
    legs,
    startDate: p.get('date') || undefined,
    totalBudget: parseInt(p.get('budget') || '0', 10) || 2500,
    adults: parseInt(p.get('adults') || '2', 10) || 2,
    kids: parseInt(p.get('kids') || '0', 10) || 0,
    transportMode: transport,
    fromAirport: transport === 'flying' ? (airport || 'coolangatta') : undefined,
    areaPreference:
      p.get('area') === 'no-preference' ? undefined : p.get('area') || undefined,
    mustHaves: (p.get('musthaves') || '').split(',').filter(Boolean),
    interests: (p.get('interests') || 'theme_park,water_park,wildlife,free')
      .split(',')
      .filter(Boolean),
    bufferPercent: parseInt(p.get('buffer') || '10', 10) || 10,
    familyName: p.get('familyName') || undefined,
  };
}

// ── Formatting helpers ─────────────────────────────────────────────────────

function fmt(amount: number): string {
  return `$${amount.toLocaleString('en-AU')}`;
}

function fmtArea(areaId: string): string {
  const names: Record<string, string> = {
    'surfers-paradise': 'Surfers Paradise',
    'broadbeach': 'Broadbeach',
    'main-beach': 'Main Beach',
    'coolangatta': 'Coolangatta',
    'burleigh-heads': 'Burleigh Heads',
    'southport': 'Southport',
    'robina': 'Robina',
    'hinterland': 'Hinterland',
  };
  return names[areaId] || areaId;
}

function destinationLabelById(id: string): string {
  const map: Record<string, string> = {
    'gold-coast': 'Gold Coast',
    'brisbane': 'Brisbane',
    'sunshine-coast': 'Sunshine Coast',
    'noosa': 'Noosa',
    'hinterland': 'Sunshine Coast Hinterland',
  };
  return map[id] || id;
}

function bedroomsLabel(bedrooms: string[]): string {
  if (!bedrooms || bedrooms.length === 0) return '';
  return `${bedrooms.length} bedroom${bedrooms.length > 1 ? 's' : ''} (${bedrooms.join(' + ')}-bed config)`;
}

function seasonBadge(seasonBand: string | undefined): { emoji: string; text: string } | null {
  if (!seasonBand) return null;
  if (seasonBand.includes('peak')) return { emoji: '🌞', text: 'Peak season pricing' };
  if (seasonBand.includes('offpeak')) return { emoji: '🌿', text: 'Off-peak season pricing' };
  if (seasonBand.includes('shoulder')) return { emoji: '🍂', text: 'Shoulder season pricing' };
  return null;
}

// ── Alternative accommodation list ─────────────────────────────────────

function AccommodationAlternatives({
  alternatives,
  strategyLabel,
}: {
  alternatives?: { id: string; name: string; area: string; url?: string; pricePerNightFrom: number; priceBand: string }[];
  strategyLabel?: string;
}) {
  if (!alternatives || alternatives.length === 0) return null;
  return (
    <div className="mt-5 pt-4 border-t-2 border-ocean-200">
      <h5 className="text-sm font-bold text-ocean-700 mb-3 flex items-center gap-2">
        🏨 All 5 Picks{strategyLabel ? <span className="text-xs font-normal text-gray-400 ml-1">for {strategyLabel}</span> : ''}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {alternatives.map((alt, i) => (
          <div key={alt.id} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg p-2.5 hover:border-ocean-300 hover:shadow-sm transition-all">
            <span className="shrink-0 w-6 h-6 rounded-full bg-ocean-50 text-ocean-600 text-[11px] font-bold flex items-center justify-center border-2 border-ocean-200">
              {i + 2}
            </span>
            <div className="flex-1 min-w-0">
              {alt.url ? (
                <a href={alt.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 underline decoration-ocean-200 underline-offset-2 hover:text-ocean-600">
                  {alt.name} ↗
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-700">{alt.name}</span>
              )}
              <div className="text-[11px] text-gray-400">{fmtArea(alt.area)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-gray-700">{fmt(alt.pricePerNightFrom)}</div>
              <div className="text-[11px] text-gray-400">/night</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Activity card (reused per leg) ─────────────────────────────────────────

function ActivityCard({
  alloc,
  kids,
  dayShift = 0,
}: {
  alloc: ActivityAllocation;
  kids: number;
  dayShift?: number;
}) {
  const { activity, cost, dayIndex, slot } = alloc;
  const displayDay = dayIndex + 1 + dayShift;
  return (
    <div className="flex justify-between items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{activity.name}</span>
          {activity.type === 'free' && (
            <span className="tag bg-green-50 text-green-700 text-xs">FREE</span>
          )}
          {activity.needsFullDay && (
            <span className="tag bg-amber-50 text-amber-700 text-xs">Full Day</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Day {displayDay} · {slot === 0 ? 'Morning' : 'Afternoon'}
          {activity.durationHours > 0 && ` · ${activity.durationHours}h`}
        </p>
        {activity.url && cost > 0 && (
          <a
            href={activity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-ocean-600 underline underline-offset-2 mt-1"
          >
            Check prices ↗
          </a>
        )}
      </div>
      <div className="text-right shrink-0">
        {cost > 0 ? (
          <>
            <span className="font-bold text-sm">{fmt(cost)}</span>
            <br />
            <span className="text-xs text-gray-400">
              {activity.adultPrice > 0 && `$${activity.adultPrice}/adult`}
              {kids > 0 && activity.childPrice > 0 && ` $${activity.childPrice}/child`}
            </span>
          </>
        ) : (
          <span className="font-bold text-sm text-green-600">FREE</span>
        )}
      </div>
    </div>
  );
}

// ── Day card (itinerary) ───────────────────────────────────────────────────

function DayCard({
  day,
  displayDay,
}: {
  day: DayPlan;
  displayDay: number;
}) {
  return (
    <div className="card">
      <h4 className="font-bold text-gray-700 mb-3">
        Day {displayDay}
        {day.label && (
          <span className="text-sm font-normal text-gray-400 ml-2">— {day.label}</span>
        )}
      </h4>
      <div className="space-y-3">
        <div>
          <span className="text-xs font-semibold uppercase text-ocean-600 tracking-wide">
            ☀️ Morning
          </span>
          {day.morning ? (
            <p className="text-sm text-gray-700 mt-1">{day.morning.activity.name}</p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Free time — relax by the pool!</p>
          )}
        </div>
        <div>
          <span className="text-xs font-semibold uppercase text-amber-600 tracking-wide">
            🌤️ Afternoon
          </span>
          {day.afternoon ? (
            <p className="text-sm text-gray-700 mt-1">{day.afternoon.activity.name}</p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Free time — explore!</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Travel day card ────────────────────────────────────────────────────────

function TravelDayCard({
  transfer,
  dayNumber,
}: {
  transfer: NonNullable<HolidayPackage['transfer']>;
  dayNumber: number;
}) {
  return (
    <div className="card bg-amber-50 border-amber-200 text-center py-6">
      <div className="text-2xl mb-2">🚗</div>
      <h4 className="font-bold text-amber-800 mb-1">
        Day {dayNumber}: {destinationLabelById(transfer.from)} → {destinationLabelById(transfer.to)}
      </h4>
      <p className="text-sm text-amber-700">
        {transfer.mode} · ~{transfer.durationMin} min · ~{fmt(transfer.cost)}
      </p>
      {transfer.note && (
        <p className="text-xs text-amber-600 mt-1">{transfer.note}</p>
      )}
    </div>
  );
}

// ── Dining section ─────────────────────────────────────────────────────────

function DiningSection({
  dining,
  areaId,
}: {
  dining: HolidayPackage['dining'];
  areaId: string;
}) {
  if (!dining || dining.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide mb-3">
        🍽️ Food Nearby in {fmtArea(areaId)}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {dining.map((group, i) => (
          <div key={i} className="card">
            <h4 className="font-semibold text-sm mb-2">
              {group.priceBand === '$' ? '💵' : group.priceBand === '$$' ? '🥂' : '🌟'}{' '}
              {group.tier}
            </h4>
            <ul className="space-y-2">
              {group.venues.slice(0, 4).map((venue, j) => (
                <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span>
                    <span className="font-medium text-gray-700">{venue.name}</span>
                    <br />
                    <span className="text-xs text-gray-400">{venue.cuisine}</span>
                  </span>
                </li>
              ))}
              {group.venues.length > 4 && (
                <li className="text-xs text-gray-400">
                  +{group.venues.length - 4} more options
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Food is NOT included in your package total — spending is up to how hungry the kids are 😄
      </p>
    </section>
  );
}

// ── Supermarket section ────────────────────────────────────────────────────

function SupermarketSection({
  supermarkets,
  hasKitchen,
}: {
  supermarkets: HolidayPackage['supermarkets'];
  hasKitchen: boolean;
}) {
  if (!supermarkets || supermarkets.length === 0) return null;

  return (
    <section className="mt-4">
      <h3 className="text-sm font-semibold uppercase text-green-700 tracking-wide mb-2">
        🛒 Supermarkets Nearby — Day 1 Grocery Run
      </h3>
      {hasKitchen && (
        <p className="text-xs text-green-600 mb-2">
          Your accommodation has a kitchen! Hit the supermarket on Day 1 — saves a fortune on
          breakfast and snacks.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {supermarkets.map((s, i) => (
          <span key={i} className="tag bg-green-50 text-green-800 text-xs px-3 py-1.5">
            🛒 {s.chain} — {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Leg section (accommodation + activities + itinerary + dining + supermarkets) ─

function LegSection({
  leg,
  legIndex,
  kids,
  isMultiLeg,
  strategyLabel,
}: {
  leg: PackageLeg;
  legIndex: number;
  kids: number;
  isMultiLeg: boolean;
  strategyLabel?: string;
}) {
  return (
    <div className="space-y-5">
      {/* Leg header */}
      {isMultiLeg && (
        <div className="flex items-center gap-2">
          <span className="tag bg-ocean-100 text-ocean-800 text-xs font-semibold">
            Leg {legIndex + 1}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {destinationLabelById(leg.destinationId)} · {leg.nights} night{leg.nights > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Accommodation */}
      <div className="bg-sand-50 border border-sand-200 rounded-xl p-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h4 className="font-bold text-gray-800">
              {leg.accommodation.url ? (
                <a
                  href={leg.accommodation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-sand-300 underline-offset-4 hover:text-ocean-600"
                >
                  {leg.accommodation.name} ↗
                </a>
              ) : (
                leg.accommodation.name
              )}
            </h4>
            <p className="text-sm text-gray-500 mt-0.5">
              {fmtArea(leg.accommodation.area)}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {leg.accommodation.features.map((f, i) => (
                <span key={i} className="tag bg-white text-gray-600 text-xs">
                  {f === 'pool'
                    ? '🏊'
                    : f === 'kitchen'
                      ? '🍳'
                      : f === 'beachfront'
                        ? '🏖️'
                        : '✅'}{' '}
                  {f}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Sleeps up to {leg.accommodation.sleepsMax}
              {leg.accommodation.bedrooms.length > 0 &&
                ` · ${bedroomsLabel(leg.accommodation.bedrooms)}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-ocean-600">
              {fmt(leg.accommodation.pricePerNightFrom)}
            </div>
            <div className="text-xs text-gray-400">per night</div>
            <div className="text-sm font-semibold text-gray-600 mt-2">
              {fmt(leg.accommodationCost)} total
            </div>
          </div>
        </div>
        <AccommodationAlternatives alternatives={leg.accommodationAlternatives} strategyLabel={strategyLabel} />
      </div>

      {/* Activities */}
      {leg.activities.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide mb-2">
            🎯 Activities ({leg.activities.length})
          </h3>
          <div className="card">
            {leg.activities.map((alloc, i) => (
              <ActivityCard
                key={i}
                alloc={alloc}
                kids={kids}
                dayShift={0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Itinerary */}
      <section>
        <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide mb-3">
          📅 Day-by-Day Plan
        </h3>
        <div className="space-y-3">
          {leg.itinerary.map((day) => (
            <DayCard
              key={day.day}
              day={day}
              displayDay={day.day}
            />
          ))}
        </div>
      </section>

      {/* Dining */}
      <DiningSection dining={leg.dining} areaId={leg.accommodation.area} />

      {/* Supermarkets */}
      <SupermarketSection
        supermarkets={leg.supermarkets}
        hasKitchen={leg.accommodation.features.includes('kitchen')}
      />
    </div>
  );
}

// ── Strategy constants ─────────────────────────────────────────────────────

const STRATEGY_EMOJI: Record<string, string> = {
  value: '💵',
  fun: '🎢',
  relax: '🍹',
};

const STRATEGY_COLORS: Record<string, string> = {
  value: 'badge-budget',
  fun: 'badge-mid',
  relax: 'badge-premium',
};

const STRATEGY_LABELS: Record<string, string> = {
  value: 'Best Value',
  fun: 'Maximum Fun',
  relax: 'Resort & Relax',
};

// ── Package Card (main container) ──────────────────────────────────────────

function PackageCard({
  pkg,
  input,
}: {
  pkg: HolidayPackage;
  input: BuilderInput;
}) {
  const strategyLabel = STRATEGY_LABELS[pkg.strategy];
  const emoji = STRATEGY_EMOJI[pkg.strategy] || '🏖️';
  const color = STRATEGY_COLORS[pkg.strategy] || 'badge-mid';
  const usagePercent = (
    (pkg.totalCost / (pkg.totalCost + pkg.remainingBudget)) *
    100
  ).toFixed(0);

  const hasDate = !!input.startDate;
  const sb = seasonBadge(pkg.seasonBand);
  const isMultiLeg = (input.legs?.length ?? 0) > 1;

  // Compute travel day number (1-based, inserted between legs)
  const travelDayNumber = isMultiLeg && input.legs ? input.legs[0].nights + 1 : 0;

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={color}>
              {emoji} {pkg.strategy.toUpperCase()}
            </span>
            {hasDate && sb && (
              <span className="tag bg-amber-100 text-amber-800 text-xs border border-amber-300">
                {sb.emoji} {sb.text}
              </span>
            )}
            {!hasDate && (
              <span className="tag bg-gray-100 text-gray-600 text-xs border border-gray-300">
                📅 Mid-season estimate
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{pkg.name}</h3>
          <p className="text-sm text-gray-500">{pkg.tagline}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-ocean-600">{fmt(pkg.totalCost)}</div>
          <div className="text-xs text-gray-400">
            {usagePercent}% of budget · {fmt(pkg.remainingBudget)} left
          </div>
        </div>
      </div>

      {/* Warnings */}
      {pkg.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          {pkg.warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* ── Single leg: v1 layout (use top-level fields for identical rendering) ── */}
      {!isMultiLeg && (
        <>
          {/* Accommodation */}
          <div className="bg-sand-50 border border-sand-200 rounded-xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <h4 className="font-bold text-gray-800">
                  {pkg.accommodation.url ? (
                    <a
                      href={pkg.accommodation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-sand-300 underline-offset-4 hover:text-ocean-600"
                    >
                      {pkg.accommodation.name} ↗
                    </a>
                  ) : (
                    pkg.accommodation.name
                  )}
                </h4>
                <p className="text-sm text-gray-500 mt-0.5">
                  {fmtArea(pkg.accommodation.area)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pkg.accommodation.features.map((f, i) => (
                    <span key={i} className="tag bg-white text-gray-600 text-xs">
                      {f === 'pool'
                        ? '🏊'
                        : f === 'kitchen'
                          ? '🍳'
                          : f === 'beachfront'
                            ? '🏖️'
                            : '✅'}{' '}
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Sleeps up to {pkg.accommodation.sleepsMax}
                  {pkg.accommodation.bedrooms.length > 0 &&
                    ` · ${bedroomsLabel(pkg.accommodation.bedrooms)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-ocean-600">
                  {fmt(pkg.accommodation.pricePerNightFrom)}
                </div>
                <div className="text-xs text-gray-400">per night</div>
                <div className="text-sm font-semibold text-gray-600 mt-2">
                  {fmt(pkg.accommodationCost)} total
                </div>
              </div>
            </div>
            <AccommodationAlternatives alternatives={pkg.accommodationAlternatives} strategyLabel={strategyLabel} />
          </div>

          {/* Transport */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              {pkg.transport.mode === 'flying' ? '✈️ Airport transfer' : '🚗 Driving costs'}
              <span className="text-xs text-gray-400 ml-1">({pkg.transport.description})</span>
            </span>
            <span className="font-semibold">{fmt(pkg.transport.cost)}</span>
          </div>

          {/* Activities */}
          {pkg.activities.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide mb-2">
                🎯 Activities ({pkg.activities.length})
              </h3>
              <div className="card">
                {pkg.activities.map((alloc, i) => (
                  <ActivityCard key={i} alloc={alloc} kids={input.kids} />
                ))}
              </div>
            </section>
          )}

          {/* Itinerary */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-gray-500 tracking-wide mb-3">
              📅 Day-by-Day Plan
            </h3>
            <div className="space-y-3">
              {pkg.itinerary.map((day) => (
                <DayCard key={day.day} day={day} displayDay={day.day} />
              ))}
            </div>
          </section>

          {/* Dining */}
          <DiningSection dining={pkg.dining} areaId={pkg.accommodation.area} />

          {/* Supermarkets */}
          <SupermarketSection
            supermarkets={pkg.supermarkets}
            hasKitchen={pkg.accommodation.features.includes('kitchen')}
          />
        </>
      )}

      {/* ── Multi-leg: per-leg sections with travel day ── */}
      {isMultiLeg && pkg.legs && (
        <>
          {/* Leg 1 */}
          <LegSection
            leg={pkg.legs[0]}
            legIndex={0}
            kids={input.kids}
            isMultiLeg={true}
            strategyLabel={strategyLabel}
          />

          {/* Travel day */}
          {pkg.transfer && (
            <TravelDayCard
              transfer={pkg.transfer}
              dayNumber={travelDayNumber}
            />
          )}

          {/* Leg 2 */}
          {pkg.legs[1] && (
            <LegSection
              leg={pkg.legs[1]}
              legIndex={1}
              kids={input.kids}
              isMultiLeg={true}
            />
          )}

          {/* Combined transport summary */}
          <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
            <span className="text-gray-500">
              🚗 Transport total
              <span className="text-xs text-gray-400 ml-1">({pkg.transport.description})</span>
            </span>
            <span className="font-semibold">{fmt(pkg.transport.cost)}</span>
          </div>
        </>
      )}

      {/* Budget breakdown (always shown) */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-ocean-50 rounded-xl p-3">
          <div className="text-xs text-ocean-600 font-semibold">Accom.</div>
          <div className="font-bold text-ocean-700 mt-0.5">{fmt(pkg.accommodationCost)}</div>
        </div>
        <div className="bg-palm-50 rounded-xl p-3">
          <div className="text-xs text-palm-600 font-semibold">Activities</div>
          <div className="font-bold text-palm-700 mt-0.5">{fmt(pkg.activityCost)}</div>
        </div>
        <div className="bg-sand-100 rounded-xl p-3">
          <div className="text-xs text-gray-500 font-semibold">Buffer</div>
          <div className="font-bold text-gray-600 mt-0.5">{fmt(pkg.bufferAmount)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [state, setState] = useState<PageState>('loading');
  const [input, setInput] = useState<BuilderInput | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const params = parseSearchParams();
    if (!params.totalBudget || params.totalBudget < 100) {
      setState('empty');
      return;
    }
    setInput(params);
    setState('results');
  }, []);

  const engine = useMemo(() => {
    const seasons = loadSeasons();
    const transport = loadTransport();
    return new BudgetEngine(catalogue, seasons, transport, loadAllDestinations());
  }, []);

  const result = useMemo(() => {
    if (!input) return null;
    try {
      return engine.buildPackagesV2(input);
    } catch (e) {
      console.error('Engine error:', e);
      return null;
    }
  }, [input, engine]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="text-4xl mb-4">🏖️</div>
          <div className="text-gray-500 animate-pulse">
            Building your holiday packages...
          </div>
        </div>
      </div>
    );
  }

  if (state === 'empty' || !result || !input) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No plans to show yet</h2>
        <p className="text-gray-500 mb-6">
          Head back to the builder and tell us your budget, crew, and vibe — we'll build
          some custom packages for you!
        </p>
        <Link href="/" className="btn-primary inline-block">
          ← Back to the Builder
        </Link>
      </main>
    );
  }

  const pkg = result.packages[activeIndex];
  if (!pkg) return null;

  const totalNights = (input.legs ?? []).reduce((s, l) => s + l.nights, 0);
  const isMultiLeg = (input.legs?.length ?? 0) > 1;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Your {isMultiLeg ? 'Queensland' : 'Gold Coast'} Holiday 🏖️
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {input.adults} adult{input.adults > 1 ? 's' : ''}
            {input.kids > 0 && ` + ${input.kids} kid${input.kids > 1 ? 's' : ''}`}
            {' · '}
            {totalNights} night{totalNights > 1 ? 's' : ''}
            {' · '}
            {input.transportMode === 'driving' ? '🚗 Driving' : '✈️ Flying'}
            {isMultiLeg && (
              <>
                {' · '}
                {input.legs?.map((l) => destinationLabelById(l.destinationId)).join(' + ')}
              </>
            )}
          </p>
          {!result.isFeasible && (
            <p className="text-sm text-amber-600 mt-1">
              No property can fit {input.adults + input.kids} people. These are best-available
              suggestions — adjust your crew or budget for a better fit.
            </p>
          )}
        </div>
        <Link href="/" className="btn-secondary text-sm py-2 px-4">
          ← Back
        </Link>
      </div>

      {/* Tab selectors */}
      <div className="flex gap-2 mb-6">
        {result.packages.map((p, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex-1 card py-3 text-center transition ${
              i === activeIndex
                ? 'ring-2 ring-ocean-500 bg-ocean-50'
                : 'hover:bg-sand-50'
            }`}
          >
            <div className="text-lg">{STRATEGY_EMOJI[p.strategy]}</div>
            <div className="text-xs font-semibold text-gray-600 mt-0.5">
              {STRATEGY_LABELS[p.strategy]}
            </div>
            <div className="text-sm font-bold text-ocean-600 mt-0.5">
              {fmt(p.totalCost)}
            </div>
          </button>
        ))}
      </div>

      {/* Active package */}
      <PackageCard pkg={pkg} input={input} />

      {/* Summary footer */}
      <div className="card mt-6 text-center">
        <div className="text-sm text-gray-500 mb-1">Total Package Cost</div>
        <div className="text-3xl font-bold text-ocean-600">{fmt(pkg.totalCost)}</div>
        <div className="flex justify-center gap-6 mt-2 text-xs text-gray-400">
          <span>{fmt(pkg.remainingBudget)} leftover from budget</span>
          <span>{pkg.bufferPercentActual}% safety buffer</span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied! Send it to your partner or family group chat 📋');
            }}
            className="btn-secondary text-sm w-full"
          >
            📋 Share This Plan
          </button>
          <p className="text-xs text-gray-400">
            This link includes all your settings — share it with anyone
          </p>
          <p className="text-xs text-gray-400 mt-3">
            <strong>Always verify prices.</strong> Accommodation and activity costs are
            estimates based on listings as at July 2026 — tap any hotel or activity name
            to check live prices and book direct with the operator. Food is <em>not</em> included in the package
            total — dining suggestions are nearby but you pay when you eat. Supermarkets on
            Day 1 = smart move. Built by{' '}
            <a href="https://erosium.com.au" className="text-ocean-600" target="_blank">
              Erosium
            </a>{' '}
            — the AI guys on the Gold Coast. Not official. Do your own checks.
          </p>
        </div>
      </div>
    </main>
  );
}
