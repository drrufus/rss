import { Construct } from 'constructs';
import { CloudwatchEventRule, CloudwatchEventTarget, LambdaPermission } from '../.gen/providers/aws';
import { CONFIG } from './config';
import { ILambdasCreationResult } from './types/lambdas-creation-result';

export function createEvents(scope: Construct, name: string, lambdas: ILambdasCreationResult): void {

    const eventRule = new CloudwatchEventRule(scope, `${name}-event-rule`, {
        name: 'refresher-lambda-cronjob',
        description: 'YOLO',
        scheduleExpression: CONFIG.autoUpdateSchedule,
    });

    const eventTarget = new CloudwatchEventTarget(scope, `${name}-event-target`, {
        rule: eventRule.name,
        targetId: 'refresher-lambda',
        arn: lambdas.refresherLambdaArn,
    });

    const lambdaEventsPermission = new LambdaPermission(scope, 'events-lambda-permission', {
        statementId: 'AllowExecutionFromCloudWatch',
        action: 'lambda:InvokeFunction',
        functionName: lambdas.refresherLambdaFunctionName,
        principal: 'events.amazonaws.com',
        sourceArn: eventRule.arn,
    });

}
