const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

const API_ADDRESS = "https://b2an77dzf7.execute-api.us-east-1.amazonaws.com/default/MQTThomeAuth"

exports.handleEdit = (event, callback) => {


    var auth_code = generateRandomAuthCode()

    //parse data
    let names = event.multiValueQueryStringParameters.name
    let types = event.multiValueQueryStringParameters.type
    let addresses = event.multiValueQueryStringParameters.address
    let ports = event.multiValueQueryStringParameters.port
    let topics = event.multiValueQueryStringParameters.topic
    let onMessages = event.multiValueQueryStringParameters.onMessage
    let offMessages = event.multiValueQueryStringParameters.offMessage

    let state = event.queryStringParameters.state
    let redirect_uri = event.queryStringParameters.redirect_uri

    var devices = {}
    console.log(names)
    if(names != null) {
        for(var i = 0; i < names.length; i++ ) {
            if(names[i] !== "") {
                devices["device" + i] = {
                    "M" : {
                        "name" :      { S : names[i] },
                        "type" :      { S : types[i] },
                        "address" :   { S : addresses[i] },
                        "port" :      { S : ports[i] },
                        "topic" :     { S : topics[i] },
                        "onMessage" :   { S : onMessages[i] },
                        "offMessage" :   { S : offMessages[i] }
                    }
                }
            }
        }
    }
    
    console.log("UPDATING USER: " + state + "\nDEVICES: " + devices + "\nAUTH CODE: " + auth_code)
    
    var redirect = event.queryStringParameters.redirect_uri
    if(redirect == null)  {
        redirect = API_ADDRESS
    }
    
    
    updateUserWithState(state, devices, auth_code, function(err, response) {
        if(err) {
            var response = {
                statusCode: 403,
                headers: {},
                body: null
            };
            callback(null, response);
        } else {
            var response = {
                statusCode: 301,
                headers: {
                    "Location" : redirect + "?state=" + event.queryStringParameters.state + "&code=" + auth_code
                },
                body: null
            };
            callback(null, response);
        }
    })
}

function generateRandomAuthCode() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 26; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function updateUserWithState(state, devices, authcode, callback) {
    var params = {
      ExpressionAttributeValues: {
       ":a": {
           S: state
       },
      },
      FilterExpression: "authState = :a",
      TableName: "MQTThomeUsers"
     };

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            //err looking for state
        } else {
            if(data["Count"] != 0) {
                var email = data.Items[0].email.S
                console.log("FOUND USER: " + email)

                var params = {
                    ExpressionAttributeNames: {
                        "#D": "devices",
                        "#A": "AuthCode"
                    },
                    ExpressionAttributeValues: {
                        ":d": {
                            M: devices
                        },
                        ":a": {
                            S: authcode
                        }
                    },
                    Key: {
                        "email": {
                            S: email
                        },
                    },
                    ReturnValues: "UPDATED_NEW",
                    TableName: "MQTThomeUsers",
                    UpdateExpression: "SET #D = :d, #A = :a"
                };

                dynamodb.updateItem(params, function(err, data) {
                    var response = {};
                    if (err) {
                        console.log(err)
                        callback(err)
                    } else {
                        callback(null, data)
                    }
                });

            } else {
                console.log("couldnt find state")
                //couldnt find state in db
            }
        }
    });
}
