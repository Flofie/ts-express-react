import { CircularProgress, Grid, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import './App.css';

export default function App() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const discordCode = window.location.search
    ? window.location.search.split('=')[1]
    : '';

  useEffect(() => {
    try {
      fetch('/queryDiscord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discordCode }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
        })
        .catch((error) => {
          console.error('error queryDiscord', error);
          setError(error.message);
        })
        .finally(() => setBusy(false));
    } catch (error) {
      console.error('catch error', error);
    }
  }, []);

  return (
    <div className="App">
      <Grid container spacing={6} justifyContent="center" direction="column">
        <Grid item>
          {busy && <CircularProgress size={200} />}
          {error && (
            <Typography variant="h4" color="error">
              verification error: {error}
            </Typography>
          )}
          {!busy && !error && (
            <Typography variant="h4" color="primary">
              successfully verified
            </Typography>
          )}
        </Grid>
      </Grid>
    </div>
  );
}
