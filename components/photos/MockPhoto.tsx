import { clsx } from 'clsx';
import { MOCK_PHOTO_GRADIENTS } from '@/constants/design';

type MockPhotoProps = {
  index?: number;
  title?: string | null;
  className?: string;
};

export function MockPhoto({ className, index = 0, title }: MockPhotoProps) {
  const gradient = MOCK_PHOTO_GRADIENTS[index % MOCK_PHOTO_GRADIENTS.length];

  return (
    <div className={clsx('relative overflow-hidden bg-gradient-to-br', gradient, className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.38),transparent_28%),linear-gradient(145deg,transparent,rgba(24,33,47,0.34))]" />
      <div className="absolute bottom-3 left-3 right-3">
        <div className="h-1.5 w-16 rounded-full bg-white/80" />
        {title ? <p className="mt-2 line-clamp-1 text-sm font-bold text-white drop-shadow">{title}</p> : null}
      </div>
    </div>
  );
}
