export interface ILambdasCreationResult {

    authorizerLambdaInvokeArn: string;
    authorizerLambdaFunctionName: string;

    feedCreatorLambdaInvokeArn: string;
    feedCreatorLambdaFunctionName: string;

    sourceAdderLambdaInvokeArn: string;
    sourceAdderLambdaFunctionName: string;

    refresherLambdaInvokeArn: string;
    refresherLambdaFunctionName: string;

    feedViewerLambdaInvokeArn: string;
    feedViewerLambdaFunctionName: string;

}
