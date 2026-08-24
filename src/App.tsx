import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AllFilmsPage } from './pages/AllFilmsPage'
import { PlanningsPage } from './pages/PlanningsPage'
import { WizardPage } from './pages/WizardPage'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<WizardPage />} />
          <Route path="/films" element={<AllFilmsPage />} />
          <Route path="/plannings" element={<PlanningsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
