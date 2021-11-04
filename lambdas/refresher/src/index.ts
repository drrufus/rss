import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { IFeed } from './types';
import Parser from 'rss-parser';

type LambdaEvent = APIGatewayProxyEvent & { postBody: any };

const sourcesTableName = 'rss-sources-table';
const feedsTableName = 'rss-feeds-table';

const parser = new Parser();

export const handler = async (event: LambdaEvent): Promise<APIGatewayProxyResult> => {

    const ddb = new DynamoDB.DocumentClient();
    const body: any = event.postBody;

    const promise = new Promise<APIGatewayProxyResult>((resolve, reject) => {

        // if (!body?.name || body.name === '') {
        //     throw Error('400: invalid input');
        // }

        ddb.scan(
            {
                TableName: feedsTableName,
            },
            async (err, data) => {
                if (err) {
                    throw Error(`500: fetching error (${JSON.stringify(err)})`);
                } else {
                    const feeds = data.Items as IFeed[];
                    const sources = new Set(feeds.flatMap(f => f.sources));
                    for (const sourceUrl of Array.from(sources)) {
                        const rss = await parser.parseURL(sourceUrl);
                        await ddb.put({
                            TableName: sourcesTableName,
                            Item: {
                                feedUrl: sourceUrl,
                                rss: JSON.stringify(rss),
                            }
                        }).promise();
                    }

                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({
                            sourcesProcessed: sources.size,
                        }),
                    });
                }
            }
        );
    });

    return promise;
}