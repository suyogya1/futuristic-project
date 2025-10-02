import React, { useEffect, useRef } from "react";

/** Fade & slide in when scrolled into view */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,    // ms
  y = 16,       // px translateY-from
  once = true,
  threshold = 0.18,
  className = "",
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.style.setProperty("--reveal-y", `${y}px`);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          if (once) io.unobserve(el);
        } else if (!once) {
          el.classList.remove("reveal-visible");
        }
      },
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay, y, once, threshold]);

  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
