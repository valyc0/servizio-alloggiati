import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navigation from './components/Navigation'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import GuestRegistration from './pages/GuestRegistration'
import ReviewGuests from './pages/ReviewGuests'
import ViewSubmissions from './pages/ViewSubmissions'
import EditGuest from './pages/EditGuest'
import './App.css'

// Route protetta che verifica l'autenticazione
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/register" />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute adminOnly>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/register" 
              element={
                <PrivateRoute>
                  <GuestRegistration />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/review" 
              element={
                <PrivateRoute>
                  <ReviewGuests />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/submissions" 
              element={
                <PrivateRoute>
                  <ViewSubmissions />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/edit-guest/:guestId" 
              element={
                <PrivateRoute>
                  <EditGuest />
                </PrivateRoute>
              } 
            />

            <Route 
              path="/" 
              element={<Navigate to="/register" />} 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
