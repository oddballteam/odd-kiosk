export default function OddballLogo({ size = 100 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="3" />
      <ellipse cx="44" cy="50" rx="26" ry="42" stroke="white" strokeWidth="3" />
      <ellipse cx="35" cy="50" rx="12" ry="42" stroke="white" strokeWidth="3" />
    </svg>
  )
}
