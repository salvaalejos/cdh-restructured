import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import DashboardLayout from './components/layout/DashboardLayout'
import UsersPage from './features/users/pages/UsersPage'
import FormsPage from './features/forms/pages/FormsPage'
import FormBuilderPage from './features/forms/pages/FormBuilderPage'
import FormPreviewPage from './features/forms/pages/FormPreviewPage'
import AssignmentsPage from './features/assignments/pages/AssignmentsPage'
import ResultsPage from './features/responses/pages/ResultsPage'
import ResponseDetailsPage from './features/responses/pages/ResponseDetailsPage'
import AccountPage from './features/account/pages/AccountPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import { PermissionRoute } from './components/layout/PermissionRoute'
import { Toaster } from 'sonner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}



function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/admin" replace /> : <Login />} />
        
        {/* Rutas Protegidas del Dashboard Admin usando el Layout */}
        <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<PermissionRoute permissionKey="manageUsers"><UsersPage /></PermissionRoute>} />
          <Route path="forms" element={<PermissionRoute permissionKey="viewSurveys"><FormsPage /></PermissionRoute>} />
          <Route path="forms/create" element={<PermissionRoute permissionKey="createSurvey"><FormBuilderPage /></PermissionRoute>} />
          <Route path="forms/edit/:id" element={<PermissionRoute permissionKey="createSurvey"><FormBuilderPage /></PermissionRoute>} />
          <Route path="forms/:id/preview" element={<PermissionRoute permissionKey="viewSurveys"><FormPreviewPage /></PermissionRoute>} />
          <Route path="asignaciones" element={<PermissionRoute permissionKey="assignUsers"><AssignmentsPage /></PermissionRoute>} />
          <Route path="results" element={<PermissionRoute permissionKey="viewIndividualResults"><ResultsPage /></PermissionRoute>} />
          <Route path="results/:id" element={<PermissionRoute permissionKey="viewIndividualResults"><ResponseDetailsPage /></PermissionRoute>} />
          <Route path="account" element={<PermissionRoute blockRole={2}><AccountPage /></PermissionRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toaster richColors position="top-right" closeButton />
    </BrowserRouter>
  )
}

export default App
