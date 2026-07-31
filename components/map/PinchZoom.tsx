'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

type PinchZoomProps = {
  children: ReactNode;
  /** これ以上は拡大しない */
  maxScale?: number;
  className?: string;
};

type Transform = { scale: number; x: number; y: number };

const INITIAL: Transform = { scale: 1, x: 0, y: 0 };
const BUTTON_STEP = 1.6;

/**
 * 地図をピンチ／ホイールで拡大縮小し、ドラッグで動かせるようにする。
 *
 * 地図はSVGを固定倍率で描いているだけなので、そのままでは指で拡大できない。
 * SVG側を変えずに、包んだ要素をCSSのtransformで動かす方式にしている。
 * 外部ライブラリは使わない。
 *
 * 等倍のときは1本指の操作をページのスクロールに譲る。
 * 拡大しているときだけ、1本指ドラッグを地図の移動として受け取る。
 */
export function PinchZoom({ children, className, maxScale = 6 }: PinchZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; midX: number; midY: number } | null>(null);
  const [transform, setTransform] = useState<Transform>(INITIAL);

  const isZoomed = transform.scale > 1.001;

  /** 拡大した中身が枠から外れないように、移動量を制限する */
  const clamp = useCallback((next: Transform): Transform => {
    const rect = containerRef.current?.getBoundingClientRect();
    const scale = Math.min(maxScale, Math.max(1, next.scale));

    if (!rect) {
      return { ...next, scale };
    }

    const maxX = ((scale - 1) * rect.width) / 2;
    const maxY = ((scale - 1) * rect.height) / 2;

    return {
      scale,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y))
    };
  }, [maxScale]);

  /** 指やカーソルの位置を動かさずに拡大する */
  const zoomAt = useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      // 枠の中心を原点にした座標
      const pointX = clientX - rect.left - rect.width / 2;
      const pointY = clientY - rect.top - rect.height / 2;

      setTransform((current) => {
        const scale = Math.min(maxScale, Math.max(1, nextScale));
        const ratio = scale / current.scale;

        return clamp({
          scale,
          x: pointX - (pointX - current.x) * ratio,
          y: pointY - (pointY - current.y) * ratio
        });
      });
    },
    [clamp, maxScale]
  );

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    // ここでポインタを捕まえると、地図上のピンをタップしても反応しなくなる。
    // 2本指のときだけ捕まえて、1本指の操作はそのまま子要素に届ける。
    if (pointersRef.current.size === 2) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2
      };
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pointers = pointersRef.current;
    const previous = pointers.get(event.pointerId);
    if (!previous) {
      return;
    }

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const [a, b] = Array.from(pointers.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const pinch = pinchRef.current;

      if (pinch && pinch.distance > 0 && distance > 0) {
        setTransform((current) => zoomAndPan(current, pinch, distance, a, b));
      }

      pinchRef.current = {
        distance,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2
      };
      return;
    }

    // 等倍のときはページのスクロールを邪魔しない
    if (!isZoomed) {
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    setTransform((current) => clamp({ ...current, x: current.x + dx, y: current.y + dy }));
  }

  /** ピンチ中の拡大と移動をまとめて計算する */
  function zoomAndPan(
    current: Transform,
    pinch: { distance: number; midX: number; midY: number },
    distance: number,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): Transform {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return current;
    }

    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const pointX = midX - rect.left - rect.width / 2;
    const pointY = midY - rect.top - rect.height / 2;

    const scale = Math.min(maxScale, Math.max(1, (current.scale * distance) / pinch.distance));
    const ratio = scale / current.scale;

    // 指の中心を固定したまま拡大し、指の移動ぶんだけずらす
    return clamp({
      scale,
      x: pointX - (pointX - current.x) * ratio + (midX - pinch.midX),
      y: pointY - (pointY - current.y) * ratio + (midY - pinch.midY)
    });
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
  }

  // ホイールでの拡大縮小。ページのスクロールに取られないよう、自前で登録する
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY / 300);
      setTransform((current) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return current;
        }

        const pointX = event.clientX - rect.left - rect.width / 2;
        const pointY = event.clientY - rect.top - rect.height / 2;
        const scale = Math.min(maxScale, Math.max(1, current.scale * factor));
        const ratio = scale / current.scale;

        return clamp({
          scale,
          x: pointX - (pointX - current.x) * ratio,
          y: pointY - (pointY - current.y) * ratio
        });
      });
    }

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [clamp, maxScale]);

  function zoomFromCenter(factor: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    zoomAt(transform.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  return (
    <div className={className}>
      <div
        className="relative touch-none overflow-hidden rounded-lg bg-[linear-gradient(160deg,#eef7fb_0%,#f6fbfd_100%)] p-2"
        onDoubleClick={() => setTransform(INITIAL)}
        onPointerCancel={endPointer}
        onPointerDown={handlePointerDown}
        onPointerLeave={endPointer}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        ref={containerRef}
        style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      >
        <div
          className="origin-center"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: pointersRef.current.size > 0 ? undefined : 'transform 120ms ease-out'
          }}
        >
          {children}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <button
          aria-label="縮小"
          className="grid h-8 w-8 place-items-center rounded-full border border-enadia-line bg-white text-enadia-muted transition hover:bg-slate-50 disabled:opacity-40"
          disabled={!isZoomed}
          onClick={() => zoomFromCenter(1 / BUTTON_STEP)}
          type="button"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          aria-label="拡大"
          className="grid h-8 w-8 place-items-center rounded-full border border-enadia-line bg-white text-enadia-muted transition hover:bg-slate-50 disabled:opacity-40"
          disabled={transform.scale >= maxScale - 0.001}
          onClick={() => zoomFromCenter(BUTTON_STEP)}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        {isZoomed ? (
          <button
            className="inline-flex items-center gap-1 rounded-full border border-enadia-line bg-white px-3 py-1.5 text-xs font-bold text-enadia-muted transition hover:bg-slate-50"
            onClick={() => setTransform(INITIAL)}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            全体に戻す
          </button>
        ) : (
          <span className="text-xs text-enadia-muted">2本指で拡大、ドラッグで移動できます。</span>
        )}
      </div>
    </div>
  );
}
