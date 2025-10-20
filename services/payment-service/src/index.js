require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Payment service listening on ${PORT}`);
});
