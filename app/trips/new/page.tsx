'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarDays, MapPin } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { useTrips } from '@/hooks/useTrips';

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip } = useTrips();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError('旅名を入力してください');
      return;
    }

    setError(null);
    setSubmitting(true);
    const tripId = await createTrip({
      title: title.trim(),
      area: area.trim() || null,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      description: description.trim() || null
    });
    setSubmitting(false);

    if (!tripId) {
      setError('旅の作成に失敗しました。時間をおいて再度お試しください。');
      return;
    }

    router.push(`/trips/${tripId}`);
  }

  return (
    <AppShell title="旅を作成">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">旅名</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-enadia-line bg-white px-3 text-base outline-none focus:border-enadia-primary focus:ring-2 focus:ring-teal-100"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="初夏の瀬戸内リサーチ旅"
            value={title}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-enadia-ink">開始日</span>
            <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
              <input
                className="h-12 min-w-0 flex-1 px-2 outline-none"
                onChange={(event) => setStartsAt(event.target.value)}
                type="date"
                value={startsAt}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-enadia-ink">終了日</span>
            <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
              <input
                className="h-12 min-w-0 flex-1 px-2 outline-none"
                min={startsAt || undefined}
                onChange={(event) => setEndsAt(event.target.value)}
                type="date"
                value={endsAt}
              />
            </div>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">エリア</span>
          <div className="mt-2 flex items-center rounded-lg border border-enadia-line bg-white px-3">
            <MapPin className="h-4 w-4 shrink-0 text-enadia-muted" aria-hidden="true" />
            <input
              className="h-12 min-w-0 flex-1 px-2 outline-none"
              onChange={(event) => setArea(event.target.value)}
              placeholder="広島・尾道"
              value={area}
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-enadia-ink">メモ（任意）</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-enadia-line bg-white p-3 text-sm outline-none focus:border-enadia-primary focus:ring-2 focus:ring-teal-100"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="旅の目的やメモ"
            value={description}
          />
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <p className="text-xs text-enadia-muted">写真の追加は旅を作成したあと、詳細画面から行えます。</p>

        <Button className="w-full" loading={submitting} size="lg" type="submit" variant="primary">
          旅を作成
        </Button>
      </form>
    </AppShell>
  );
}
