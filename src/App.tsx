import { MindmapCanvas } from './features/mindmap/components/MindmapCanvas'
import { LoginScreen } from './features/auth/LoginScreen'
import { useAuth } from './features/auth/useAuth'

function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  return user ? <MindmapCanvas /> : <LoginScreen />
}

export default App
