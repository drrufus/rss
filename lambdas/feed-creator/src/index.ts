import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ICreateFeedRequest } from './types';
import { LambdaError, LambdaResponse } from 'rss-common/dist';

type LambdaEvent = APIGatewayProxyEvent & { postBody: ICreateFeedRequest };

const feedsTableName = process.env['FEEDS_TABLE_NAME'];

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    if (!feedsTableName) {
        return new LambdaError('Configuration error: missing FEEDS_TABLE_NAME parameter', 500);
    }

    const ddb = new DynamoDB.DocumentClient();
    const body: ICreateFeedRequest = JSON.parse(event.body!);

    const ownerEmail = event.requestContext.authorizer!.email;
    const ownerId = event.requestContext.authorizer!.user_id;
    if (!ownerEmail || !ownerId) {
        return new LambdaError('Missing authorizer data', 500);
    }

    const ownerName = ownerEmail.match(/^[^@]+/)![0];

    if (!body?.name || body.name === '' || !body.name.match(/^[a-zA-Z0-9-]+$/) || !body.description || !body.link) {
        return new LambdaError('Invalid input', 400);
    }

    try {

        const item = {
            id: `${ownerName}_${body.name}`,
            ownerEmail,
            name: body.name,
            icon: body.icon ?? 'comment',
            sources: [],
            link: body.link,
            description: body.description,
        };

        await ddb.put({
            TableName: feedsTableName,
            Item: item,
            ConditionExpression: 'attribute_not_exists(id)',
        }).promise();

        return new LambdaResponse(item);

    } catch (err: any) {
        if (err.code === 'ConditionalCheckFailedException') {
            return new LambdaError('Feed with this name already exists', 400);
        } else {
            return new LambdaError(`Insertion error (${JSON.stringify(err)})`, 500);
        }
    }

}