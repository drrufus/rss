import { APIGatewayProxyResult } from 'aws-lambda';
import { corsHeaders } from './constants';

export class LambdaResponse implements APIGatewayProxyResult {
    body: string;
    headers: {[header: string]: string | boolean | number} = corsHeaders;
    constructor(payload: any, public statusCode: number = 200) {
        this.body = JSON.stringify(payload);
    }
}

export class LambdaXmlResponse implements APIGatewayProxyResult {
    body: string;
    headers: {[header: string]: string | boolean | number} = {
        ...corsHeaders,
        'content-type': 'text/xml',
    };
    constructor(xml: string, public statusCode: number = 200) {
        this.body = xml;
    }
}

export class LambdaError implements APIGatewayProxyResult {
    body: string;
    headers: {[header: string]: string | boolean | number} = corsHeaders;
    constructor(errorMessage: string, public statusCode: number = 500) {
        this.body = JSON.stringify({
            errorMessage,
        });
    }
}
