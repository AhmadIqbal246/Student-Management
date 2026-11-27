export default function Loader({ label = 'Loading...', fullPage = false }) {
  return (
    <div className={fullPage ? 'loader loader-full' : 'loader'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
