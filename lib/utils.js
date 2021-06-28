/**
  * Returns an IAM policy document for a given user and resource.
  *
  * @method buildIAMPolicy
  * @param {String} userId - user id
  * @param {String} effect  - Allow / Deny
  * @param {String} resource - resource ARN
  * @param {String} context - response context
  * @returns {Object} policyDocument
  */
const buildIAMPolicy = (userId, effect, resource, context) => {
    const policy = {
        principalId: userId,
        policyDocument: {
        Version: '2012-10-17',
        Statement: [
            {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
            },
        ],
        },
        context,
    };

    return policy;
};

const successResponse = (body = {}) => {
    return {
        statusCode: 200,
        body: JSON.stringify(body)
    }
}

const errorResponse = (errorCode = 400, body = {}) => {
    return {
        statusCode: errorCode,
        body: JSON.stringify(body)
    }
}

const loggedInUserId = (requestContext) => {
    let userData = JSON.parse(requestContext.authorizer.user);
    return userData.userId;
}
  
module.exports = {
    buildIAMPolicy,
    successResponse,
    errorResponse,
    loggedInUserId
};