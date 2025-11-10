import React, { useState } from 'react';
import { Typography, Button, Container, TextField, Box } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase'; // Asegúrate de tener tu configuración en firebase.ts
import { useAuthStore } from '../store/authStore';

export const Login = () => {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      login(user.uid); // Guarda el estado global de login con su ID
      sessionStorage.setItem('isAuthenticated', 'true');
    } catch (err: any) {
      setError('Error al iniciar sesión: ' + err.message);
    }
  };

  return (
    <Container sx={{ mt: 10 }}>
      <Typography variant="h5" gutterBottom>Iniciar sesión</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Ingresar
        </Button>
      </Box>
    </Container>
  );
};
