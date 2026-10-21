const STARS = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 41) % 100}%`,
  top: `${(index * 67) % 100}%`,
  size: 2 + (index % 3),
  delay: `${(index % 8) * 0.35}s`,
  duration: `${2.8 + (index % 4) * 0.55}s`,
}))

export function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />
      {STARS.map((star) => (
        <span
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  )
}
