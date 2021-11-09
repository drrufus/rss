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

    const ownerEmail = 'test@domain.com';
    const ownerName = ownerEmail.match(/^[^@]+/)![0];

    const promise = new Promise<APIGatewayProxyResult>((resolve, reject) => {

        if (!body?.name || body.name === '' || !body.name.match(/^[a-zA-Z0-9-]+$/)) {
            throw Error('400: invalid input');  // TODO: errors mapping
        }

        ddb.put(
            {
                TableName: feedsTableName,
                Item: {
                    id: `${ownerName}_${body.name}`,
                    ownerEmail,
                    name: body.name,
                    sources: [],
                },
                ConditionExpression: 'attribute_not_exists(id)',
            },
            (err, data) => {
                if (err) {
                    if (err.code === 'ConditionalCheckFailedException') {
                        throw Error('400: feed with this name already exists');         // TODO: errors mapping
                    } else {
                        throw Error(`500: insertion error (${JSON.stringify(err)})`);   // TODO: errors mapping
                    }
                } else {
                    resolve({
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify(event),
                    });
                }
            }
        );
    });

    return promise;
}