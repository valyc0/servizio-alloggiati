import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { supabase } from '../config/supabase'

const initialGuestData = {
  firstName: '',
  lastName: '',
  address: '',
  documentType: '',
  documentNumber: '',
  stayDuration: '',
}

const documentTypes = [
  'Carta d\'identità',
  'Passaporto',
  'Patente',
]

export default function GuestRegistration() {
  const { user } = useAuth()
  const [mainGuest, setMainGuest] = useState(initialGuestData)
  const [additionalGuests, setAdditionalGuests] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState('')
  const [showBookingDialog, setShowBookingDialog] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'active')
        .order('check_in_date', { ascending: true })

      if (error) throw error
      setBookings(data)
    } catch (error) {
      setError('Errore nel caricamento delle prenotazioni: ' + error.message)
    }
  }

  const handleBookingSelect = () => {
    if (!selectedBooking) {
      setError('Seleziona una prenotazione')
      return
    }
    setShowBookingDialog(false)
  }

  const handleMainGuestChange = (e) => {
    const { name, value } = e.target
    setMainGuest(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdditionalGuestChange = (index, e) => {
    const { name, value } = e.target
    setAdditionalGuests(prev => {
      const newGuests = [...prev]
      newGuests[index] = {
        ...newGuests[index],
        [name]: value
      }
      return newGuests
    })
  }

  const addGuest = () => {
    setAdditionalGuests(prev => [...prev, { ...initialGuestData }])
  }

  const removeGuest = (index) => {
    setAdditionalGuests(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Insert main guest
      const { data: mainGuestData, error: mainGuestError } = await supabase
        .from('guests')
        .insert([
          {
            ...mainGuest,
            user_id: user.id,
            is_main_guest: true,
            booking_id: selectedBooking,
            status: 'draft'
          }
        ])
        .select()

      if (mainGuestError) throw mainGuestError

      // Insert additional guests if any
      if (additionalGuests.length > 0) {
        const { error: additionalGuestsError } = await supabase
          .from('guests')
          .insert(
            additionalGuests.map(guest => ({
              ...guest,
              user_id: user.id,
              is_main_guest: false,
              booking_id: selectedBooking,
              status: 'draft'
            }))
          )

        if (additionalGuestsError) throw additionalGuestsError
      }

      navigate('/review')
    } catch (error) {
      setError('Errore durante la registrazione: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Se non è stata selezionata una prenotazione, mostra il dialog di selezione
  if (showBookingDialog) {
    return (
      <Dialog 
        open={true} 
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Seleziona Prenotazione
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Prenotazione</InputLabel>
            <Select
              value={selectedBooking}
              label="Prenotazione"
              onChange={(e) => setSelectedBooking(e.target.value)}
            >
              {bookings.map((booking) => (
                <MenuItem key={booking.id} value={booking.id}>
                  {`${booking.guest_name} - Camera ${booking.room_number} - Check-in: ${new Date(booking.check_in_date).toLocaleDateString()}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/')}>
            Annulla
          </Button>
          <Button onClick={handleBookingSelect} variant="contained">
            Continua
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Registrazione Alloggiati
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={3} sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              Dati Capogruppo
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nome"
                  name="firstName"
                  value={mainGuest.firstName}
                  onChange={handleMainGuestChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Cognome"
                  name="lastName"
                  value={mainGuest.lastName}
                  onChange={handleMainGuestChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Indirizzo"
                  name="address"
                  value={mainGuest.address}
                  onChange={handleMainGuestChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo Documento</InputLabel>
                  <Select
                    name="documentType"
                    value={mainGuest.documentType}
                    label="Tipo Documento"
                    onChange={handleMainGuestChange}
                  >
                    {documentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Numero Documento"
                  name="documentNumber"
                  value={mainGuest.documentNumber}
                  onChange={handleMainGuestChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Durata Soggiorno (giorni)"
                  name="stayDuration"
                  type="number"
                  value={mainGuest.stayDuration}
                  onChange={handleMainGuestChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>

            {additionalGuests.map((guest, index) => (
              <Box key={index} sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Ospite Aggiuntivo {index + 1}
                  </Typography>
                  <IconButton onClick={() => removeGuest(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Nome"
                      name="firstName"
                      value={guest.firstName}
                      onChange={(e) => handleAdditionalGuestChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Cognome"
                      name="lastName"
                      value={guest.lastName}
                      onChange={(e) => handleAdditionalGuestChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Indirizzo"
                      name="address"
                      value={guest.address}
                      onChange={(e) => handleAdditionalGuestChange(index, e)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Tipo Documento</InputLabel>
                      <Select
                        name="documentType"
                        value={guest.documentType}
                        label="Tipo Documento"
                        onChange={(e) => handleAdditionalGuestChange(index, e)}
                      >
                        {documentTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Numero Documento"
                      name="documentNumber"
                      value={guest.documentNumber}
                      onChange={(e) => handleAdditionalGuestChange(index, e)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addGuest}
              >
                Aggiungi Ospite
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                {loading ? 'Salvataggio...' : 'Salva e Rivedi'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}