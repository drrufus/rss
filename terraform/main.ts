import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from './.gen/providers/aws';
import { createDatabase } from './src/db';
import { createLambdas } from './src/lambdas';
import { createApi } from './src/api';
import { createUiEntities } from './src/ui';

class MyStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
        super(scope, name);

        new AwsProvider(this, 'aws', {
            region: 'us-west-2',
            accessKey: process.env['AWS_ACCESS_KEY_ID'],
            secretKey: process.env['AWS_SECRET_ACCESS_KEY'],
        });

        const databases = createDatabase(this, name);
        const lambdas = createLambdas(this, name, databases);
        const ui = createUiEntities(this, name);
        const api = createApi(this, name, lambdas, ui);

    }
}

const app = new App();
new MyStack(app, 'rss');
app.synth();
