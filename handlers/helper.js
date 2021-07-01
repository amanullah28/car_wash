'use strict'

const AWS = require('aws-sdk');
const {successResponse, errorResponse} = require('../lib/utils');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const userTable = process.env.USER_TABLE;
const BUCKET_NAME = "car-wash-uploads";

module.exports.sendSms = async (input) => {
    var params = {
        Message: input.message,
        PhoneNumber: input.phone,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
          "AWS.SNS.SMS.SenderID": {
            DataType: "String",
            StringValue: "Horoscope",
          },
        },
    };
    var sns = new AWS.SNS({
        apiVersion: "2010-03-31"
    });
    try {
        await sns.publish(params).promise();
        return successResponse({
            code: 200,
            status: 'success',
            message: "Email sent successfully"
        });
    } catch (error) {
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: error
        });
    }
}

module.exports.imageUpload = async (event) => {
    try {
        let bodyPased = event.body;
        console.log("encodedImage", bodyPased);
        let folder = event.pathParameters.folder;
        // let bucketPath = `${BUCKET_NAME}/${folder}`;
        // let encodedImage = event.body
        // let decodedImage = Buffer.from(encodedImage, 'base64');
        // // let filePath = "avatars/" + event.queryStringParameters.username + ".jpg"
        // let tableName;
        let filePath = `${folder}/${Date.now()}.jpg`;
        let s3Params = {
            "Body": JSON.stringify(event),
            "Bucket": BUCKET_NAME,
            "Key": filePath  
        };
        let result = await s3.upload(s3Params).promise();
        // if (folder === "profile-image") {
        //     tableName = userTable;
        //     // updateUserProfile();
        // } else if (folder = "car-image") {
        //     // tableName = carTable;
        // }
        // // let userId = event.queryStringParameters.userId;
        // let pathKey = result.Key;
        // async function updateUserProfile() {
        //     let dynamoParams = {
        //         TableName: tableName,
        //         Key: { userId : userId },
        //         UpdateExpression: 'set #imageUrl = :path',
        //         ConditionExpression: '#userId = :uId',
        //         ExpressionAttributeValues: {
        //           ':path' : pathKey,
        //           ':uId' : userId
        //         }
        //     };
        //     await dynamodb.update(dynamoParams).promise();
        // }
        return successResponse({
            code: 200,
            status: 'success',
            data: "jh",
            message: "Image uploaded"
        });
    } catch(err) {
        console.log("Error", err);
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: err
        });
    }
}
