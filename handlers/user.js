'use strict';

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const saltRounds = 8;
var validator = require('validator');
var jwt = require('jsonwebtoken');
const JWTSECRET = process.env.JWT_SECRET;
const {successResponse, errorResponse, loggedInUserId} = require('../lib/utils');
const userTable = process.env.USER_TABLE;
const uType = require('../lib/userType');

module.exports.signup = async (event) => {
  let bodyObj = {};
  bodyObj = JSON.parse(event.body);
  if (typeof bodyObj == 'undefined' || bodyObj == null || 
      typeof bodyObj.email == 'undefined' || typeof bodyObj.password == 'undefined') {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Email and Password are mandatory"
    });
  }
  if (!validator.isEmail(bodyObj.email)) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Invalid Email"
    });
  }
  let userExists = await dynamodb.scan({
    TableName: userTable,
    FilterExpression: "#email = :email_val",
    ExpressionAttributeNames: {
        "#email": "email",
    },
    ExpressionAttributeValues: { ":email_val": bodyObj.email }
  }).promise();
  if (userExists.Count > 0) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Email is already exists"
    });
  }
  const passwordHash = await bcrypt.hash(bodyObj.password, saltRounds);
  let userType = uType.ADMIN;
  if (event.path == '/customer/signup') {
    userType = uType.CUSTOMER;
  } else if (event.path == '/washer/signup') {
    userType = uType.CAR_WASHER;
  }
  const params = {
    TableName: userTable,
    Item: {
      id: uuidv4(),
      fullname: (typeof bodyObj.fullname !== 'undefined') ? bodyObj.fullname : '',
      email: bodyObj.email,
      password: passwordHash,
      address: bodyObj.address,
      userType: userType,
      phone: (typeof bodyObj.phone !== 'undefined') ? bodyObj.phone : '',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    }
  };
  try {
    await dynamodb.put(params).promise();
    return successResponse({
      code: 200,
      status: 'success',
      message: "You are successfully signed up"
    });
  } catch (error) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: error
    });
  }
}

module.exports.login = async (event) => {
  let bodyObj = {};
  bodyObj = JSON.parse(event.body);
  if (typeof bodyObj == 'undefined' || bodyObj == null || 
      typeof bodyObj.email == 'undefined' || typeof bodyObj.password == 'undefined') {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Email and Password are mandatory"
    });
  }
  if (!validator.isEmail(bodyObj.email)) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Invalid Email"
    });
  }
  console.log("userTable", userTable)
  let userExists = await dynamodb.scan({
    TableName: userTable,
    FilterExpression: "#email = :email_val",
    ExpressionAttributeNames: {
        "#email": "email",
    },
    ExpressionAttributeValues: { ":email_val": bodyObj.email }
  }).promise();
  if (userExists.Count == 0) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "User does not exist"
    });
  }
  let validPassword = await bcrypt.compare(bodyObj.password, userExists.Items[0].password);
  if (!validPassword) {
    return errorResponse(400, {
      code: 400,
      status: 'error',
      message: "Password Incorrect"
    });
  }
  let token = await jwt.sign({
    userId : userExists.Items[0].id,
    email: userExists.Items[0].email,
    userType: userExists.Items[0].userType
  }, JWTSECRET);
  const params = {
    TableName: "auth-tokens",
    Item: {
      token: token,
      userId: userExists.Items[0].id,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    }
  };
  try {
    await dynamodb.put(params).promise();
  } catch (error) {
    return errorResponse(500, {
      code: 500,
      status: 'error',
      message: error
    });
  }
  return successResponse({
    code: 200,
    status: 'success',
    token: token,
    message: "Logged in successfully"
  });
}

module.exports.updateProfile = async (event) => {
  let userId = await loggedInUserId(event.requestContext);
  let bodyObj = JSON.parse(event.body);
  if (typeof bodyObj == 'undefined' || bodyObj == null || 
      typeof bodyObj.cardHolder == 'undefined' || typeof bodyObj.cardNumber == 'undefined' ||
      typeof bodyObj.cardCvv == 'undefined' || typeof bodyObj.cardExpiryMonth == 'undefined' ||
      typeof bodyObj.cardExpiryYear == 'undefined') {
        return errorResponse(400, {
          code: 400,
          status: 'error',
          message: "card details are mandatory"
        });
  }
  
  var updateParams = {
      TableName: userTable,
      Key:{
          "id": userId
      },
      UpdateExpression: `set fullname = :fullname, phone = :phone, updatedAt = :updatedAt, 
                        cardHolder = :cardHolder, cardNumber = :cardNumber, cardCvv = :cardCvv,
                        cardExpiryMonth = :cardExpiryMonth, cardExpiryYear = :cardExpiryYear`,
      ExpressionAttributeValues:{
          ":fullname": bodyObj.fullname,
          ":phone": bodyObj.phone,
          ":updatedAt": new Date().getTime(),
          ":cardHolder": bodyObj.cardHolder,
          ":cardNumber": bodyObj.cardNumber,
          ":cardCvv": bodyObj.cardCvv,
          ":cardExpiryMonth": bodyObj.cardExpiryMonth,
          ":cardExpiryYear": bodyObj.cardExpiryYear
      },
      ReturnValues:"UPDATED_NEW"
  };
  try {
    var data = await dynamodb.update(updateParams).promise();
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
    message: "Updated successfully"
  });
}
