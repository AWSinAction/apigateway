# API Gateway demo

WORK IN PROGRESS

## create API Gateway from Swagger.json

Create cloudformation stack

```
$ aws --profile awsinaction cloudformation create-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,ParameterValue=apigateway-mwittig ParameterKey=S3Key,ParameterValue=lambda_v3.zip

$ aws --profile awsinaction cloudformation describe-stacks --stack-name apigateway --query Stacks[].Outputs
```

adjust `swagger.json` to use the correct lambda function (output of the stack created before)

deploy the API Gateway

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --create ../swagger.json --profile awsinaction
$ cd ..
```

update the CloudFormation template to set the AppId parameter

```
$ aws --profile awsinaction cloudformation update-stack --stack-name apigateway --template-body file://template.json --capabilities CAPABILITY_IAM --parameters ParameterKey=S3Bucket,UsePreviousValue=true ParameterKey=S3Key,UsePreviousValue=true ParameterKey=AppId,ParameterValue=XXX
```

deploy to stage

```
$ cd aws-apigateway-importer-master/
$ ./aws-api-import.sh --update API_ID --deploy stage ../swagger.json --profile awsinaction
$ cd ..
```