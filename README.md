# AWS in Action: API Gateway

The example in this repository reuses the example from chapter 10 in [Amanzon Web Services in Action](https://www.manning.com/books/amazon-web-services-in-action). You can find the code for the original example in the book's [code repository](https://github.com/AWSinAction/code/tree/master/chapter10).

THIS IS STILL WORK IN PROGRESS!

## Setup

Create cloudformation stack

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=apigateway-mwittig ParameterKey=S3Key,ParameterValue=lambda_v3.zip
```

wait until the stack is created

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[].Outputs
```

adjust `swagger.json` to use the correct lambda functions (output of the stack created before)

deploy the API Gateway

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --create ../swagger.json
$ cd ..
```

update the CloudFormation template to set the AppId parameter (replace $`AppId`)

```
$ aws cloudformation update-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,UsePreviousValue=true ParameterKey=S3Key,UsePreviousValue=true ParameterKey=AppId,ParameterValue=$AppId
```

deploy to stage

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --update API_ID --deploy stage ../swagger.json
$ cd ..
```

## Use the API

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
curl -vvv -X POST -d '{"description": "test task"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/stage/v1/user/$userId/task
```

list tasks

```
curl -vvv -X GET ttps://$ApiGatewayEndpoint/stage/v1/user/$userId/task
```

mark task as complete

```
curl -vvv -X PUT https://$ApiGatewayEndpoint/stage/v1/user/$userId/task/$taskId
```

delete task

```
curl -vvv -X DELETE https://$ApiGatewayEndpoint/stage/v1/user/$userId/task/$taskId
```


