export interface ILambdasCreationResult {
    feedCreatorLambdaInvokeArn: string;
    feedCreatorLambdaFunctionName: string;
    sourceAdderLambdaInvokeArn: string;
    sourceAdderLambdaFunctionName: string;
    refresherLambdaInvokeArn: string;
    refresherLambdaFunctionName: string;
}
