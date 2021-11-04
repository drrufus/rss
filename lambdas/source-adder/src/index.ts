import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB, Lambda } from 'aws-sdk';
import { IAddSourceRequest } from './types';

type LambdaEvent = APIGatewayProxyEvent & { postBody: IAddSourceRequest };

const feedsTableName = 'rss-feeds-table';
const ddb = new DynamoDB.DocumentClient();
const lambda = new Lambda();

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    const body: IAddSourceRequest = event.postBody;

    const ownerEmail = 'test@domain.com';

    const promise = new Promise<APIGatewayProxyResult>((resolve, reject) => {

        if (!body?.sourceUrl || body.sourceUrl === '' || !body.feedId || body.feedId === '') {
            throw Error('400: invalid input');
        }

        const refresherLambdaName = process.env['REFRESHER_LAMBDA_NAME'];
        if (!refresherLambdaName) {
            throw Error('500: refresher lambda name is not specified');
        }

        ddb.update(
            {
                TableName: feedsTableName,
                Key: {
                    'id': body.feedId,
                },
                UpdateExpression: 'SET sources = list_append(sources, :l)',
                ConditionExpression: 'not contains (sources, :i)',
                ExpressionAttributeValues: {
                    ':i': body.sourceUrl,
                    ':l': [body.sourceUrl]
                }
            },
            async (err, data) => {
                if (err) {
                    if (err.code === 'ConditionalCheckFailedException') {
                        throw Error('400: some condition failed');
                    } else {
                        throw Error(`500: update error (${JSON.stringify(err)})`);
                    }
                } else {
                    await lambda.invoke({
                        FunctionName: refresherLambdaName,
                        InvocationType: 'RequestResponse',
                        LogType: 'Tail',
                        Payload: '{}',
                    }).promise();
                    // TODO: check lambda invocation response code
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