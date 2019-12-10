# CDK Project to create ID Token Service APIs

This is intended for use with AWS CDK to create a set of APIs to help verify and utilise Open ID Connect Identity Tokens

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

 ## Configuration

 Edit cdk.json and update following

"context": {
    "API_DOMAIN_NAME" : "ids.gravitaz.co.uk",
    "CERT_URN" : "arn:aws:acm:eu-west-2:384538104517:certificate/c0e83125-6b75-4c80-b146-18e7d09c7bb8",
    "API_ENDPOINT_NAME" : "IDServices",
    "DEBUG" : "true"
}

* API_DOMAIN_NAME       the FQN for use with API clients 
* CERT_URN              AWS URN of SSL certificate to apply to the above
* PROXY_FUNCTION_NAME   AWS internal friendly name for Lambda function - hint: this will be used in CloudWatch for application logs
* API_ENDPOINT_NAME     AWS internal friendly name for API endpoint to above

### Custom API URL

Note you are responsible for ensuring a custom API domain name resolves to the correct AWS endpoint. 
When you run CDK deploy CloudFormation will output the following:
CertifiedProxyEndpointAlias = <custom api> -> <mapped api endpoint> -> <public api endpoint>
You will need to create a CNAME alias that maps <custom api> -> <mapped api endpoint>

e.g. 

✅  CdkIdservicesStack (no changes)

Outputs:
CdkIdservicesStack.CertifiedProxyEndpointAlias = ids.gravitaz.co.uk -> d-oq6q58gwo1.execute-api.eu-west-2.amazonaws.com -> https://6j610jjs96.execute-api.eu-west-2.amazonaws.com/prod/
CdkIdservicesStack.IDSAPIProxyEndpoint1E39B163 = https://6j610jjs96.execute-api.eu-west-2.amazonaws.com/prod/

You must create a CNAME alias ids.gravitaz.co.uk -> d-oq6q58gwo1.execute-api.eu-west-2.amazonaws.com

AWS CDK will retain that mapping between deploys.

