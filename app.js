const express = require('express');
const bodyParser = require('body-parser');
const userRouter = require('./routes/user-router');
const layananRouter = require('./routes/layanan-router');

const errorHandler = require('./middleware/error');
const app = express();
const PORT = process.env.PORT || 8080;

//set body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//set nakes routing
app.use('/api/user', userRouter);

//set layanan routing
app.use('/api/layanan', layananRouter);

//set middleware
app.use(errorHandler);

app.use(express.static('data_assets'));

//create server
app.listen(PORT, () => console.log(`Server running at port: ${PORT}`));































