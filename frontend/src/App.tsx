import { Configuration, MainApi, ProjectApi } from './api-docs'
import { Flowbite, CustomFlowbiteTheme } from 'flowbite-react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useEnvService from './hooks/useEnvService'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProjectLayout } from './components/ProjectLayout'
import { ProjectList } from '@/components/projects/ProjectList'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n'

// Create API instance
export const mainApi = new MainApi(new Configuration({
  basePath: 'http://localhost:8000'
}))

// Create project API instance
export const projectApi = new ProjectApi(new Configuration({
  basePath: 'http://localhost:8000'
}));

// Custom theme configuration
const customTheme: CustomFlowbiteTheme = {
  sidebar: {
    item: {
      active: 'bg-cyan-700 text-white hover:bg-cyan-800 [&>svg]:text-white',
      base: 'group flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-200 [&>svg]:text-gray-500',
    }
  }
}

function App() {
  useEnvService()

  return (
    <I18nextProvider i18n={i18n}>
      <Flowbite theme={{ theme: customTheme }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/:projectId/*" element={<ProjectLayout />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer position='top-center' />
      </Flowbite>
    </I18nextProvider>
  )
}

export default App
