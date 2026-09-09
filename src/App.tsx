import { Toaster } from 'sonner'
import { MindmapCanvas } from './features/mindmap/components/MindmapCanvas'
import { LoginScreen } from './features/auth/LoginScreen'
import { useAuth } from './features/auth/useAuth'
import { ErrorBoundary } from './ErrorBoundary'

function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <ErrorBoundary>
      {user ? <MindmapCanvas /> : <LoginScreen />}
      <Toaster position="bottom-right" richColors />
    </ErrorBoundary>
  )
}

export default App
