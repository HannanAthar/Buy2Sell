import { useEffect, useRef, useState } from "react"

export default function useInView(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1, ...options }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, options])

  return [ref, isVisible]
}
