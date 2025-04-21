import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Clear any previous errors

    try {
      const response = await fetch(`${config.AUTH_URL}/api/auth/login`, { // Replace '/api/login' with your actual API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // Sending plaintext email and password
      });

      if (response.ok) {
        // Assuming the API returns a success status and potentially some data
        const data = await response.json();
        console.log('Login successful:', data);
        // Store any necessary authentication tokens or user info here (e.g., in local storage or context)
        navigate('/home'); // Redirect to the homepage
      } else {
        // Handle login failure
        const errorData = await response.json();
        setError(errorData.message || 'Login failed. Please check your credentials.');
        console.error('Login failed:', errorData);
      }
    } catch (error) {
      setError('An error occurred during login.');
      console.error('Login error:', error);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default LoginPage;