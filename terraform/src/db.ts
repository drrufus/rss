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
        writeCapacity: 5,
        readCapacity: 5,
        attribute: [
            {
                name: 'id',
                type: 'S',
            },
            // {
            //     name: 'ownerEmail',
            //     type: 'S',
            // },
        ],
        // globalSecondaryIndex: [
        //     {
        //         name: 'some-index',
        //         hashKey: 'ownerEmail',
        //         projectionType: 'INCLUDE',
        //         writeCapacity: 5,
        //         readCapacity: 5,
        //         nonKeyAttributes: ['id'],
        //     },
        // ],
    });

    const sourcesTableName = `${name}-sources-table`;
    const sourcesTable = new DynamodbTable(scope, sourcesTableName, {
        name: sourcesTableName,
        hashKey: 'feedUrl',
        billingMode: 'PROVISIONED',
        writeCapacity: 5,
        readCapacity: 5,
        attribute: [
            {
                name: 'feedUrl',
                type: 'S',
            },
        ],
        // dependsOn: [
        //     feedsTable,
        // ],
    });

    return {
        feedsTableArn: feedsTable.arn,
        sourcesTableArn: sourcesTable.arn,
    }

}
