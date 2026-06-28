import { useState, useRef, useEffect } from 'react';

export default function LazySection({ children, className, style, rootMargin = '200px', keepMounted = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setHasBeenVisible(true);
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  const shouldRender = keepMounted ? hasBeenVisible : visible;

  return (
    <div ref={ref} className={className} style={style}>
      {shouldRender ? children : null}
    </div>
  );
}
