'use client'

interface TimestampProps {
  timestamp: string
}

export default function Timestamp({ timestamp }: TimestampProps) {
  return (
    <p suppressHydrationWarning>
      取得日時: {new Date(timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}
    </p>
  )
}