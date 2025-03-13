import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

export default function ReviewGuests() {
  const [guests, setGuests] = useState([])
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      // Carica gli ospiti in stato draft
      const { data: guestsData, error: guestsError } = await supabase
        .from('guests')
        .select('*, bookings(*)')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('is_main_guest', { ascending: false })

      if (guestsError) throw guestsError

      setGuests(guestsData)
      
      // Se ci sono ospiti, imposta i dettagli della prenotazione
      if (guestsData && guestsData.length > 0) {
        setBooking(guestsData[0].bookings)
      }
    } catch (error) {
      setError('Errore nel caricamento degli ospiti: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (guestId) => {
    navigate(`/edit-guest/${guestId}`)
  }

  const handleDelete = async (guestId) => {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId)
        .eq('status', 'draft')

      if (error) throw error

      setSuccess('Ospite eliminato con successo')
      loadData()
    } catch (error) {
      setError('Errore durante l\'eliminazione: ' + error.message)
    }
  }

  const handleFinalize = async () => {
    if (guests.length === 0 || !booking) {
      setError('Nessun ospite da finalizzare')
      return
    }

    try {
      const { error } = await supabase.rpc('finalize_guests', {
        booking_id_param: booking.id
      })

      if (error) throw error

      setSuccess('Registrazione finalizzata con successo')
      setConfirmDialog(false)
      loadData()
    } catch (error) {
      setError('Errore durante la finalizzazione: ' + error.message)
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rivedi Registrazioni
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {booking && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dettagli Prenotazione
              </Typography>
              <Typography>
                Camera: {booking.room_number}
              </Typography>
              <Typography>
                Check-in: {new Date(booking.check_in_date).toLocaleDateString()}
              </Typography>
              <Typography>
                Check-out: {new Date(booking.check_out_date).toLocaleDateString()}
              </Typography>
              <Typography>
                Intestatario: {booking.guest_name}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Paper elevation={3} sx={{ p: 3 }}>
          {loading ? (
            <Typography>Caricamento...</Typography>
          ) : guests.length === 0 ? (
            <Typography>Nessuna registrazione in bozza</Typography>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Cognome</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Durata</TableCell>
                      <TableCell>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow 
                        key={guest.id}
                        sx={guest.is_main_guest ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' } : {}}
                      >
                        <TableCell>{guest.firstName}</TableCell>
                        <TableCell>{guest.lastName}</TableCell>
                        <TableCell>{guest.documentNumber}</TableCell>
                        <TableCell>{guest.stayDuration} giorni</TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleEdit(guest.id)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDelete(guest.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                >
                  Aggiungi Altri Ospiti
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setConfirmDialog(true)}
                >
                  Finalizza Registrazione
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* Dialog di conferma finalizzazione */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>
          Conferma Finalizzazione
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler finalizzare la registrazione? 
            Dopo la finalizzazione non sarà più possibile modificare i dati.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleFinalize}
            variant="contained"
            color="primary"
          >
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}