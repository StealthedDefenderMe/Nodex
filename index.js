const connectDB = require("./db")
const express = require("express")
connectDB()
const app = express()
const PORT = 8000

// To access the req.body you use middleware
app.use(express.json())

// Available routes
app.use('/api/auth', require('./routes/Auth'))
app.use('/api/user', require('./routes/Userdetails'))

// test route
const dataArray = ["Prathamesh, ganesh, Rohit, Manikraj, Pritesh, tushar, praful"];

// Define an endpoint to send the array to the frontend
app.get('/api/test/data', (req, res) => {
  res.json({ data: dataArray });
});

app.listen(PORT, ()=>{
    console.log(`PORT ${PORT} is live`)
})