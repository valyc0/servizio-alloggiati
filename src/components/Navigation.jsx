import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navigation() {
  const navigate = useNavigate()
  const { user, isAdmin, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) return null

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Alloggiati Web
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/register')}
          >
            Nuova Registrazione
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/review')}
          >
            Bozze
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/submissions')}
          >
            Completate
          </Button>
          {isAdmin && (
            <Button
              color="inherit"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          )}
          <Button
            color="inherit"
            onClick={handleLogout}
          >
            Esci
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}