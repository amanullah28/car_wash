const util = require('../helper/util');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const DocClient = new AWS.DynamoDB.DocumentClient();
const table = process.env.USER_TABLE;
const { v4: uuidv4 } = require('uuid');
const uType = require('../helper/userType');
const bcrypt = require('bcrypt');


exports.handler = async (event, ctxt)=>{
    
    try {
        let input = JSON.parse(event.body);
        let hashPassword = await bcrypt.hash(input.password, 10);
        let readParams = {
            TableName: table,
            FilterExpression : "email = :e",
            ExpressionAttributeValues : {
                ":e": input.email
            }
        }

        let result = await DocClient.scan(readParams).promise();

        if(result.Items.length>0) {
            throw new Error("User Already Exist with the given email!!")
        }

        let params = {
            TableName: table,
            Item: {
                userId: uuidv4(),
                email: input.email,
                password: hashPassword,
                name: input.name,
                userType: uType.CAR_WASHER,
                isActive: true,
                address: input.address,
                createdAt: Date.now()
            }
        };

        await DocClient.put(params).promise();

        return {
            statusCode: 200,
            headers: util.getResponseHeader(),
            body: JSON.stringify({
                message: "User Created Successfully!!",
                tableName: table,
                data: input
            })
        }
    } catch(err) {
        console.log("Error", err);
        return {
            statusCode: err.statusCode? err.statusCode : 500,
            headers: util.getResponseHeader(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown Error",
                errorBody: err.stack
            })
        }
    }
}