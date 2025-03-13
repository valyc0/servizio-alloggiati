import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Collapse,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'

function Row({ mainGuest, additionalGuests }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            disabled={!additionalGuests?.length}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{mainGuest.booking_code}</TableCell>
        <TableCell>{mainGuest.firstName}</TableCell>
        <TableCell>{mainGuest.lastName}</TableCell>
        <TableCell>{mainGuest.documentType}</TableCell>
        <TableCell>{mainGuest.documentNumber}</TableCell>
        <TableCell>{mainGuest.stayDuration} giorni</TableCell>
        <TableCell>{new Date(mainGuest.created_at).toLocaleDateString('it-IT')}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Ospiti Aggiuntivi
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Cognome</TableCell>
                    <TableCell>Tipo Documento</TableCell>
                    <TableCell>Numero Documento</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {additionalGuests?.map((guest, index) => (
                    <TableRow key={index}>
                      <TableCell>{guest.firstName}</TableCell>
                      <TableCell>{guest.lastName}</TableCell>
                      <TableCell>{guest.documentType}</TableCell>
                      <TableCell>{guest.documentNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    documentType: '',
  })

  useEffect(() => {
    if (!isAdmin) return
    fetchRegistrations()
  }, [isAdmin])

  const fetchRegistrations = async () => {
    try {
      // Fetch main guests first
      const { data: mainGuests, error: mainError } = await supabase
        .from('guests')
        .select('*')
        .eq('is_main_guest', true)
        .order('created_at', { ascending: false })

      if (mainError) throw mainError

      // Fetch additional guests for each main guest
      const registrationsWithGuests = await Promise.all(
        mainGuests.map(async (mainGuest) => {
          const { data: additionalGuests, error: addError } = await supabase
            .from('guests')
            .select('*')
            .eq('booking_code', mainGuest.booking_code)
            .eq('is_main_guest', false)

          if (addError) throw addError

          return {
            mainGuest,
            additionalGuests,
          }
        })
      )

      setRegistrations(registrationsWithGuests)
    } catch (error) {
      setError('Errore nel caricamento delle registrazioni: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const searchLower = filters.search.toLowerCase()
    const mainGuest = reg.mainGuest

    // Filter by search term
    const matchesSearch =
      !filters.search ||
      mainGuest.firstName.toLowerCase().includes(searchLower) ||
      mainGuest.lastName.toLowerCase().includes(searchLower) ||
      mainGuest.documentNumber.toLowerCase().includes(searchLower) ||
      mainGuest.booking_code.toLowerCase().includes(searchLower)

    // Filter by document type
    const matchesDocType = !filters.documentType || mainGuest.documentType === filters.documentType

    return matchesSearch && matchesDocType
  })

  if (!isAdmin) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Accesso non autorizzato. È necessario essere amministratori.
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Amministratore
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cerca"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                helperText="Cerca per nome, cognome, numero documento o codice prenotazione"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Documento</InputLabel>
                <Select
                  value={filters.documentType}
                  label="Tipo Documento"
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, documentType: e.target.value }))
                  }
                >
                  <MenuItem value="">Tutti</MenuItem>
                  <MenuItem value="Carta d'identità">Carta d'identità</MenuItem>
                  <MenuItem value="Passaporto">Passaporto</MenuItem>
                  <MenuItem value="Patente">Patente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Codice Prenotazione</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Cognome</TableCell>
                  <TableCell>Tipo Documento</TableCell>
                  <TableCell>Numero Documento</TableCell>
                  <TableCell>Durata Soggiorno</TableCell>
                  <TableCell>Data Registrazione</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <Row
                    key={registration.mainGuest.id}
                    mainGuest={registration.mainGuest}
                    additionalGuests={registration.additionalGuests}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  )
}
