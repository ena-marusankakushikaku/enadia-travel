'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Trip } from '@/types/app';

type UseTripsState = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTrip: (input: {
    title: string;
    area?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    description?: string | null;
  }) => Promise<string | null>;
};

export function useTrips(): UseTripsState {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/trips');
    const data = (await response.json()) as { trips?: Trip[]; error?: string };
    if (!response.ok) {
      setError(data.error ?? 'Failed to load trips');
      setLoading(false);
      return;
    }
    setTrips(data.trips ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function createTrip(input: Parameters<UseTripsState['createTrip']>[0]) {
    const response = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = (await response.json()) as { tripId?: string; error?: string };
    if (!response.ok) {
      setError(data.error ?? 'Failed to create trip');
      return null;
    }
    await refresh();
    return data.tripId ?? null;
  }

  return { trips, loading, error, refresh, createTrip };
}
