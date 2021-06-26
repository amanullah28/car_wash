const util = require('../util');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const DocClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.CAR_WASHER_TABLE;


exports.handler = async (event, ctxt)=>{
    try {
        return {
            statusCode: 200,
            headers: util.getResponseHeader(),
            body: JSON.stringify()
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