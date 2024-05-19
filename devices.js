const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();


exports.handleDevices = (event, callback) => {

    let state = event.queryStringParameters.state
    
    
    getDevicesWithState(state, function(err, data) {
        if(err) {
            var response = {
                statusCode: 403,
                headers: {
                    "Access-Control-Allow-Origin" : "*",
                    'Content-Type' : 'text/json'
                },
                body: null
            };
            callback(null, response);
        } else {
            var response = {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin" : "*",
                    'Content-Type' : 'text/json'
                },
                body: data
            };
            callback(null, response);
        }
    })
}

function getDevicesWithState(state, callback) {
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
            callback(err)
        } else {
            if(data["Count"] == 1) {
                var devices = data.Items[0].devices.M
                console.log("FOUND USER DEVICES: " + JSON.stringify(devices))
                callback(null, JSON.stringify(devices))
            } else {
                console.log("couldnt find state")
                //couldnt find state in db
                callback(new Error("Couldn't find state in db"))
            }
        }
    });
}