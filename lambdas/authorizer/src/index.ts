import { APIGatewayProxyResult } from "aws-lambda";
import axios from 'axios';

export const handler = async (event: any, context: any) => {
    console.log('input:');
    console.log(event);
    const token = event.authorizationToken;
    console.log('using token: ' + token);
    let googleAuthRes;
    try {
        googleAuthRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
        );
        console.log('OK! response:');
        console.log(googleAuthRes);
    } catch (err) {
        console.log('REQUEST FAILED:');
        console.log(err);
        return Promise.reject("Unauthorized");
    }

    return Promise.resolve(
        generatePolicy(
            googleAuthRes.data.user_id,
            "Allow",
            event.methodArn,
            googleAuthRes.data
        )
    );
};

const generatePolicy = (principalId: any, effect: any, resource: any, context = {}) => {
    const authResponse: any = { 
        principalId,
        context,
    };

    if (effect && resource) {
        authResponse.policyDocument = {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: "*",
                }
            ]
        };
    }

    return authResponse;
};