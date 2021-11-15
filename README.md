# Just another RSS reader

## App's functionality

This app allows you to create and view custom RSS-feeds. Each created channel can include an unlimited number of RSS-sources. The content of sources is updated in the background (and also when a new source is added). A content of such aggregated feed may be retrieved in json or in xml format (for reading via your favorite normal RSS-reader).

## Components overview

+ The core of all functionality is powered by `Lambdas` (with NodeJS runtime, code is written in TypeScript);
+ All data is stored in `DynamoDB` tables splitted into chunks;
+ The UI is a regular React SPA, deployed as `S3 static website`;
+ `ApiGateway REST API` provides an access to Lambdas and to the UI's S3 bucket;
+ API is secured by authorizer-Lambda using Google OAuth;
+ Regular udpating task is being triggered by `EventBridge` job;
+ Infrastructure-management is implemented via `Terraform's CDKTF` in TypeScript;

## Configuration

### Lambdas configuration

No "special actions" are required. Each Lambda can be built as a regular NodeJS app. Output directory (`./dist`) will be uploaded to the AWS, so it must contain all artifacts (including all required dependencies) before a deployment.

### UI configuration

In `src/config.ts` file it's necessary to set Google OAuth client ID. Then it also can be built normally using `npm run build` command. No magic here 🙃.

### Terraform configuration

A bit more interesting.

The most important parameters are located in `src/config.ts` file. As you can see, here you can set your AWS credentials (if they're stored not in default environment variables), AWS region and a schedule (like a cron-expression) for auto-updates of feeds.

As far as it's also a NodeJS project, before your first deployment it's necessary do download all dependencies (`npm i ; npm run get`). Then you should be able to run commands like `npm run deploy` or `npm run undeploy`.

When the infrastructure is deployed - you'll see a URL of the API in a console. Open `<URL>/ui/` in your browser and test the app.

## UI overview

![](https://sun9-31.userapi.com/impg/9fBz83CT3DgJo71rC2XR4x2ehc99mE4orisrUA/tSLVchMFvSw.jpg?size=965x933&quality=95&sign=4ab45d6ac8a35aac8b53e321153e6c3e&type=album)

On the left side you can create a new feed.

You have to provide a name, an associated link (don't confuse with an actual RSS url; this one usually should be somehow related to your website) and a description:

![](https://sun9-11.userapi.com/impg/nrdO35OkHmTIMLCrFRO_mYUUEkjpvbYQz0SfoQ/s_SPrJ0GU84.jpg?size=516x388&quality=95&sign=5f2e2984dce388be61547735253c3d0e&type=album)

When the feed is created - you can add some RSS sources.

It's also possible to choose something from predefined list.

![](https://sun9-46.userapi.com/impg/gMKmWzouJiiWJsQUdBvlhsYeoGhZW8roGjstAw/OtAN1-IPOC0.jpg?size=519x410&quality=95&sign=f3b8038ebf5a3e9e19f412fe3535e3bd&type=album)

If everything is OK - a new source will be added to the feed and a content will be updated.

On the top of the feed content you can also see some control buttons:

![](https://sun9-3.userapi.com/impg/0ekXZVi4urj66kF5pBgD9wSjCgeqlwtB6TSMfA/xXfHgehdYCc.jpg?size=468x157&quality=95&sign=93dbe0bdff88714039b31e584f55aee3&type=album)

`Copy RSS URL` button will copy a url of your feed (to use with regular RSS-readers) to a clipboard. Or you can copy it manually from a popover window.

`Refresh` button will (yes!) update the content. It won't trigger loading RSS-data from original sources.
