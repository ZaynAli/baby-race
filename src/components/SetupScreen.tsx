import { configStatus } from '../lib/supabase'
import { Backdrop } from './Backdrop'

export function SetupScreen() {
  const missing = [
    !configStatus.hasUrl ? 'VITE_SUPABASE_URL' : null,
    !configStatus.hasKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter((item): item is string => Boolean(item))

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-10">
        <p className="text-xs font-extrabold tracking-[0.32em] text-blush">THE GREAT BABY RACE</p>
        <h1 className="mt-3 font-display text-5xl italic leading-none">Almost ready</h1>
        <p className="mt-4 text-white/75">
          Add the Supabase project URL and anon key, then refresh. The service-role key stays out of this app.
        </p>
        <ul className="mt-6 space-y-2">
          {missing.map((name) => (
            <li key={name} className="rounded-2xl bg-white/10 px-4 py-3 font-mono text-sm">
              {name}
            </li>
          ))}
        </ul>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-white/75">
          <li>Create a Supabase project and run the SQL file in the README.</li>
          <li>Copy <span className="font-mono">.env.example</span> to <span className="font-mono">.env.local</span>.</li>
          <li>Restart <span className="font-mono">npm run dev</span>.</li>
        </ol>
      </main>
    </div>
  )
}
