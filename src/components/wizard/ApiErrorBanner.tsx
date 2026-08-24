export function ApiErrorBanner({ message }: { message: string }) {
  return <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{message}</p>
}
