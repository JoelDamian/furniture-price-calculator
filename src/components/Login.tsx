import React, { useState, useCallback } from 'react';
import { Typography, Button, Container, TextField, Box } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useLoadingStore } from '../store/loadingStore';

export const Login: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const startLoading = useLoadingStore((state) => state.startLoading);
  const stopLoading = useLoadingStore((state) => state.stopLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      startLoading();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      login(user.uid);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al iniciar sesión: ' + errorMessage);
    } finally {
      stopLoading();
    }
  }, [email, password, login, startLoading, stopLoading]);

  return (
    <Container sx={{ mt: 10 }}>
      <Typography variant="h5" gutterBottom>Iniciar sesión</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={handleEmailChange}
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={handlePasswordChange}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Ingresar
        </Button>
      </Box>
    </Container>
  );
};
