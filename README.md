# AWS in Action: API Gateway

The example in this repository reuses the example from chapter 10 in [Amanzon Web Services in Action](https://www.manning.com/books/amazon-web-services-in-action). You can find the code for the original example in the book's [code repository](https://github.com/AWSinAction/code/tree/master/chapter10).

## Setup

clone this repository

```
$ git clone git@github.com:AWSinAction/apigateway.git
$ cd apigateway
```

create the lambda code file (`lambda.zip`)

```
$ ./bundle.sh
```

create an S3 bucket and upload the `lambda.zip` file 

create cloudformation stack (replace `$S3Bucket` with your S3 bucket name)

```
$ aws cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=$S3Bucket
```

wait until the stack is created (you will see something instead of `[]` if it is created)

```
$ aws cloudformation describe-stacks --stack-name apigateway --query Stacks[].Outputs
```

adjust `swagger.json` to use the correct lambda function ARNs (e.g. arn:aws:lambda:us-east-1:878533158213:function:apigateway-GetUsersLambda-MQ3D7Q3AAQK) with the outputs of the above `describe-stacks` command

deploy the API Gateway

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --create ../swagger.json
$ cd ..
```

using the CLI to see if ot worked

```
$ aws apigateway get-rest-apis
```

update the CloudFormation template to set the ApiId parameter (replace $ApiId with the `id` output from above)

```
$ aws cloudformation update-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,UsePreviousValue=true ParameterKey=S3Key,UsePreviousValue=true ParameterKey=ApiId,ParameterValue=$ApiId
```

deploy to stage

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --update $ApiId --deploy stage ../swagger.json
$ cd ..
```

## Use the API

the following examples assume that you replace $ApiGatewayEndpoint with `https://$ApiId.execute-api.us-east-1.amazonaws.com/stage/`

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

create a task with a category

```
curl -vvv -X POST -d '{"description": "test task", "category": "test"}' -H "Content-Type: application/json" https://$ApiGatewayEndpoint/stage/v1/user/$userId/task

```
list tasks by category

```
curl -vvv -X GET ttps://$ApiGatewayEndpoint/stage/v1/category/$category/task
```

