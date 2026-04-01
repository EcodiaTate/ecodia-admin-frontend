interface DMDetailProps {
  dm: Record<string, unknown>
}

export function DMDetail({ dm }: DMDetailProps) {
  const messages = (dm.messages as Array<{ sender: string; text: string; timestamp: string }>) || []

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-lg font-medium text-zinc-100">{dm.participant_name as string}</h2>
      <div className="mt-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="rounded-md bg-zinc-800/50 p-3">
            <p className="text-xs font-medium text-zinc-500">{msg.sender}</p>
            <p className="mt-1 text-sm text-zinc-300">{msg.text}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-zinc-500">No messages</p>}
      </div>
    </div>
  )
}
