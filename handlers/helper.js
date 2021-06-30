'use strict'

const AWS = require('aws-sdk');
const SNS = new AWS.SNS({ apiVersion: '2010-03-31'});
const {successResponse, errorResponse} = require('../lib/utils');

module.exports.sendSms = async (event) => {
    // const AttributeParams = {
    //     attributes: {
    //         DefaultSMSType: 'Transactional'
    //     }
    // }
    // const messageParams = {
    //     Message: 'You are receiving this from AWS Lambda',
    //     PhoneNumber: '919497717516'
    // }
    var params = {
        Message: "Your OTP verification code is 3493",
        PhoneNumber: '+919497717516',
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
    apiVersion: "2010-03-31",
    region: "ap-south-1",
    });
    sns.setSMSAttributes({
        attributes: {
            DefaultSenderID: "Horoscope",
            DefaultSMSType: "Transactional",
        },
    });
    try {
        // await SNS.setSMSAttributes(AttributeParams).promise();
        let snssend = await sns.publish(params).promise();
        // let snssend = await SNS.publish(params);
        console.log("snssend", snssend)
        return successResponse({
            code: 200,
            status: 'success',
            message: "You are successfully sms sent"
        });
    } catch (error) {
        return errorResponse(400, {
            code: 400,
            status: 'error',
            message: error
        });
    }
}