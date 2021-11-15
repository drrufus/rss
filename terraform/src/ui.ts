import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';
import * as glob from 'glob';
import * as mime from 'mime-types';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { S3Bucket, S3BucketObject } from '../.gen/providers/aws';
import { IUiCreationResults } from './types/ui-creation-results';

export function createUiEntities(scope: Construct, name: string): IUiCreationResults {

    const uiBucketName = `${name}-ui-bucket`;
    const uiBucket = new S3Bucket(scope, uiBucketName, {
        bucket: uiBucketName,
        website: [{
            indexDocument: 'index.html',
            errorDocument: 'index.html',
        }],
        acl: 'public-read',
        policy: `{
            "Version": "2012-10-17",
            "Statement": [
              {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": [
                  "s3:GetObject"
                ],
                "Resource": [
                  "arn:aws:s3:::${uiBucketName}/*"
                ]
              }
            ]
        }`,

    });

    const files = glob.sync(path.resolve(__dirname, '../../../webapp/rss-reader/build') + '/**/*', { absolute: false, nodir: true });
    for (const file of files) {
        const fileBuffer = fs.readFileSync(file);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const hashDigest = hashSum.digest('hex');
        new S3BucketObject(scope, `${name}-ui-file-${path.basename(file)}`, {
            key: file.substring(file.indexOf('webapp/rss-reader/build') + 'webapp/rss-reader/build'.length),
            bucket: uiBucket.bucket,
            source: path.resolve(file),
            etag: hashDigest,
            contentType: mime.contentType(path.extname(file)) || undefined,
        });
    }

    new TerraformOutput(scope, `${name}-ui-out`, {
        value: uiBucket.websiteEndpoint,
    });

    return {
        websiteUrl: uiBucket.websiteEndpoint,
    }

}
