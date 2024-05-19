var queryString = require('querystring');
const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handlePost = (event, callback) => {
    console.log("POST: " + JSON.stringify(event))

    var data = queryString.parse(event.body)

    if(data.grant_type === "authorization_code") {
        //check for code in db. create refresh and access, put those in db. send back access and refresh
        handleAuthCode(data, function(err, data) {
            if(err) {

            } else {
                let postResponse = {
                    "access_token" : data.Attributes.access_token.S,
                    "refresh_token" : data.Attributes.refresh_token.S,
                    "expires_in" : 360
                }

                var response = {
                    statusCode: 200,
                    body: JSON.stringify(postResponse)
                };
                callback(null, response);
            }
        })
    } else if(data.grant_type === "refresh_token") {
        //check for refresh token in db, generate new tokens and return them
        handleRefreshToken(data, function(err, data) {
            if(err) {

            } else {
                let postResponse = {
                    "access_token" : data.Attributes.access_token.S,
                    "refresh_token" : data.Attributes.refresh_token.S,
                    "expires_in" : 360
                }

                var response = {
                    statusCode: 200,
                    body: JSON.stringify(postResponse)
                };
                callback(null, response);
            }
        })
    }


}

function handleAuthCode(data, callback) {
    var params = {
      ExpressionAttributeValues: {
       ":a": {
           S: data.code
       },
      },
      FilterExpression: "AuthCode = :a",
      TableName: "MQTThomeUsers"
     };

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            callback(err)
            //err looking for state
        } else {
            if(data["Count"] != 0) {
                var email = data.Items[0].email.S
                var accessToken = createToken()
                var refreshToken = createToken()

                console.log("FOUND USER: " + email)

                var params = {
                    ExpressionAttributeNames: {
                        "#AT": "access_token",
                        "#RT": "refresh_token"
                    },
                    ExpressionAttributeValues: {
                        ":at": {
                            S: accessToken
                        },
                        ":rt": {
                            S: refreshToken
                        }
                    },
                    Key: {
                        "email": {
                            S: email
                        },
                    },
                    ReturnValues: "UPDATED_NEW",
                    TableName: "MQTThomeUsers",
                    UpdateExpression: "SET #AT = :at, #RT = :rt"
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
                callback(err)
            }
        }
    });
}

function handleRefreshToken(data, callback) {
    var params = {
      ExpressionAttributeValues: {
       ":rt": {
           S: data.refresh_token
       },
      },
      FilterExpression: "refresh_token = :rt",
      TableName: "MQTThomeUsers"
     };

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err)
            callback(err)
            //err looking for state
        } else {
            if(data["Count"] != 0) {
                var email = data.Items[0].email.S
                var accessToken = createToken()
                var refreshToken = createToken()

                console.log("FOUND USER: " + email)

                var params = {
                    ExpressionAttributeNames: {
                        "#AT": "access_token",
                        "#RT": "refresh_token"
                    },
                    ExpressionAttributeValues: {
                        ":at": {
                            S: accessToken
                        },
                        ":rt": {
                            S: refreshToken
                        }
                    },
                    Key: {
                        "email": {
                            S: email
                        },
                    },
                    ReturnValues: "UPDATED_NEW",
                    TableName: "MQTThomeUsers",
                    UpdateExpression: "SET #AT = :at, #RT = :rt"
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
                callback(err)
            }
        }
    });
}

function createToken() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 26; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
