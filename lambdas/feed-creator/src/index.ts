import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ICreateFeedRequest } from './types';
import { LambdaError, LambdaResponse } from 'rss-common/dist';

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
        return new LambdaError('Missing authorizer data', 500);
    }

    const ownerName = ownerEmail.match(/^[^@]+/)![0];

    if (!body?.name || body.name === '' || !body.name.match(/^[a-zA-Z0-9-]+$/)) {
        return new LambdaError('Invalid input', 400);
    }

    try {

        await ddb.put({
            TableName: feedsTableName,
            Item: {
                id: `${ownerName}_${body.name}`,
                ownerEmail,
                name: body.name,
                icon: body.icon ?? 'comment',
                sources: [],
            },
            ConditionExpression: 'attribute_not_exists(id)',
        }).promise();

        return new LambdaResponse(event); // TODO: returning event only for debug

    } catch (err: any) {
        if (err.code === 'ConditionalCheckFailedException') {
            return new LambdaError('Feed with this name already exists', 400);
        } else {
            return new LambdaError(`Insertion error (${JSON.stringify(err)})`, 500);
        }
    }

}