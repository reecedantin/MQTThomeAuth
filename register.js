const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var crypto = require("crypto")

var handleLogin = require("./login").handleLogin

const API_ADDRESS = "https://b2an77dzf7.execute-api.us-east-1.amazonaws.com/default/MQTThomeAuth"


exports.handleRegister = (event, callback) => {
    
    var email = event.queryStringParameters.email
    var password = event.queryStringParameters.password

    var hasheditems = hashPassword(password)
    
    handleLogin(event, function(error, response) {
        console.log(error, response)
        if((response.statusCode == 404 || response.statusCode == 302) && !error) {
            var params = {
                Item: {
                    "email": {
                        S: email                       //create user
                    },
                    "passwordHash": {
                        S: hasheditems.hash.toString()
                    },
                    "passwordSalt": {
                        S: hasheditems.salt.toString()
                    },
                    "devices": {
                        M: {}
                    }
                },
                TableName: "MQTThomeUsers"
            };
        
            var response = {
                statusCode: 404
            }
        
            dynamodb.putItem(params, function(err, data) {
                if (err) {
                    console.log("ERROR REGISTERING USER: " + email)
                    console.log(err, err.stack); // an error occurred
                    response = {
                        statusCode: 301,
                        headers: {
                            "Location" : API_ADDRESS + "?status=dberr&register=" + "failed" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                        },
                        body: null
                    };
                    callback(null, response);
                } else {
                    response = {
                        statusCode: 301,
                        headers: {
                            "Location" : API_ADDRESS + "?register=" + "success" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                        },
                        body: null
                    };
                    callback(null, response);
                }
             });
         } else {
             response = {
                statusCode: 301,
                headers: {
                    "Location" : API_ADDRESS + "?status=not404or302&register=" + "failed" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                },
                body: null
            };
            callback(null, response);
         }
    })
}

function hashPassword(password) {
    var salt = crypto.randomBytes(128).toString('base64');
    var hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

    return {
        salt: salt,
        hash: hash,
    };
}