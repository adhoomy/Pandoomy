import { useState } from 'react';
import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Box, TextField, Button, Typography, Stack } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(firestore, 'users', user.uid), { name });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      bgcolor="#ffdab9"
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <Typography variant="h4">{isLogin ? 'Pandoomy Login' : 'Pandoomy Sign Up'}</Typography>
      <Stack spacing={2} width="300px">
        {!isLogin && (
          <TextField
            variant="outlined"
            label="Name or Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{ backgroundColor: '#fff' }} // White background for Name or Company Name
          />
        )}
        <TextField
          variant="outlined"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          sx={{ backgroundColor: '#fff' }} // White background for Email
        />
        <TextField
          variant="outlined"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ backgroundColor: '#fff' }} // White background for Password
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#4B371C',
            '&:hover': {
              backgroundColor: '#6F5B3E',
            },
          }}
          onClick={handleAuth}
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </Button>
        <Button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
        </Button>
      </Stack>
    </Box>
  );
}
