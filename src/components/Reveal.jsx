import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/** Fade & slide in when scrolled into view */
const Reveal = forwardRef(({
  children,
  as: Tag = "div",
  delay = 0,
  y = 16,
  once = true,
  threshold = 0.18,
  className = "",
  ...rest
}, forwardedRef) => {
  const innerRef = useRef(null);

  useImperativeHandle(forwardedRef, () => innerRef.current);

  useEffect(() => {
    const el = innerRef.current;
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
    <Tag ref={innerRef} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
});

Reveal.displayName = "Reveal";

export default Reveal;
