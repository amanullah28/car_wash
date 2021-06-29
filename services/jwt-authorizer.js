const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const util = require('../helper/util');
console.log('Loading function');

exports.handler = async(event, context, callback) => {
    // console.log('Client token:', event.authorizationToken);
    // console.log('Method ARN:', event.methodArn);
    let authToken = event.authorizationToken;
    let decoded;
    try {
        // decoded = jwtDecode(event.authorizationToken);
        decoded = await jwt.verify(authToken, JWT_SECRET);

    } catch(e) {
        return callback('Unauthorized!!');
    }

    const authResponse = util.generatePolicy(JSON.parse(decoded), "Allow", "*")

    authResponse.context = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email
    };

    callback(null, authResponse);
};
