'use client';

import { useState, useCallback } from 'react';
import {
  encodeLegs,
  DESTINATION_OPTIONS,
  type TripLeg,
} from '../lib/url-helpers';

const INTERESTS = [
  { id: 'theme_park', label: '🎢 Theme Parks' },
  { id: 'water_park', label: '💦 Water Parks' },
  { id: 'wildlife', label: '🦘 Wildlife' },
  { id: 'adventure', label: '🏄 Adventure' },
  { id: 'entertainment', label: '🎮 Entertainment' },
  { id: 'free', label: '🏖️ Free Stuff (Beaches & Parks)' },
  { id: 'shopping', label: '🛍️ Shopping' },
];

const MUST_HAVES = [
  { id: 'pool', label: '🏊 Swimming Pool' },
  { id: 'waterslides', label: '🌊 Waterslides' },
  { id: 'kitchen', label: '🍳 Full Kitchen' },
  { id: 'beachfront', label: '🏖️ Beachfront' },
  { id: 'parking', label: '🚗 Free Parking' },
  { id: 'kidsClub', label: '👶 Kids Club' },
];

const AREAS = [
  { id: 'no-preference', label: '🌐 No Preference — Show me the best deals' },
  { id: 'surfers-paradise', label: '🏙️ Surfers Paradise — Iconic, central, everything' },
  { id: 'broadbeach', label: '✨ Broadbeach — Dining, shopping, quieter' },
  { id: 'main-beach', label: '🐠 Main Beach — Sea World, marina, calm' },
  { id: 'coolangatta', label: '🏄 Coolangatta — Surf, airport nearby' },
  { id: 'burleigh-heads', label: '🌿 Burleigh Heads — Village, national park' },
  { id: 'southport', label: '🛝 Southport — Broadwater, parklands, Chinatown' },
  { id: 'robina', label: '🎓 Robina — Shopping, stadium, central' },
  { id: 'hinterland', label: '🏔️ Hinterland — Mountains, rainforest, waterfalls' },
];

const BUFFER_OPTS = [
  { id: '5', label: '5% — Keep it tight' },
  { id: '10', label: '10% — Recommended' },
  { id: '15', label: '15% — Comfy cushion' },
  { id: '20', label: '20% — Play it safe' },
];

