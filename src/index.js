// import express package(commonJS syntax)
const express = require('express')
const bodyParser = require('body-parser');
const route = require('./routes/route');
const  mongoose = require('mongoose');
// instatiate the express app  
const app = express()
app.use(bodyParser.json());  
   
mongoose.connect("mongodb+srv://Anjali-11:Krishna@cluster0.hhecqj7.mongodb.net/Anjali45")
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
   console.log('Express app running on port ' + (process.env.PORT || 3000))
}) 