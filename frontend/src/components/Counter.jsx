import { useRef, useEffect } from "react";
import { useInView, animate } from "framer-motion";

const Counter = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  // Parse value: "50,000+" -> num: 50000, suffix: "+"
  const num = parseInt(
    value.replace(/,/g, "").replace(/\+/g, "").replace(/%/g, ""),
    10
  );
  const suffix = value.replace(/[0-9,]/g, "");

  useEffect(() => {
    if (inView) {
      const node = ref.current;
      const controls = animate(0, num, {
        duration: 2,
        ease: "easeOut",
        onUpdate(v) {
          if (node) {
            node.textContent = Math.round(v).toLocaleString();
          }
        },
      });
      return () => controls.stop();
    }
  }, [inView, num]);

  return (
    <span>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  );
};

export default Counter;
