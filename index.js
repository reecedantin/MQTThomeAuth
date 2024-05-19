var fs = require("fs")

var handlePost = require("./post").handlePost
var handleLogin = require("./login").handleLogin
var handleRegister = require("./register").handleRegister
var handleEdit = require("./edit").handleEdit
var handleDevices = require("./devices").handleDevices



exports.handler = (event, context, callback) => {
    console.log(event)
    console.log(context)
    
    var response = {}
    
    
    if(event.httpMethod === "GET") {
        if(event.path === "/MQTThomeAuth") {
            sendHTML("./login.html", callback)
        } else if(event.path === "/MQTThomeAuth/Login") {
            handleLogin(event, callback)
        } else if(event.path === "/MQTThomeAuth/Register") {
            handleRegister(event, callback)
        } else if(event.path === "/MQTThomeAuth/Edit") {
            sendHTML("./edit.html", callback)
        } else if(event.path === "/MQTThomeAuth/Edit/Save") {
            handleEdit(event, callback)
        } else if(event.path === "/MQTThomeAuth/Edit/Devices") {
            handleDevices(event, callback)
        }
    } else if(event.httpMethod === "POST") {
        handlePost(event, callback)
    }
   
    
};

function sendHTML(path, callback) {
    fs.readFile(path, function read(err, data) {
        if (err) {
            console.log(err)
            callback(err, null);
        }
        
        var response = {
            statusCode: 200,
            headers: {
                "Content-Type" : "text/html"
            },
            body: data.toString()
        };
        
        console.log(data)
        
        callback(null, response);
    });
}