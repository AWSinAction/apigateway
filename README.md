# AWS in Action: API Gateway

The example in this repository reuses the example from chapter 10 in [Amanzon Web Services in Action](https://www.manning.com/books/amazon-web-services-in-action). You can find the code for the original example in the book's [code repository](https://github.com/AWSinAction/code/tree/master/chapter10).

Use [Swagger UI](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/AWSinAction/apigateway/master/swagger.json) to have a look at the API definition.

## Setup

You have multiple options to setup the example:

1. Using the [Serverless Framework](http://serverless.com/)
2. Using CloudFormation
3. Using CloudFormation, [Swagger / OpenAPI Specification](https://openapis.org/specification) and the AWS CLI
4. Deprecated: ~~Using CloudFormation, [Swagger / OpenAPI Specification](https://openapis.org/specification) and the [Amazon API Gateway Importer](https://github.com/awslabs/aws-apigateway-importer)~~

### Using the Serverless Framework

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway/
```

install the Serverless Framework

```
$ npm install -g serverless@1.0.0-rc.1
```

switch to the `serverless-framework` folder and install the dependencies

```
$ cd serverless-framework/
$ npm install --production
```

deploy the API

```
$ serverless deploy
[...]
Service Information
[...]
endpoints:
  GET - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/category/{category}/task
  PUT - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}/task/{taskId}
  DELETE - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}/task/{taskId}
  GET - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}/task
  POST - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}/task
  GET - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}
  DELETE - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user/{userId}
  GET - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user
  POST - https://$ApiId.execute-api.us-east-1.amazonaws.com/dev/user
functions:
[...]
```

export the API endpoint from above in a environment variable to easily make calls the the API next.

```
export ApiGatewayEndpoint=" https://$ApiId.execute-api.us-east-1.amazonaws.com/dev"
```

and now [use the RESTful API](#use-the-restful-api).

### Using CloudFormation

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway/
```

create the lambda code file (`lambda.zip`)

```
$ npm install --production
$ ./bundle.sh
```

create an S3 bucket in the US East (N. Virginia, `us-east-1`) region and upload the `lambda.zip` file (replace `$S3Bucket` with a S3 bucket name)

```
$ export AWS_DEFAULT_REGION=us-east-1
$ export S3Bucket=$(whoami)-apigateway
$ aws s3 mb s3://$S3Bucket
$ aws s3 cp lambda.zip s3://$S3Bucket/lambda.zip
```

create cloudformation stack (replace `$S3Bucket` with your S3 bucket name)

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template_with_api.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=$S3Bucket
```

wait until the stack is created (`CREATE_COMPLETE`)

```
$ aws cloudformation wait stack-create-complete --stack-name apigateway
```

get the `$ApiId`

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[0].Outputs
```

set the `$ApiGatewayEndpoint` environment variable (replace `$ApiId`)

```
export ApiGatewayEndpoint="$ApiId.execute-api.us-east-1.amazonaws.com/v1"
```

