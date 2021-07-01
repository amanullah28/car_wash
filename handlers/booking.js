'use strict'

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const {successResponse, errorResponse, loggedInUserId} = require('../lib/utils');
const bookingsTable = process.env.BOOKING_TABLE;
const { v4: uuidv4 } = require("uuid");
const washPackageTable = process.env.WASH_PACKAGE_TABLE;
const userTable = process.env.USER_TABLE;
const {sendSms} = require('../handlers/helper');

module.exports.bookWash = async (event) => {
    let userId = await loggedInUserId(event.requestContext);
    let bodyObj = JSON.parse(event.body);
    if (typeof bodyObj == 'undefined' || bodyObj == null || typeof bodyObj.packageId == 'undefined' ||
        typeof bodyObj.carId == 'undefined' || typeof bodyObj.scheduledTo == 'undefined') {
            return errorResponse(400, {
                code: 400,
                status: 'error',
                message: 'packageId, carId, scheduledTo are required'
            });
    }
    let params = {
        TableName: bookingsTable,
        Item: {
          id: uuidv4(),
          userId: userId,
          packageId: bodyObj.packageId,
          carId: bodyObj.carId,
          scheduledTo: bodyObj.scheduledTo,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        }
    }
    try {
        await dynamodb.put(params).promise();
        let packageData = await dynamodb.scan({
            TableName: washPackageTable,
            FilterExpression: "#id = :package_id",
            ExpressionAttributeNames: {
                "#id": "id",
            },
            ExpressionAttributeValues: { ":package_id": bodyObj.packageId }
        }).promise();
        let washerData = await dynamodb.scan({
            TableName: userTable,
            FilterExpression: "#id = :user_id",
            ExpressionAttributeNames: {
                "#id": "id",
            },
            ExpressionAttributeValues: { ":user_id": packageData.Items[0].userId }
        }).promise();
        let customerData = await dynamodb.scan({
            TableName: userTable,
            FilterExpression: "#id = :user_id",
            ExpressionAttributeNames: {
                "#id": "id",
            },
            ExpressionAttributeValues: { ":user_id": userId }
        }).promise();
        sendSms({
            phone: washerData.Items[0].phone,
            message: `Hi ${washerData.Items[0].fullname}
                        Customer ${customerData.Items[0].fullname} has scheduled his/her 
                        car wash for the date ${bodyObj.scheduledTo}.
                        Please do the needfull`
        });
        return successResponse({
            code: 200,
            status: 'success',
            message: "Booking done successfully"
        });
    } catch (error) {
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: error
        });
    }
}