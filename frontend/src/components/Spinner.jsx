export default function Spinner({ size = 24, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="animate-spin rounded-full border-2 border-gray-200 border-t-primary-600"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
