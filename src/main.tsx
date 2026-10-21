import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-dvh place-items-center px-6 text-center">
          <div>
            <p className="font-display text-4xl">The race hit a snag</p>
            <p className="mt-3 text-white/70">Refresh this screen. Votes already saved are still in the database.</p>
            <button
              type="button"
              className="mt-6 rounded-full bg-white px-5 py-3 font-extrabold text-[#2a1438]"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
