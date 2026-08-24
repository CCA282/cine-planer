import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HistoryPage } from './pages/HistoryPage'
import { SeenFilmsPage } from './pages/SeenFilmsPage'
import { WizardPage } from './pages/WizardPage'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<WizardPage />} />
          <Route path="/vus" element={<SeenFilmsPage />} />
          <Route path="/historique" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
