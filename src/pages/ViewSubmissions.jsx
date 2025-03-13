import { useState, useEffect } from 'react'
import {
  Box,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Edit as EditIcon } from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

const documentTypes = [
  'Carta d\'identità',
  'Passaporto',
  'Patente',
]

export default function ViewSubmissions() {
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editDialog, setEditDialog] = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    loadSubmissions()
  }, [user, isAdmin])

  const loadSubmissions = async () => {
    try {
      // Prima ottieni i profili se sei admin
      let userProfiles = {}
      if (isAdmin) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
        
        userProfiles = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {}) || {}
      }

      // Query per gli ospiti e le prenotazioni
      const query = supabase
        .from('guests')
        .select(`
          *,
          bookings (*)
        `)
        .eq('status', 'submitted')
        .order('is_main_guest', { ascending: false })

      // Se non è admin, filtra solo le proprie registrazioni
      if (!isAdmin) {
        query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      // Organizza i dati per prenotazione
      const groupedData = data.reduce((acc, guest) => {
        if (!guest.bookings) return acc
        
        const bookingId = guest.booking_id
        if (!acc[bookingId]) {
          acc[bookingId] = {
            booking: guest.bookings,
            guests: [],
            userData: isAdmin && userProfiles[guest.user_id] ? userProfiles[guest.user_id] : null
          }
        }
        acc[bookingId].guests.push(guest)
        return acc
      }, {})

      setSubmissions(groupedData)
    } catch (error) {
      setError('Errore nel caricamento delle registrazioni: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (guest) => {
    setEditingGuest(guest)
    setEditDialog(true)
  }

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('guests')
        .update({
          firstName: editingGuest.firstName,
          lastName: editingGuest.lastName,
          address: editingGuest.address,
          documentType: editingGuest.documentType,
          documentNumber: editingGuest.documentNumber,
          stayDuration: editingGuest.stayDuration,
        })
        .eq('id', editingGuest.id)

      if (error) throw error

      setSuccess('Modifiche salvate con successo')
      setEditDialog(false)
      loadSubmissions()
    } catch (error) {
      setError('Errore durante il salvataggio: ' + error.message)
    }
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditingGuest(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography>Caricamento...</Typography>
      </Box>
    </Container>
  )

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Registrazioni Completate {isAdmin && '(Amministratore)'}
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

        {Object.keys(submissions).length === 0 ? (
          <Alert severity="info">
            Nessuna registrazione finalizzata trovata
          </Alert>
        ) : (
          Object.entries(submissions).map(([bookingId, { booking, guests, userData }]) => (
            booking && (
              <Accordion key={bookingId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    Prenotazione {booking.code || 'N/A'} - Camera {booking.room_number || 'N/A'} - 
                    Check-in: {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : 'N/A'}
                    {isAdmin && userData && ` - Utente: ${userData.full_name}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dettagli Prenotazione
                      </Typography>
                      <Typography>
                        Camera: {booking.room_number || 'N/A'}
                      </Typography>
                      <Typography>
                        Check-in: {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography>
                        Check-out: {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography>
                        Intestatario: {booking.guest_name || 'N/A'}
                      </Typography>
                      {isAdmin && userData && (
                        <Typography>
                          Registrato da: {userData.full_name}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nome</TableCell>
                          <TableCell>Cognome</TableCell>
                          <TableCell>Indirizzo</TableCell>
                          <TableCell>Documento</TableCell>
                          <TableCell>Durata</TableCell>
                          {isAdmin && <TableCell>Azioni</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {guests.map((guest) => (
                          <TableRow 
                            key={guest.id}
                            sx={guest.is_main_guest ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' } : {}}
                          >
                            <TableCell>{guest.firstName || 'N/A'}</TableCell>
                            <TableCell>{guest.lastName || 'N/A'}</TableCell>
                            <TableCell>{guest.address || 'N/A'}</TableCell>
                            <TableCell>
                              {guest.documentType || 'N/A'} - {guest.documentNumber || 'N/A'}
                            </TableCell>
                            <TableCell>{guest.stayDuration || 'N/A'} giorni</TableCell>
                            {isAdmin && (
                              <TableCell>
                                <Button
                                  startIcon={<EditIcon />}
                                  onClick={() => handleEdit(guest)}
                                  size="small"
                                >
                                  Modifica
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )
          ))
        )}
      </Box>

      {/* Dialog per la modifica */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Modifica Ospite
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nome"
                  name="firstName"
                  value={editingGuest?.firstName || ''}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Cognome"
                  name="lastName"
                  value={editingGuest?.lastName || ''}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Indirizzo"
                  name="address"
                  value={editingGuest?.address || ''}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo Documento</InputLabel>
                  <Select
                    name="documentType"
                    value={editingGuest?.documentType || ''}
                    label="Tipo Documento"
                    onChange={handleEditChange}
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
                  value={editingGuest?.documentNumber || ''}
                  onChange={handleEditChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Durata Soggiorno (giorni)"
                  name="stayDuration"
                  type="number"
                  value={editingGuest?.stayDuration || ''}
                  onChange={handleEditChange}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}