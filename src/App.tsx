import { AdminView } from './components/AdminView'
import { GuestView } from './components/GuestView'
import { SetupScreen } from './components/SetupScreen'
import { TvView } from './components/TvView'
import { isConfigured } from './lib/supabase'

export function App() {
  if (!isConfigured) return <SetupScreen />
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/tv') return <TvView />
  if (path === '/admin') return <AdminView />
  return <GuestView />
}
