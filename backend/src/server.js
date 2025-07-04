const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const calculationRoutes = require('./routes/calculationRoutes');
const skuRoutes = require('./routes/skuRoutes');
const truckTypeRoutes = require('./routes/truckTypeRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use('/api', calculationRoutes);
app.use('/api', skuRoutes);
app.use('/api', truckTypeRoutes);

app.get('/', (req, res) => {
  res.send('Truck Utilization Calculator Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 