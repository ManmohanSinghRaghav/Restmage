import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, LinearProgress, CircularProgress
} from '@mui/material';
import { PersonAddOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
};

const Register: React.FC = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const theme = useTheme();
  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      showNotification('Account created! Welcome to REST✨MAGE.', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default', p: 2
    }}>
      <Box sx={{
        width: '100%', maxWidth: 440,
        p: { xs: 3, sm: 5 }, borderRadius: 3,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[8],
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 2 }}>
            <img src="/logo512.png" alt="Restmage Logo" style={{ width: 64, height: 64, borderRadius: 12 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            REST✨MAGE
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create your free workspace
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Username" name="username" margin="normal" required autoFocus
            value={form.username} onChange={handleChange}
            helperText="3-30 characters, letters, numbers, underscores"
          />
          <TextField
            fullWidth label="Email Address" name="email" type="email" margin="normal" required
            value={form.email} onChange={handleChange}
          />
          <TextField
            fullWidth label="Password" name="password" margin="normal" required
            type={showPassword ? 'text' : 'password'}
            value={form.password} onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(v => !v)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          {form.password && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength.score / 5) * 100}
                sx={{
                  height: 4, borderRadius: 2,
                  '& .MuiLinearProgress-bar': { bgcolor: passwordStrength.color, transition: 'all 0.3s' }
                }}
              />
              <Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 600 }}>
                {passwordStrength.label}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth label="Confirm Password" name="confirmPassword" margin="normal" required
            type="password" value={form.confirmPassword} onChange={handleChange}
            error={form.confirmPassword !== '' && form.password !== form.confirmPassword}
            helperText={form.confirmPassword !== '' && form.password !== form.confirmPassword ? 'Passwords do not match' : ''}
          />

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <Typography align="center" variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;