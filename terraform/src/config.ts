export const CONFIG = {
    awsRegion: 'us-west-2',
    awsAccessKey: process.env['AWS_ACCESS_KEY_ID'],
    awsSecretKey: process.env['AWS_SECRET_ACCESS_KEY'],
    autoUpdateSchedule: 'cron(*/20 * * * ? *)',
};
