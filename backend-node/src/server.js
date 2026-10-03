import app from './app.js';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`CampusCare Node.js Express server running on port ${PORT}`);
});
