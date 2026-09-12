import { Toaster } from 'sonner'
import { MindmapCanvas } from './features/mindmap/components/MindmapCanvas'
import { TemplateSelectModal } from './features/mindmap/components/TemplateSelectModal'
import { useSheetsSync } from './features/mindmap/hooks/useSheetsSync'
import { useMindmapStore } from './features/mindmap/store/mindmapStore'
import { HomeScreen } from './features/home/components/HomeScreen'
import { LoginScreen } from './features/auth/LoginScreen'
import { useAuth } from './features/auth/useAuth'

function App() {
  const { user, loading } = useAuth()
  const currentView = useMindmapStore((s) => s.currentView)

  useSheetsSync(user ?? null)

  if (loading) return null

  return (
    <>
      {!user ? (
        <LoginScreen />
      ) : currentView === 'home' ? (
        <HomeScreen />
      ) : (
        <MindmapCanvas />
      )}
      <TemplateSelectModal />
      <Toaster position="bottom-right" richColors />
    </>
  )
}

export default App
