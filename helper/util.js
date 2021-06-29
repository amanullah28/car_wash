const jwt = require('jsonwebtoken');

const getResponseHeader = () => {
    return {
        'Access-Control-Allow-Origin': '*'
    }
}

const getAccessToken = (user) => {
    return jwt.sign({
        id: user.userId,
        email: user.emai,
        name: user.name
    }, "secretttt");
}

const decodeToken = (token)=> {
    try{
         let tokenVal = jwt.verify(token, "secretttt");
         return tokenVal;
    } catch(err) {
        console.log(err);
        return err;
    }
}

const generatePolicy = (user, effect, resource) => {
        const policy = {
            principalId: user.id,
            policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
                },
            ]
            },
        };
    
        return policy;
    };



module.exports = {
    getResponseHeader,
    generatePolicy
}