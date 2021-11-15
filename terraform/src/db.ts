import { Construct } from 'constructs';
import { DynamodbTable } from '../.gen/providers/aws';
import { IDatabasesCreationResult } from './types/databases-creation-result';

export function createDatabase(scope: Construct, name: string): IDatabasesCreationResult {

    const feedsTableName = `${name}-feeds-table`;
    const feedsTable = new DynamodbTable(scope, feedsTableName, {
        name: feedsTableName,
        hashKey: 'id',
        // rangeKey: 'ownerEmail',
        billingMode: 'PROVISIONED',
        writeCapacity: 25,
        readCapacity: 25,
        attribute: [
            {
                name: 'id',
                type: 'S',
            },
            {
                name: 'ownerEmail',
                type: 'S',
            },
        ],
        globalSecondaryIndex: [
            {
                name: 'some-index',
                hashKey: 'ownerEmail',
                projectionType: 'ALL',
                writeCapacity: 25,
                readCapacity: 25,
            },
        ],
    });

    const postsTableName = `${name}-posts-table`;
    const postsTable = new DynamodbTable(scope, postsTableName, {
        name: postsTableName,
        hashKey: 'id',
        billingMode: 'PROVISIONED',
        writeCapacity: 25,
        readCapacity: 25,
        attribute: [
            {
                name: 'id',
                type: 'S',
            },
            {
                name: 'feedUrl',
                type: 'S',
            },
        ],
        globalSecondaryIndex: [
            {
                name: 'feed-url-index',
                hashKey: 'feedUrl',
                projectionType: 'ALL',
                writeCapacity: 25,
                readCapacity: 25,
            },
        ],
    });

    return {
        feedsTableName,
        feedsTableArn: feedsTable.arn,
        postsTableName,
        postsTableArn: postsTable.arn,
    }

}
