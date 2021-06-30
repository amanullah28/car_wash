'use strict'

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const {successResponse, errorResponse, loggedInUserId} = require('../lib/utils');
const { v4: uuidv4 } = require("uuid");

module.exports.addCar = async (event) => {
    let userId = await loggedInUserId(event.requestContext);
    let bodyObj = JSON.parse(event.body);
    if (typeof bodyObj.plateNumber == 'undefined' || typeof bodyObj.carName == 'undefined' || 
        typeof bodyObj.model == 'undefined') {
        return errorResponse(400, {
          code: 400,
          status: 'error',
          message: "plateNumber, carName, model are mandatory"
        });
    }
    const params = {
        TableName: "user-cars",
        Item: {
          id: uuidv4(),
          userId: userId,
          plateNumber: bodyObj.plateNumber,
          carName: bodyObj.carName,
          model: bodyObj.model,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        }
    };
    try {
        await dynamodb.put(params).promise();
        return successResponse({
            code: 200,
            status: 'success',
            message: "Car added successfully"
        });
    } catch (error) {
        return errorResponse(500, {
            code: 500,
            status: 'error',
            message: error
        });
    }
}

module.exports.listCar = async (event) => {
    let userId = await loggedInUserId(event.requestContext);
    console.log("userId", userId)
    try {
        let cars = await dynamodb.scan({
            TableName: "user-cars",
            FilterExpression: "#userId = :user_id",
            ExpressionAttributeNames: {
                "#userId": "userId",
            },
            ExpressionAttributeValues: { ":user_id": userId }
          }).promise();
        return successResponse({
            code: 200,
            status: 'success',
            data: cars.Items,
            message: "Car listed successfully"
        });
    } catch (error) {
        return errorResponse(500, {
            code: 500,
            status: 'error',
            message: error
        });
    }
}