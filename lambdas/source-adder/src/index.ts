import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, Lambda } from 'aws-sdk';
import { IAddSourceRequest } from './types';

const feedsTableName = 'rss-feeds-table';
const ddb = new DynamoDB.DocumentClient();
const lambda = new Lambda();

interface IPayload {
    sourceUrl?: string;
}

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    // const ownerEmail = 'test@domain.com';

    const feedId = event.pathParameters?.proxy ?? '';
    const payload: IPayload = JSON.parse(event.body!) ?? {};
    const { sourceUrl } = payload;

    const ownerEmail = event.requestContext.authorizer!.email;
    const ownerId = event.requestContext.authorizer!.user_id;

    if (!ownerEmail || !ownerId) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'Missing authorizer data',
            }),
        };
    }

    if (!feedId.startsWith(ownerEmail.match(/^[^@]+/)![0])) {
        return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'An attempt to modify feed of other user',
            }),
        }
    }

    if (!feedId || !sourceUrl) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'Invalid input',
            }),
        };
    }

    const refresherLambdaName = process.env['REFRESHER_LAMBDA_NAME'];
    if (!refresherLambdaName) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'Configuration error: refresher lambda name is not specified',
            }),
        };
    }

    try {
        await ddb.update(
            {
                TableName: feedsTableName,
                Key: {
                    'id': feedId,
                },
                UpdateExpression: 'SET sources = list_append(sources, :l)',
                ConditionExpression: 'not contains (sources, :i)',
                ExpressionAttributeValues: {
                    ':i': sourceUrl,
                    ':l': [sourceUrl]
                }
            }
        ).promise();
    } catch (err: any) {
        switch (err.code) {
            case 'ValidationException': {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        errorMessage: 'An attempt to modify feed that doesn\'t exist',
                    }),
                };
            }
            case 'ConditionalCheckFailedException': {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        errorMessage: 'Some condition failed',
                    }),
                };
            }
            default: {
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        errorMessage: `Update error (${JSON.stringify(err)})`,
                    }),
                };
            }
        }
    }

    try {
        const lambdaCallReponse = await lambda.invoke({
            FunctionName: refresherLambdaName,
            InvocationType: 'RequestResponse',
            LogType: 'Tail',
            Payload: JSON.stringify({
                sourceUrl,
            }),
        }).promise();
        
        if (lambdaCallReponse.StatusCode !== 200) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    errorMessage: 'Refresher-Lambda returned code ' + lambdaCallReponse.StatusCode,
                }),
            };
        }
    } catch (err: any) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'Unknown lambda call error: ' + JSON.stringify(err),
            }),
        };
    }

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
            feedId,
            sourceUrl,
        }),
    };
    

}
