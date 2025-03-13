import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

const documentTypes = [
  'Carta d\'identità',
  'Passaporto',
  'Patente',
]

export default function EditGuest() {
  const { guestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [guest, setGuest] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadGuest()
  }, [guestId])

  const loadGuest = async () => {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*, bookings(*)')
        .eq('id', guestId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .single()

      if (error) throw error
      if (!data) throw new Error('Ospite non trovato o non modificabile')
      
      setGuest(data)
      setBooking(data.bookings)
    } catch (error) {
      setError('Errore nel caricamento dei dati: ' + error.message)
      navigate('/review')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setGuest(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error } = await supabase
        .from('guests')
        .update({
          firstName: guest.firstName,
          lastName: guest.lastName,
          address: guest.address,
          documentType: guest.documentType,
          documentNumber: guest.documentNumber,
          stayDuration: guest.stayDuration,
        })
        .eq('id', guestId)
        .eq('user_id', user.id)
        .eq('status', 'draft')

      if (error) throw error

      setSuccess('Dati aggiornati con successo')
      setTimeout(() => {
        navigate('/review')
      }, 1500)
    } catch (error) {
      setError('Errore durante l\'aggiornamento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Typography>Caricamento...</Typography>
  if (!guest) return <Typography>Ospite non trovato</Typography>

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Modifica Ospite
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
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nome"
                  name="firstName"
                  value={guest.firstName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Cognome"
                  name="lastName"
                  value={guest.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Indirizzo"
                  name="address"
                  value={guest.address}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo Documento</InputLabel>
                  <Select
                    name="documentType"
                    value={guest.documentType}
                    label="Tipo Documento"
                    onChange={handleChange}
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
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Durata Soggiorno (giorni)"
                  name="stayDuration"
                  type="number"
                  value={guest.stayDuration}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/review')}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                {loading ? 'Salvataggio...' : 'Salva'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}