and now [use the RESTful API](#use-the-restful-api).

### Using CloudFormation, Swagger / OpenAPI Specification and the AWS CLI

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway/
```

create the lambda code file (`lambda.zip`)

```
$ npm install --production
$ ./bundle.sh
```

create an S3 bucket in the US East (N. Virginia, `us-east-1`) region and upload the `lambda.zip` file (replace `$S3Bucket` with a S3 bucket name)

```
export AWS_DEFAULT_REGION=us-east-1
export S3Bucket=$(whoami)-apigateway
$ aws s3 mb s3://$S3Bucket
$ aws s3 cp lambda.zip s3://$S3Bucket/lambda.zip
```

create cloudformation stack (replace `$S3Bucket` with your S3 bucket name)

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=$S3Bucket
```

wait until the stack is created (`CREATE_COMPLETE`)

```
$ aws cloudformation wait stack-create-complete --stack-name apigateway
```

replace **all nine occurrences** of `$AWSRegion` in `swagger.json` with the region that you are creating your API and Lamdba in

```
$ sed -i '.bak' 's/$AWSRegion/us-east-1/g' swagger.json
```

get the `LambdaArn`

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[0].Outputs
```

replace **all nine occurrences** of `$LambdaArn` in `swagger.json` with the ARN from the stack output above (e.g. `arn:aws:lambda:us-east-1:YYY:function:apigateway-Lambda-XXX`)

```
$ sed -i '.bak' 's/$LambdaArn/arn:aws:lambda:us-east-1:YYY:function:apigateway-Lambda-XXX/g' swagger.json
```

deploy the API Gateway

> make sure you have an up-to-date version (`aws --version`) of the AWS CLI >= 1.10.18. Learn more here: http://docs.aws.amazon.com/cli/latest/userguide/installing.html

```
$ aws apigateway import-rest-api --fail-on-warnings --body file://swagger.json
```

update the CloudFormation template to set the `ApiId` parameter (replace `$ApiId` with the `id` output from above)

```
$ aws cloudformation update-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,UsePreviousValue=true ParameterKey=S3Key,UsePreviousValue=true ParameterKey=ApiId,ParameterValue=$ApiId
```

deploy to stage v1 (replace `$ApiId`)

```
$ aws apigateway create-deployment --rest-api-id $ApiId --stage-name v1
```

set the `$ApiGatewayEndpoint` environment variable (replace `$ApiId`)

```
export ApiGatewayEndpoint="$ApiId.execute-api.us-east-1.amazonaws.com/v1"
```

and now [use the RESTful API](#use-the-restful-api).

### Deprecated: ~~Using CloudFormation, Swagger / OpenAPI Specification and the Amazon API Gateway Importer~~

> This method is deprecated. Please choose one of the other methods mentioned earlier!

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway/
```

create the lambda code file (`lambda.zip`)

```
$ npm install --production
$ ./bundle.sh
```

create an S3 bucket in the US East (N. Virginia, `us-east-1`) region and upload the `lambda.zip` file (replace `$S3Bucket` with a S3 bucket name)

```
export AWS_DEFAULT_REGION=us-east-1
export S3Bucket=$(whoami)-apigateway
$ aws s3 mb s3://$S3Bucket
$ aws s3 cp lambda.zip s3://$S3Bucket/lambda.zip
```

create cloudformation stack (replace `$S3Bucket` with your S3 bucket name)

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=$S3Bucket
```

wait until the stack is created (`CREATE_COMPLETE`)

```
$ aws cloudformation wait stack-create-complete --stack-name apigateway
```

replace **all nine occurrences** of `$AWSRegion` in `swagger.json` with the region that you are creating your API and Lamdba in

```
$ sed -i '.bak' 's/$AWSRegion/us-east-1/g' swagger.json
```

get the `LambdaArn`

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[0].Outputs
```

replace **all nine occurrences** of `$LambdaArn` in `swagger.json` with the ARN from the stack output above (e.g. `arn:aws:lambda:us-east-1:YYY:function:apigateway-Lambda-XXX`)

```
$ sed -i '.bak' 's/$LambdaArn/arn:aws:lambda:us-east-1:YYY:function:apigateway-Lambda-XXX/g' swagger.json
```

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

set the `$ApiGatewayEndpoint` environment variable (replace `$ApiId`)

```
export ApiGatewayEndpoint="$ApiId.execute-api.us-east-1.amazonaws.com/stage/v1"
```

and now [use the RESTful API](#use-the-restful-api).

## Use the RESTful API

the following examples assume that you replace `$ApiGatewayEndpoint` with `$ApiId.execute-api.us-east-1.amazonaws.com`

create a user

```
curl -vvv -X POST -d '{"email": "your@mail.com", "phone": "0123456789"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/user
```

list users

```
curl -vvv -X GET https://$ApiGatewayEndpoint/user
```

create a task

```
curl -vvv -X POST -d '{"description": "test task"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/user/$UserId/task
```

list tasks

```
curl -vvv -X GET https://$ApiGatewayEndpoint/user/$UserId/task
```

mark task as complete

```
curl -vvv -X PUT https://$ApiGatewayEndpoint/user/$UserId/task/$TaskId
```

delete task

```
curl -vvv -X DELETE https://$ApiGatewayEndpoint/user/$UserId/task/$TaskId
```

create a task with a category

```
curl -vvv -X POST -d '{"description": "test task", "category": "test"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/user/$UserId/task
```

list tasks by category

```
curl -vvv -X GET https://$ApiGatewayEndpoint/category/$Category/task
```

## Teardown

### Using the Serverless Framework

remove the API

```
$ serverless remove
```

### Using CloudFormation

delete CloudFormation stack

```
$ aws cloudformation delete-stack --stack-name apigateway
```

delete S3 bucket (replace `$S3Bucket`)

```
$ aws s3 rb --force s3://$S3Bucket
```

### Using CloudFormation, Swagger / OpenAPI Specification and the AWS CLI

delete API Gateway (replace `$ApiId`)

```
$ aws apigateway delete-rest-api --rest-api-id $ApiId
```

delete CloudFormation stack

```
$ aws cloudformation delete-stack --stack-name apigateway
```

delete S3 bucket (replace `$S3Bucket`)

```
$ aws s3 rb --force s3://$S3Bucket
```


### Using CloudFormation, Swagger / OpenAPI Specification and the Amazon API Gateway Importer

delete API Gateway (replace `$ApiId`)

```
$ aws apigateway delete-rest-api --rest-api-id $ApiId
```

delete CloudFormation stack

```
$ aws cloudformation delete-stack --stack-name apigateway
```

delete S3 bucket (replace `$S3Bucket`)

```
$ aws s3 rb --force s3://$S3Bucket
```
