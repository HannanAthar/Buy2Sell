import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export default function AnimatedPrice({
  value,
  className = "",
  prefix = "Rs ",
}) {
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, { stiffness: 100, damping: 20 });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const displayValue = useTransform(springValue, (latest) => {
    return `${prefix}${Math.round(latest).toLocaleString()}`;
  });

  return <motion.span className={className}>{displayValue}</motion.span>;
}
