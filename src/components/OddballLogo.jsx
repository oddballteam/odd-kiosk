export default function OddballLogo({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Teal filled circle */}
      <circle cx="50" cy="50" r="46" fill="#3d9e8c" />

      {/* Outer ring */}
      <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="2.5" />

      {/* Middle arc — curves left */}
      <path d="M 50 8 A 27 42 0 0 0 50 92" stroke="white" strokeWidth="2.5" fill="none" />

      {/* Inner arc — tighter left curve */}
      <path d="M 50 8 A 13 42 0 0 0 50 92" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  )
}
