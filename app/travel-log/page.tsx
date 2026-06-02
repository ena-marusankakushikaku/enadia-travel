import { AppShell } from '@/components/common/AppShell';
import { TravelMap } from '@/components/trips/TravelMap';
import { mockPhotos, mockTrips } from '@/constants/mockData';
import { getPrefectureName } from '@/constants/japan';

export default function TravelLogPage() {
  const sortedPhotos = [...mockPhotos].sort(
    (a, b) => new Date(a.capturedAt ?? a.ts).getTime() - new Date(b.capturedAt ?? b.ts).getTime()
  );
  const placeCount = new Set(sortedPhotos.map((photo) => photo.placeName).filter(Boolean)).size;
  const prefectureCount = new Set(sortedPhotos.map((photo) => photo.prefectureId).filter(Boolean)).size;
  const suggestedThemes = sortedPhotos.flatMap((photo) => photo.suggestedThemes ?? []);

  return (
    <AppShell subtitle="全旅横断の写真ログ" title="旅ログ">
      {sortedPhotos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
          旅ログはまだありません。
        </p>
      ) : (
        <div className="space-y-5">
          <section className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xl font-bold text-enadia-ink">{sortedPhotos.length}</p>
              <p className="text-xs text-enadia-muted">写真</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xl font-bold text-enadia-ink">{placeCount}</p>
              <p className="text-xs text-enadia-muted">地点</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xl font-bold text-enadia-ink">{prefectureCount}</p>
              <p className="text-xs text-enadia-muted">都道府県</p>
            </div>
          </section>
          <TravelMap photos={sortedPhotos} />
          <section className="rounded-lg border border-enadia-line bg-white p-4">
            <h2 className="text-base font-bold text-enadia-ink">推定テーマタグ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedThemes.map((theme, index) => (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-enadia-muted" key={`${theme.theme}-${index}`}>
                  {theme.label}
                </span>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            {mockTrips.map((trip) => {
              const tripPhotos = sortedPhotos.filter((photo) => photo.tripId === trip.id);
              if (tripPhotos.length === 0) return null;

              return (
                <article className="rounded-lg border border-enadia-line bg-white p-4" key={trip.id}>
                  <h2 className="font-bold text-enadia-ink">{trip.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tripPhotos.map((photo) => (
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-enadia-primary" key={photo.id}>
                        {getPrefectureName(photo.prefectureId)} / {photo.placeName}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </AppShell>
  );
}
