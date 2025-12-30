require('dotenv').config();
const app = require('./src/app');
const PORT = process.env.PORT;
const { connectDB } = require('./src/config/database');

connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

    