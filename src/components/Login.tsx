import { Typography, Button, Container } from '@mui/material';
import { useAuthStore } from '../store/authStore';

export const Login = () => {
    const login = useAuthStore((state) => state.login);


    const handleLogin = () => {
        login();
        sessionStorage.setItem('isAuthenticated', 'true');
    };


    return (
        <Container sx={{ mt: 10 }}>
            <Typography variant="h5" gutterBottom>Iniciar sesión</Typography>
            <Button variant="contained" color="primary" onClick={handleLogin}>
                Ingresar
            </Button>
        </Container>
    );
};