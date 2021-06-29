const util = require('../helper/util');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const DocClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USER_TABLE;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event, ctxt)=>{
    try {
        let input = JSON.parse(event.body);
        let {email, password} = input;

        let user = await DocClient.scan({
            TableName: tableName,
            FilterExpression: "#email = :email_val",
            ExpressionAttributeNames: {
                "#email": "email",
            },
            ExpressionAttributeValues: { ":email_val": email }
          }).promise();

          if(user.Count===0) {
              throw new Error("User not found");
          }

          let isCorrectPassword = await bcrypt.compare(password, user.Items[0].password);
          
          if(!isCorrectPassword) {
              throw new Error("Wrong Password!!");
          }

          let accessToken =  jwt.sign({
            id: user.userId,
            email: user.emai,
            name: user.name
        }, JWT_SECRET);
    

        return {
            statusCode: 200,
            headers: util.getResponseHeader(),
            body: JSON.stringify({
                token: accessToken
            })
        }
    } catch(err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode? err.statusCode : 500,
            headers: util.getResponseHeader(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown Error"
            })
        }
    }
}