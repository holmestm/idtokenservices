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
```
CertifiedProxyEndpointAlias = {custom api} -> {mapped api endpoint} -> {public api endpoint}
```
You will need to create a CNAME alias that maps {custom api} -> {mapped api endpoint}
e.g. 
```
✅  CdkIdservicesStack (no changes)

Outputs:
CdkIdservicesStack.CertifiedProxyEndpointAlias = ids.gravitaz.co.uk -> d-oq6q58gwo1.execute-api.eu-west-2.amazonaws.com -> https://6j610jjs96.execute-api.eu-west-2.amazonaws.com/prod/
CdkIdservicesStack.IDSAPIProxyEndpoint1E39B163 = https://6j610jjs96.execute-api.eu-west-2.amazonaws.com/prod/
```
You must create a CNAME alias ids.gravitaz.co.uk -> d-oq6q58gwo1.execute-api.eu-west-2.amazonaws.com

AWS CDK will retain that mapping between deploys.

# Example call

```
POST /decode HTTP/1.1
Content-Type: application/x-www-form-urlencoded
User-Agent: PostmanRuntime/7.20.1
Accept: */*
Cache-Control: no-cache
Postman-Token: 9c95c6e2-651d-40b4-a933-93eeb2fc3db7
Host: ids.gravitaz.co.uk
Accept-Encoding: gzip, deflate
Content-Length: 1099
Connection: keep-alive

token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlJURkNOREF6TVRNd01UQkNOVVkyUTBRd1FUZENNVVE0UlRBNE9EVTROVUV5UXpneU1qRkJSZyIsImtleWlkIjoiUlRGQ05EQXpNVE13TVRCQ05VWTJRMFF3UVRkQ01VUTRSVEE0T0RVNE5VRXlRemd5TWpGQlJnIn0.eyJpc3MiOiJodHRwczovL29hdXRoLmdyYXZpdGF6LmNvLnVrIiwiZXhwIjoxODkxMjY3NTQzLCJpYXQiOjE1NzU5MDc1NDMsImF1ZCI6InR4TFQxeE55SF80WGNjb2VXWWNUR3ljOCIsImF1dGhfdGltZSI6MTU3NTkwNzUzNywic3ViIjoiMGU3NDk2OWRlYTAxNDc5ZTkxNTVhZjJhM2FkNWMzNjQiLCJuYW1lIjoidGVzdDIgZ3Jhdml0YXoiLCJmYW1pbHlfbmFtZSI6ImdyYXZpdGF6IiwiZ2l2ZW5fbmFtZSI6InRlc3QyIiwicGljdHVyZSI6Imh0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL3YyLjEyLzExMjY4MjYxNjgxMTk3Ny9waWN0dXJlP3R5cGU9bGFyZ2UiLCJnZW5kZXIiOiJtYWxlIiwiYmlydGhkYXRlIjoiMTkzMiIsImVtYWlsIjoidGVzdDJAZ3Jhdml0YXouY28udWsiLCJub25jZSI6IjE1NzU5MDc1MjkifQ.ozWE2nYcAxITcaXKo6huqvTIqM5zlNFt4yuFnUJebDsBwFxkkcdP1BTt47y2_aGyXEfYXnREvhA3sENniUvYGgX_fElUwGhKTM1_SrcwlgwSDUvwqKzj1xtYvOByjmQYToaGkZL0VGqtk0pHRjrLXAM4v7jFK6jGw8aXOJtiBHRVvbfxy7QRC7BGf5pxnKRQ2m8-_gE3kAt_yPpdSZkdDO2GmaVXHn_hsYBQ4Z4KWe-oh1VaMmO_fhHrtbMtbd4zpMVoV38w1PfpBlC6Bb7pXEjGGSbQ4t1fg-hTceMHcEdDiMnUkuFiPcmHNkvHUDH4f_yIdcHKFm_dUXf5nTFL6Q

HTTP/1.1 200 OK
Date: Tue, 10 Dec 2019 10:00:09 GMT
Content-Type: application/json
Content-Length: 406
Connection: keep-alive
x-amzn-RequestId: 7c6aadcb-ef10-4545-bc85-2179e29c9fe2
X-JWT-Verified: true
x-amz-apigw-id: Ee3qJHy-rPEFpCw=
X-Amzn-Trace-Id: Root=1-5def6ca7-f6abcc12659e26da103aae7e;Sampled=0
pragma: nocache

{"iss":"https://oauth.gravitaz.co.uk","exp":1891267543,"iat":1575907543,"aud":"txLT1xNyH_4XccoeWYcTGyc8","auth_time":1575907537,"sub":"0e74969dea01479e9155af2a3ad5c364","name":"test2 gravitaz","family_name":"gravitaz","given_name":"test2","picture":"https://graph.facebook.com/v2.12/112682616811977/picture?type=large","gender":"male","birthdate":"1932","email":"test2@gravitaz.co.uk","nonce":"1575907529"}
```
Note the custom HTTP Header in the response: _X-JWT-Verified: true_
