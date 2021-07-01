const jwt = require('jsonwebtoken');
const { buildIAMPolicy } = require('../lib/utils');
const JWTSECRET = process.env.JWT_SECRET;

/**
  * Authorizer functions are executed before your actual functions.
  * @method authorize
  * @param {String} event.authorizationToken - JWT
  * @throws Returns 401 if the token is invalid or has expired.
  * @throws Returns 403 if the token does not have sufficient permissions.
  */
module.exports.handler = (event, context, callback) => {
    const token = event.authorizationToken;
    try {
        jwt.verify(token, JWTSECRET, (err, user) => {
            if (err) {
                console.log("err", err);
            }
            const effect = 'Allow';
            const userId = user.userId;
            const authorizerContext = { user: JSON.stringify(user) };
            // Return an IAM policy document for the current endpoint
            const policyDocument = buildIAMPolicy(userId, effect, event.methodArn, authorizerContext);
            return callback(null, policyDocument);
        });
    } catch (e) {
        callback('Unauthorized');
    }
};
