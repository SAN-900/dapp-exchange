import { useEffect, useRef, useState } from "react";

export default function LazyTokenImage({
  src,
  alt,
}: {
  src?: string;
  alt?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } // preload slightly before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="w-6 h-6 rounded-full bg-amber-50 dark:bg-neutral-800 flex items-center justify-center"
    >
      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            e.currentTarget.src = "/fallback-token.png";
          }}
        />
      )}
    </div>
  );
}