export default function HomePage() {
  // ── Budget & party ──
  const [budget, setBudget] = useState<string>('2500');
  const [adults, setAdults] = useState<string>('2');
  const [kids, setKids] = useState<string>('2');

  // ── Date ──
  const [travelDate, setTravelDate] = useState<string>('');

  // ── Leg 1 ──
  const [dest1, setDest1] = useState<string>('gold-coast');
  const [nights1, setNights1] = useState<string>('3');

  // ── Leg 2 (optional) ──
  const [showSecondStop, setShowSecondStop] = useState<boolean>(false);
  const [dest2, setDest2] = useState<string>('');
  const [nights2, setNights2] = useState<string>('');

  // ── Transport ──
  const [transport, setTransport] = useState<'driving' | 'flying'>('driving');
  const [fromAirport, setFromAirport] = useState<string>('coolangatta');

  // ── Preferences ──
  const [area, setArea] = useState<string>('no-preference');
  const [selectedMusts, setSelectedMusts] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'theme_park', 'water_park', 'wildlife', 'free',
  ]);
  const [buffer, setBuffer] = useState<string>('10');

  const toggleMust = useCallback((id: string) => {
    setSelectedMusts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleInterest = useCallback((id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseInt(budget, 10) || 0;
    if (b < 100) return;

    // Build legs
    const legs: TripLeg[] = [];
    const n1 = parseInt(nights1, 10) || 1;
    legs.push({ destinationId: dest1, nights: n1 });

    if (showSecondStop) {
      const n2 = parseInt(nights2, 10);
      if (dest2 && n2 && n2 > 0) {
        legs.push({ destinationId: dest2, nights: n2 });
      } else {
        // User clicked "add second stop" but didn't fill it — fall back to 1 leg
        // (keep legs encoded as 1 leg so results page can always parse it)
      }
    }

    const params = new URLSearchParams({
      budget: String(b),
      adults: String(parseInt(adults, 10) || 2),
      kids: String(parseInt(kids, 10) || 0),
      legs: encodeLegs(legs),
      area,
      musthaves: selectedMusts.join(','),
      interests: selectedInterests.join(','),
      buffer: String(parseInt(buffer, 10) || 10),
      transport,
    });

    if (travelDate) {
      params.set('date', travelDate);
    }

    if (transport === 'flying') {
      params.set('airport', fromAirport);
    }

    window.location.href = `/results?${params.toString()}`;
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img
            src="/janet-mascot.png"
            alt="Janet"
            width={160}
            height={160}
            className="rounded-full border-4 border-sand-200 shadow-sm"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Janet
        </h1>
        <p className="text-gray-500 text-lg">
          Don't stress, darl — Janet's on it.
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Your personal Gold Coast holiday agent. Budget + crew = 3 complete packages.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="card bg-ocean-50 border-ocean-200 mb-6">
        <p className="text-sm text-ocean-800">
          <strong>Quick heads up from Janet:</strong> We estimate prices so you can plan confidently.
          Food and dining suggestions are shown nearby but are <strong>NOT</strong> part of your package total — every family eats differently. {' '}
          <span className="text-ocean-600">Supermarkets are included</span>{' '}
          because Janet does a grocery run on Day 1 😉 Always confirm final prices with providers before booking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Date Picker ── */}
        <section>
          <label className="label text-lg">📅 When are you travelling?</label>
          <input
            type="date"
            className="input-field text-base"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-xs text-gray-400 mt-1">
            Optional — we'll give sharper estimates if we know when.
          </p>
        </section>

        {/* ── Destination 1 ── */}
        <section>
          <label className="label text-lg">📍 Where do you want to stay?</label>
          <select
            className="input-field"
            value={dest1}
            onChange={(e) => setDest1(e.target.value)}
          >
            {DESTINATION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </section>

        {/* ── Nights 1 ── */}
        <section>
          <label className="label text-lg">🌙 How many nights in {DESTINATION_OPTIONS.find((d) => d.id === dest1)?.label || dest1}?</label>
          <input
            type="number"
            className="input-field text-center max-w-[8rem]"
            value={nights1}
            onChange={(e) => setNights1(e.target.value)}
            min={1}
            max={14}
            required
          />
        </section>

        {/* ── Second stop toggle ── */}
        {!showSecondStop && (
          <button
            type="button"
            onClick={() => setShowSecondStop(true)}
            className="w-full md:w-auto text-amber-600 font-semibold text-sm underline decoration-amber-300 underline-offset-4 hover:text-amber-700 transition text-center md:text-left py-2"
          >
            + Add a second stop
          </button>
        )}

        {/* ── Leg 2 (revealed) ── */}
        {showSecondStop && (
          <div className="space-y-4 border-l-4 border-amber-200 pl-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-700">Second Stop</span>
              <button
                type="button"
                onClick={() => {
                  setShowSecondStop(false);
                  setDest2('');
                  setNights2('');
                }}
                className="text-amber-600 text-xs underline decoration-amber-300 underline-offset-2 hover:text-amber-700"
              >
                Remove second stop
              </button>
            </div>
            <div>
              <label className="label">Next destination</label>
              <select
                className="input-field"
                value={dest2}
                onChange={(e) => setDest2(e.target.value)}
                required={showSecondStop}
              >
                <option value="">— Pick a destination —</option>
                {DESTINATION_OPTIONS.filter((d) => d.id !== dest1).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label"> Nights in second stop</label>
              <input
                type="number"
                className="input-field text-center max-w-[8rem]"
                value={nights2}
                onChange={(e) => setNights2(e.target.value)}
                min={1}
                max={14}
                required={showSecondStop}
              />
            </div>
          </div>
        )}

        {/* ── Budget ── */}
        <section>
          <label className="label text-lg">💰 What's your total holiday budget?</label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-400">$</span>
            <input
              type="number"
              className="input-field text-2xl font-bold"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min={100}
              step={100}
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Total for the whole trip — Janet will carve out a safety buffer below.
          </p>
        </section>

        {/* ── Party ── */}
        <section className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Adults (13+)</label>
            <input
              type="number"
              className="input-field text-center"
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              min={1}
              max={6}
              required
            />
          </div>
          <div>
            <label className="label">Kids (0–12)</label>
            <input
              type="number"
              className="input-field text-center"
              value={kids}
              onChange={(e) => setKids(e.target.value)}
              min={0}
              max={6}
              required
            />
          </div>
        </section>

        {/* ── Transport ── */}
        <section>
          <label className="label">🚗 How are you getting here?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTransport('driving')}
              className={`card py-4 text-center transition ${
                transport === 'driving' ? 'ring-2 ring-ocean-500 bg-ocean-50' : ''
              }`}
            >
              <div className="text-3xl mb-1">🚗</div>
              <div className="font-semibold">Driving</div>
            </button>
            <button
              type="button"
              onClick={() => setTransport('flying')}
              className={`card py-4 text-center transition ${
                transport === 'flying' ? 'ring-2 ring-ocean-500 bg-ocean-50' : ''
              }`}
            >
              <div className="text-3xl mb-1">✈️</div>
              <div className="font-semibold">Flying in</div>
            </button>
          </div>
          {transport === 'flying' && (
            <div className="mt-3">
              <label className="label text-sm">Which airport?</label>
              <select
                className="input-field"
                value={fromAirport}
                onChange={(e) => setFromAirport(e.target.value)}
              >
                <option value="coolangatta">
                  🛬 Gold Coast Airport (Coolangatta) — 30 min to central GC
                </option>
                <option value="brisbane">
                  🛬 Brisbane Airport — 60 min via M1 (+ tolls)
                </option>
              </select>
            </div>
          )}
        </section>

        {/* ── GC Area (only show for Gold Coast leg 1; hidden for other destinations) ── */}
        {dest1 === 'gold-coast' && (
          <section>
            <label className="label">📍 Gold Coast area preference</label>
            <select
              className="input-field"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* ── Must-haves ── */}
        <section>
          <label className="label">Must-haves in your accommodation</label>
          <div className="flex flex-wrap gap-2">
            {MUST_HAVES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMust(m.id)}
                className={`tag px-3 py-2 transition ${
                  selectedMusts.includes(m.id)
                    ? 'bg-ocean-100 text-ocean-800 ring-1 ring-ocean-300'
                    : 'bg-white text-gray-500 ring-1 ring-sand-300 hover:bg-sand-100'
                }`}
              >
                {selectedMusts.includes(m.id) ? '✓ ' : '+ '}
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Interests ── */}
        <section>
          <label className="label">
            What kind of stuff do your family want to do?
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => toggleInterest(i.id)}
                className={`tag px-3 py-2 transition ${
                  selectedInterests.includes(i.id)
                    ? 'bg-palm-100 text-palm-800 ring-1 ring-palm-300'
                    : 'bg-white text-gray-500 ring-1 ring-sand-300 hover:bg-sand-100'
                }`}
              >
                {selectedInterests.includes(i.id) ? '✓ ' : '+ '}
                {i.label}
              </button>
            ))}
          </div>
          {selectedInterests.length === 0 && (
            <p className="text-xs text-coral mt-1">
              Pick at least one interest — or select "Free Stuff" for a budget holiday.
            </p>
          )}
        </section>

        {/* ── Buffer ── */}
        <section>
          <label className="label">Safety buffer — keep some money aside?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BUFFER_OPTS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBuffer(b.id)}
                className={`card py-3 text-center text-sm transition ${
                  buffer === b.id ? 'ring-2 ring-palm-500 bg-palm-50' : ''
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            We'll set aside {buffer}% of your budget, then build the rest into activities, accommodation, and transport.
            Remainder of that buffer stays with you for food, incidentals, and whatever you fancy.
          </p>
        </section>

        {/* ── Submit ── */}
        <button
          type="submit"
          className="btn-primary w-full text-lg mt-2"
          disabled={selectedInterests.length === 0}
        >
          🏖️ Build My Holiday Packages
        </button>
      </form>
    </main>
  );
}
