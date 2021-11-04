import { AssetType, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';
import { IamRole, IamRolePolicyAttachment, LambdaFunction, S3Bucket, S3BucketObject } from '../.gen/providers/aws';
import { IDatabasesCreationResult } from './types/databases-creation-result';
import { ILambdasCreationResult } from './types/lambdas-creation-result';

export function createLambdas(scope: Construct, name: string, databases: IDatabasesCreationResult): ILambdasCreationResult {

    const lambdasBucketName = `${name}-lambdas-bucket`;
    const lambdasBucket = new S3Bucket(scope, lambdasBucketName, {
        bucketPrefix: lambdasBucketName,
    });

    const lambdaRoleName = `${name}-lambda-exec-role`
    const lambdasRole = new IamRole(scope, lambdaRoleName, {
        name: lambdaRoleName,
        inlinePolicy: [{
            name: 'dynamo-db-policy',
            policy: `{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Action": "dynamodb:*",
                        "Resource": "${databases.feedsTableArn}"
                    },
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Action": "dynamodb:*",
                        "Resource": "${databases.sourcesTableArn}"
                    },
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeAsync",
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            "*"
                        ]
                    }
                ]
            }`,
        }],

        assumeRolePolicy: JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                },
            ]
        })
    });

    new IamRolePolicyAttachment(scope, `${name}-lambdas-role-attachment-01`, {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        role: lambdasRole.name,
    });
    new IamRolePolicyAttachment(scope, `${name}-lambdas-role-attachment-02`, {
        policyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
        role: lambdasRole.name,
    });

    const feedCreatorLambdaAsset = new TerraformAsset(scope, `${name}-feed-creator-asset`, {
        path: path.resolve(__dirname, '../../lambdas/feed-creator/dist'),
        type: AssetType.ARCHIVE,
    });
    const sourceAdderLambdaAsset = new TerraformAsset(scope, `${name}-source-adder-asset`, {
        path: path.resolve(__dirname, '../../lambdas/source-adder/dist'),
        type: AssetType.ARCHIVE,
    });
    const refresherLambdaAsset = new TerraformAsset(scope, `${name}-refresher-asset`, {
        path: path.resolve(__dirname, '../../lambdas/refresher/dist'),
        type: AssetType.ARCHIVE,
    });

    const feedCreatorLambdaArchive = new S3BucketObject(scope, `${name}-feed-creator-archive`, {
        bucket: lambdasBucket.bucket,
        key: `feed-creator-lambda-${feedCreatorLambdaAsset.assetHash}`,
        source: feedCreatorLambdaAsset.path,
    });
    const sourceAdderLambdaArchive = new S3BucketObject(scope, `${name}-source-adder-archive`, {
        bucket: lambdasBucket.bucket,
        key: `source-adder-lambda-${sourceAdderLambdaAsset.assetHash}`,
        source: sourceAdderLambdaAsset.path,
    });
    const refresherLambdaArchive = new S3BucketObject(scope, `${name}-refresher-archive`, {
        bucket: lambdasBucket.bucket,
        key: `refresher-lambda-${refresherLambdaAsset.assetHash}`,
        source: refresherLambdaAsset.path,
    });

    const feedCreatorLambdaName = `${name}-feed-creator-lambda`;
    const feedCreatorLambda = new LambdaFunction(scope, feedCreatorLambdaName, {
        functionName: feedCreatorLambdaName,
        s3Bucket: lambdasBucket.bucket,
        s3Key: feedCreatorLambdaArchive.key,
        handler: 'index.handler',
        runtime: 'nodejs14.x',
        role: lambdasRole.arn,
    });

    const refresherLambdaName = `${name}-refresher-lambda`;
    const refresherLambda = new LambdaFunction(scope, refresherLambdaName, {
        functionName: refresherLambdaName,
        s3Bucket: lambdasBucket.bucket,
        s3Key: refresherLambdaArchive.key,
        handler: 'index.handler',
        runtime: 'nodejs14.x',
        role: lambdasRole.arn,
    });

    const sourceAdderLambdaName = `${name}-source-adder-lambda`;
    const sourceAdderLambda = new LambdaFunction(scope, sourceAdderLambdaName, {
        functionName: sourceAdderLambdaName,
        s3Bucket: lambdasBucket.bucket,
        s3Key: sourceAdderLambdaArchive.key,
        handler: 'index.handler',
        runtime: 'nodejs14.x',
        role: lambdasRole.arn,
        environment: [{
            variables: {
                REFRESHER_LAMBDA_NAME: refresherLambda.functionName,
            }
        }],
    });

    return {
        feedCreatorLambdaInvokeArn: feedCreatorLambda.invokeArn,
        feedCreatorLambdaFunctionName: feedCreatorLambda.functionName,
        sourceAdderLambdaInvokeArn: sourceAdderLambda.invokeArn,
        sourceAdderLambdaFunctionName: sourceAdderLambda.functionName,
        refresherLambdaInvokeArn: refresherLambda.invokeArn,
        refresherLambdaFunctionName: refresherLambda.functionName,
    };

}
