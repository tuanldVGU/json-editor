// Variable

const http = require("http"); //HTTP Protocol
var express = require("express"); //Express Framework
var cors = require("cors"); // Enable CORS Requests 
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var app = express();

//Middleware and config
//body-parser
app.use(bodyParser.json());
app.use(bodyParser.json({type: "application/vnd.api+json"}));
app.use(bodyParser.urlencoded({extended: false}));
// cookieParser
app.use(cookieParser());
//public folder
app.use(express.static(path.join(__dirname,"")));

// Cors
corsOptions = {
    origin: 'https://json-editor-for-security-model.herokuapp.com',
    credentials: true
}

// Routing
app.get("/", function(req, res,next) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.options("/api/checkDM", cors(corsOptions));

app.put("/api/checkDM",cors(corsOptions), function(req,res,next){
  const json_string = req.body.data;
  let dm_vaidate = require("./src/assets/js/customValidate");
  try {
    console.log(req.body);
    JSON.parse(json_string);
    let err = dm_vaidate.formatValidate(json_string);
    console.log(err);
    if (err.length < 1) res.send(true);
    else res.send(false);
  } catch (err){
    console.log(err);
    res.send(false);
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
http.createServer(app).listen(PORT,function(){
	console.log("App running on port "+ PORT);
});

module.exports = app;