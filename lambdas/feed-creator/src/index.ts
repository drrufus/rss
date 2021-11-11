import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ICreateFeedRequest } from './types';

type LambdaEvent = APIGatewayProxyEvent & { postBody: ICreateFeedRequest };

const feedsTableName = 'rss-feeds-table';

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    const ddb = new DynamoDB.DocumentClient();
    const body: ICreateFeedRequest = JSON.parse(event.body!);

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

    const ownerName = ownerEmail.match(/^[^@]+/)![0];

    if (!body?.name || body.name === '' || !body.name.match(/^[a-zA-Z0-9-]+$/)) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
                errorMessage: 'Invalid input',
            }),
        };
    }

    try {

        await ddb.put({
            TableName: feedsTableName,
            Item: {
                id: `${ownerName}_${body.name}`,
                ownerEmail,
                name: body.name,
                sources: [],
            },
            ConditionExpression: 'attribute_not_exists(id)',
        }).promise();

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(event),    // TODO: returning event only for debug
        };

    } catch (err: any) {
        if (err.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    errorMessage: 'Feed with this name already exists',
                }),
            };
        } else {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    errorMessage: `Insertion error (${JSON.stringify(err)})`,
                }),
            };
        }
    }

}