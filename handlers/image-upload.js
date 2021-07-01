'use strict'

const util = require('../helper/util');
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const DocClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const userTable = process.env.USER_TABLE;
const BUCKET_NAME = "car-washer";
// const carTable = process.env.CAR_TABLE;


exports.handler = async (event, ctxt)=>{
    try {
        let folder = event.pathParameters.folder;
        let bucketPath = `${BUCKET_NAME}/${folder}`;
        let encodedImage = event.body
        let decodedImage = Buffer.from(encodedImage, 'base64');
        // let filePath = "avatars/" + event.queryStringParameters.username + ".jpg"
        let tableName;
        let filePath = `${folder}/${Date.now()}.jpg`;
            let s3Params = {
              "Body": decodedImage,
              "Bucket": BUCKET_NAME,
              "Key": filePath  
           };

        let result = await s3.upload(s3Params).promise();

        if(folder === "profile-image") {
            tableName = userTable;
            updateUserProfile();
        } else if(folder = "car-image") {
            // tableName = carTable;
        }
        let userId = event.queryStringParameters.userId;
        let pathKey = result.Key;
        async function updateUserProfile() {
            let dynamoParams = {
                TableName: tableName,
                Key: { userId : userId },
                UpdateExpression: 'set #imageUrl = :path',
                ConditionExpression: '#userId = :uId',
                ExpressionAttributeValues: {
                  ':path' : pathKey,
                  ':uId' : userId
                }
              };
              await DocClient.update(dynamoParams).promise();
        }



        return {
            statusCode: 200,
            headers: util.getResponseHeader(),
            body: JSON.stringify({
                BUCKET_NAME,
                folder,
                bucketPath,
                tableName,
                userId,
                key: pathKey,
                result
            }),
            isBase64Encoded: false
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