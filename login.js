const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var crypto = require("crypto")

const API_ADDRESS = "https://b2an77dzf7.execute-api.us-east-1.amazonaws.com/default/MQTThomeAuth"

exports.handleLogin = (event, callback) => {
    var response = {
        statusCode: 404,
        headers: {
            "Content-Type" : "text/html"
        },
        body: "error"
    };
        
    var email = event.queryStringParameters.email
    var password = event.queryStringParameters.password
    
    if(password == null || email == null) {
        callback(null, response)
    }

    var params = {
      ExpressionAttributeValues: {
       ":a": {
           S: email
       },
      },
      FilterExpression: "email = :a",
      TableName: "MQTThomeUsers"
     };

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            var response = {
                statusCode: 301,
                headers: {
                    "Location" : API_ADDRESS + "?login=" + "failed" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                },
                body: null
            };
            callback(null, response);
        } else {
            if(data["Count"] != 0) {
                if(isPasswordCorrect(data.Items[0].passwordHash.S, data.Items[0].passwordSalt.S, password)) {
                    
                    //put state in DB
                    updateState(email, event.queryStringParameters.state, function(err, data) {
                        if(err) {
                            console.log(err)
                        }
                        
                        var response = {
                            statusCode: 301,
                            headers: {
                                "Location" : API_ADDRESS +  "/Edit?redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                            },
                            body: null
                        };
                        callback(null, response);
                    })
                } else {
                        var response = {
                            statusCode: 302,
                            headers: {
                                "Location" : API_ADDRESS + "?login=" + "failed" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                            },
                            body: null
                        };
                        callback(null, response);
                }
                
            } else {
                var response = {
                    statusCode: 302,
                    headers: {
                        "Location" : API_ADDRESS + "?login=" + "failed" + "&redirect_uri=" + event.queryStringParameters.redirect_uri + "&state=" + event.queryStringParameters.state
                    },
                    body: null
                };
                callback(null, response);
            }

        }

     });
}

function isPasswordCorrect(savedHash, savedSalt, passwordAttempt) {
    return savedHash == crypto.pbkdf2Sync(passwordAttempt, savedSalt, 100000, 64, 'sha512');
}

function updateState(email, state, callback) {
    var params = {
        ExpressionAttributeNames: {
            "#S": "authState"
        },
        ExpressionAttributeValues: {
            ":s": {
                S: state
            }
        },
        Key: {
            "email": {
                S: email
            },
        },
        ReturnValues: "UPDATED_NEW",
        TableName: "MQTThomeUsers",
        UpdateExpression: "SET #S = :s"
    };

    dynamodb.updateItem(params, callback)
}