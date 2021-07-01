'use strict'

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const {successResponse, errorResponse, loggedInUserId, loggedInUserType} = require('../lib/utils');
const washPackageTable = process.env.WASH_PACKAGE_TABLE;
const { v4: uuidv4 } = require("uuid");

module.exports.add = async (event) => {
    let userId = await loggedInUserId(event.requestContext);
    let bodyObj = JSON.parse(event.body);
    if (typeof bodyObj == 'undefined' || bodyObj == null || 
        typeof bodyObj.title == 'undefined' || typeof bodyObj.description == 'undefined' || 
        typeof bodyObj.price == 'undefined') {
            return errorResponse(400, {
                code: 400,
                status: 'error',
                message: "title, description and price are required"
            });
    }
    let params = {
        TableName: washPackageTable,
        Item: {
            id: uuidv4(),
            userId: userId,
            title: bodyObj.title,
            description: bodyObj.description,
            price: bodyObj.price,
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime()
        }
    }
    try {
        await dynamodb.put(params).promise();
    } catch (error) {
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: error
        });
    }
    return successResponse({
        code: 200,
        status: 'success',
        message: "Wash package added successfully"
    });
}

module.exports.listPackages = async (event) => {
    let userId = await loggedInUserId(event.requestContext);
    let userType = await loggedInUserType(event.requestContext);
    let params = {
        TableName: washPackageTable,
        ProjectionExpression: ["id", "title", "description", "price"]
    }
    if (userType == 2) {
        params = {
            TableName: washPackageTable,
            ProjectionExpression: ["id", "title", "description", "price"],
            FilterExpression: "#userId = :user_id",
            ExpressionAttributeNames: {
                "#userId": "userId",
            },
            ExpressionAttributeValues: { ":user_id": userId }
        }
    }
    try {
        let packages = await dynamodb.scan(params).promise();
        return successResponse({
            code: 200,
            status: 'success',
            data: packages.Items,
            message: "Wash package listed successfully"
        });
    } catch (error) {
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: error
        });
    }
}