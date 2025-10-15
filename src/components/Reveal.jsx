import React, { useEffect, useRef } from "react";

/** Fade & slide in when scrolled into view */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  y = 0,
  x = 0,
  direction = null,
  distance = 40,
  once = true,
  threshold = 0.18,
  className = "",
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let translateX = x;
    let translateY = y;

    if (direction === "left") {
      translateX = -distance;
      translateY = 0;
    } else if (direction === "right") {
      translateX = distance;
      translateY = 0;
    } else if (direction === "up") {
      translateX = 0;
      translateY = -distance;
    } else if (direction === "down") {
      translateX = 0;
      translateY = distance;
    }

    el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.style.setProperty("--reveal-y", `${translateY}px`);
    el.style.setProperty("--reveal-x", `${translateX}px`);

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
  }, [delay, y, x, direction, distance, once, threshold]);

  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
