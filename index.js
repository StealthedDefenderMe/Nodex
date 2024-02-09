const connectDB = require("./db")
const express = require("express")
connectDB()
const cors = require('cors')
const app = express()
const PORT = 8000

// To access the req.body you use middleware..
app.use(express.json())

// Configuring cors middleware to allow requests only from http://localhost:3000
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

// Using CORS middleware..
app.use(cors(corsOptions));


// Available routes..
app.use('/api/auth', require('./routes/Auth'))
app.use('/api/user', require('./routes/Userdetails'))
app.use('/api/about', require('./routes/About'))
app.use('/api/services', require('./routes/Services'))

// test route..
const dataArray = [{"id": 1,"name": "Baman Baman"}, 
{"id": 2,"name": "Martand Dhamdhere"},
{"id": 3,"name": "Baburao Ganpatrao Apate"},
{"id": 4,"name": "Vasooli Bhai"},
{"id": 5,"name": "Doctor Ghungroo"},
{"id": 8,"name": "Venugopal Aiyyar"}]

// Define an endpoint to send the array to the frontend..
app.get('/api/test/data', (req, res) => {
  res.json({ data: dataArray });
});

app.listen(PORT, ()=>{
    console.log(`PORT ${PORT} is live`)
})