# AWS in Action: API Gateway

The example in this repository reuses the example from chapter 10 in [Amanzon Web Services in Action](https://www.manning.com/books/amazon-web-services-in-action). You can find the code for the original example in the book's [code repository](https://github.com/AWSinAction/code/tree/master/chapter10).

## Setup

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway/
```

create the lambda code file (`lambda.zip`)

```
$ npm install
$ ./bundle.sh
```

create an S3 bucket in the US East (N. Virginia, `us-east-1`) region and upload the `lambda.zip` file (replace `$S3Bucket` with a S3 bucket name)

```
export AWS_DEFAULT_REGION=us-east-1
$ aws s3 mb s3://$S3Bucket
$ aws s3 cp lambda.zip s3://$S3Bucket/lambda.zip
```

create cloudformation stack (replace `$S3Bucket` with your S3 bucket name)

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=$S3Bucket
```

wait until the stack is created (you will see something instead of `[]` if it is created)

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[].Outputs
```

replace **all nine occurrences** of `$LambdaArn` in `swagger.json` with the ARN from the stack output above (e.g. `arn:aws:lambda:us-east-1:YYY:function:apigateway-Lambda-XXX`)

deploy the API Gateway

```
$ cd aws-apigateway-importer-master/
$ mvn assembly:assembly
$ ./aws-api-import.sh --create ../swagger.json
$ cd ..
```

using the CLI to see if it worked

```
$ aws apigateway get-rest-apis
```

update the CloudFormation template to set the `ApiId` parameter (replace `$ApiId` with the `id` output from above)

```
$ aws cloudformation update-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,UsePreviousValue=true ParameterKey=S3Key,UsePreviousValue=true ParameterKey=ApiId,ParameterValue=$ApiId
```

deploy to stage (replace `$ApiId`)

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --update $ApiId --deploy stage ../swagger.json
$ cd ..
```

## Use the API

the following examples assume that you replace `$ApiGatewayEndpoint` with `$ApiId.execute-api.us-east-1.amazonaws.com`

create a user

```
curl -vvv -X POST -d '{"email": "your@mail.com", "phone": "0123456789"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/stage/v1/user
```

list users

```
curl -vvv -X GET https://$ApiGatewayEndpoint/stage/v1/user
```

create a task

```
curl -vvv -X POST -d '{"description": "test task"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/stage/v1/user/$UserId/task
```

list tasks

```
curl -vvv -X GET https://$ApiGatewayEndpoint/stage/v1/user/$UserId/task
```

mark task as complete

```
curl -vvv -X PUT https://$ApiGatewayEndpoint/stage/v1/user/$UserId/task/$TaskId
```

delete task

```
curl -vvv -X DELETE https://$ApiGatewayEndpoint/stage/v1/user/$UserId/task/$TaskId
```

create a task with a category

```
curl -vvv -X POST -d '{"description": "test task", "category": "test"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/stage/v1/user/$UserId/task

```
list tasks by category

```
curl -vvv -X GET https://$ApiGatewayEndpoint/stage/v1/category/$Category/task
```
