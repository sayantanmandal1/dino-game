import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <Paper sx={{ p: 4, maxWidth: 640 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>Something went wrong.</Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              {String(this.state.error.message || this.state.error)}
            </Typography>
            <Button variant="contained" onClick={() => this.setState({ error: null })}>
              Dismiss
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
