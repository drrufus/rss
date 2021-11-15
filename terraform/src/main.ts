import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../.gen/providers/aws';
import { createDatabase } from './db';
import { createLambdas } from './lambdas';
import { createApi } from './api';
import { createUiEntities } from './ui';
import { createEvents } from './events';
import { CONFIG } from './config';

class MyStack extends TerraformStack {
    constructor(scope: Construct, name: string) {
        super(scope, name);

        new AwsProvider(this, 'aws', {
            region: CONFIG.awsRegion,
            accessKey: CONFIG.awsAccessKey,
            secretKey: CONFIG.awsSecretKey,
        });

        const databases = createDatabase(this, name);
        const lambdas = createLambdas(this, name, databases);
        const ui = createUiEntities(this, name);
        const api = createApi(this, name, lambdas, ui);
        createEvents(this, name, lambdas);

    }
}

const app = new App();
new MyStack(app, 'rss');
app.synth();
