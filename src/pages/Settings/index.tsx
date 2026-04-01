import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Xero Integration</h2>
          {data?.xero?.connected ? (
            <div className="space-y-1 text-sm">
              <p className="text-green-400">Connected</p>
              <p className="text-zinc-500">Token expires: {new Date(data.xero.expiresAt).toLocaleString()}</p>
              <p className="text-zinc-500">Last refresh: {new Date(data.xero.lastRefresh).toLocaleString()}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-500">Not connected</p>
              <a
                href={`https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${encodeURIComponent('XERO_CLIENT_ID')}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/finance/xero/callback')}&scope=openid profile email accounting.transactions accounting.settings offline_access&state=ecodia`}
                className="mt-2 inline-block rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Connect Xero
              </a>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Gmail Integration</h2>
          {data?.gmail?.connected ? (
            <div className="space-y-1 text-sm">
              <p className="text-green-400">Connected</p>
              <p className="text-zinc-500">History ID: {data.gmail.historyId}</p>
              <p className="text-zinc-500">Last sync: {new Date(data.gmail.lastSync).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Not connected — requires Google service account setup on VPS</p>
          )}
        </div>
      </div>
    </div>
  )
}
