import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { ICreateFeedRequest } from './types';

type LambdaEvent = APIGatewayProxyEvent & { postBody: ICreateFeedRequest };

const feedsTableName = 'rss-feeds-table';

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    const ddb = new DynamoDB.DocumentClient();
    const body: ICreateFeedRequest = event.postBody;

    const ownerEmail = 'test@domain.com';

    const promise = new Promise<APIGatewayProxyResult>((resolve, reject) => {

        if (!body?.name || body.name === '') {
            throw Error('400: invalid input');
        }

        ddb.put(
            {
                TableName: feedsTableName,
                Item: {
                    id: `${ownerEmail}:${body.name}`,
                    ownerEmail,
                    name: body.name,
                    sources: [],
                },
                ConditionExpression: 'attribute_not_exists(id)',
            },
            (err, data) => {
                if (err) {
                    if (err.code === 'ConditionalCheckFailedException') {
                        throw Error('400: feed with this name already exists');
                    } else {
                        throw Error(`500: insertion error (${JSON.stringify(err)})`);
                    }
                } else {
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify(event),
                    });
                }
            }
        );
    });

    return promise;
}