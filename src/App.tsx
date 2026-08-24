import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ChromeProvider } from './lib/chromeContext'
import { AllFilmsPage } from './pages/AllFilmsPage'
import { HomePage } from './pages/HomePage'
import { PlanningsPage } from './pages/PlanningsPage'
import { WizardPage } from './pages/WizardPage'

export default function App() {
  return (
    <HashRouter>
      <ChromeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/films" element={<AllFilmsPage />} />
            <Route path="/plannings" element={<PlanningsPage />} />
          </Routes>
        </Layout>
      </ChromeProvider>
    </HashRouter>
  )
}
