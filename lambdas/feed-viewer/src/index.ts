import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

type LambdaEvent = APIGatewayProxyEvent;

const ddb = new DynamoDB.DocumentClient();
const sourcesTableName = 'rss-posts-table';
const feedsTableName = 'rss-feeds-table';

const corsHeaders = {
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
};

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    // const body: ICreateFeedRequest = event.postBody;

    const ownerEmail = 'test@domain.com';

    const urlParam = (event as any).pathParameters?.proxy ?? null;

    const promise = new Promise<APIGatewayProxyResult>(async (resolve, reject) => {

        if (urlParam == null) {     // get list of feeds

            const feedsQueryResponse = await ddb.query({
                TableName: feedsTableName,
                IndexName: 'some-index',
                KeyConditionExpression: 'ownerEmail = :e',
                ExpressionAttributeValues: {
                    ':e': ownerEmail,
                },
            }).promise();

            const userFeeds = feedsQueryResponse.Items;

            resolve({
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    feeds: userFeeds,
                }),
            });

        } else {                    // get concrete feed's content

            const feedQueryResponse = await ddb.get({
                TableName: feedsTableName,
                Key: {
                    id: urlParam,
                },
            }).promise();
            if (!feedQueryResponse.Item) {
                resolve({
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        errorMessage: `No feed "${urlParam}" found`,
                    }),
                });
            } else {
                const feed = feedQueryResponse.Item!;
                const sourceUrls: string[] = feed.sources;
                const soucesQueryResponse = await ddb.scan({
                    TableName: sourcesTableName,
                    FilterExpression: 'contains(:list, feedUrl)',
                    ExpressionAttributeValues: {
                        ':list': sourceUrls,
                    },
                }).promise();
                const chunks = soucesQueryResponse.Items?.map(chunk => ({         // TODO: types
                    id: chunk.id,
                    sourceUrl: chunk.feedUrl,
                    items: JSON.parse(chunk.content),
                }));
                resolve({
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        id: feed.id,
                        feedName: feed.name,
                        ownerEmail: feed.ownerEmail,
                        sources: sourceUrls,
                        chunks,
                    }),
                });
            }

        }

    });

    return promise;
}