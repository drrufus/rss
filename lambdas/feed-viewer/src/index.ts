import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

type LambdaEvent = APIGatewayProxyEvent;

const ddb = new DynamoDB.DocumentClient();
const sourcesTableName = 'rss-sources-table';
const feedsTableName = 'rss-feeds-table';

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
                    body: JSON.stringify({
                        errorMessage: `No feed "${urlParam}" found`,
                    }),
                });
            } else {
                const sourceUrls: string[] = feedQueryResponse.Item!.sources;
                const soucesQueryResponse = await ddb.scan({
                    TableName: sourcesTableName,
                    FilterExpression: 'contains(:list, feedUrl)',
                    ExpressionAttributeValues: {
                        ':list': sourceUrls,
                    },
                }).promise();
                const sources = soucesQueryResponse.Items?.map(source => ({         // TODO: types
                    ...source,
                    rss: JSON.parse(source.rss),
                }));
                resolve({
                    statusCode: 200,
                    body: JSON.stringify({
                        sources,
                    }),
                });
            }

        }

    });

    return promise;
}