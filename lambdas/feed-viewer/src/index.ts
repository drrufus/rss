import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

type LambdaEvent = APIGatewayProxyEvent;

const ddb = new DynamoDB.DocumentClient();
const sourcesTableName = 'rss-sources-table';
const feedsTableName = 'rss-feeds-table';

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    // const body: ICreateFeedRequest = event.postBody;

    const ownerEmail = 'test@domain.com';

    const promise = new Promise<APIGatewayProxyResult>(async (resolve, reject) => {

        const feedsQueryResponse = await ddb.query({
            TableName: feedsTableName,
            IndexName: 'some-index',
            KeyConditionExpression: 'ownerEmail = :e',
            ExpressionAttributeValues: {
                ':e': ownerEmail,
            },
        }).promise();
        const userFeeds = feedsQueryResponse.Items;

        const tmpUrls = ['https://www.reddit.com/.rss', 'http://www.metronews.ru/rss.xml?c=1300244445-1'];

        const soucesQueryResponse = await ddb.scan({
            TableName: sourcesTableName,
            FilterExpression: 'contains(:list, feedUrl)',
            ExpressionAttributeValues: {
                ':list': tmpUrls,
            },
        }).promise();
        const sources = soucesQueryResponse.Items;

        resolve({
            statusCode: 200,
            body: JSON.stringify(event),
        });

    });

    return promise;
}