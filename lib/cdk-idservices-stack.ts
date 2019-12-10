import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import apigw = require('@aws-cdk/aws-apigateway');
import { Role, ServicePrincipal, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { Duration, CfnOutput } from '@aws-cdk/core';
import { EndpointType } from '@aws-cdk/aws-apigateway';
import { Certificate } from '@aws-cdk/aws-certificatemanager';

export class CdkIdservicesStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Context variables (override with -c on command line, defaults in cdk.json
    const
      DOMAIN_NAME               = this.node.tryGetContext('API_DOMAIN_NAME'),
      CERTIFICATE_URN           = this.node.tryGetContext('CERT_URN'),
      API_ENDPOINT_NAME         = this.node.tryGetContext('API_ENDPOINT_NAME') || "IdentityServices",
      DEBUG                     = this.node.tryGetContext('DEBUG') || "true"

    // create a bespoke role for our stack for lambda execution
    const lambdaExecutionRole = new Role(this, 'IDSLambdaExecutionRole', {
      roleName: 'IDSLambdaExecutionRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });

    // extend role with specific required permissions
    lambdaExecutionRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: ['*'],
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ]
    }));

    // lambda application code is in lambda subdirectory. It has it's own package.json and node_modules subtree. CDK will automatically 
    // package up this subtree and include it during a cdk deploy action. 
    // To update lambda code only:
    //  1. zip -r code.zip lambda/
    //  2. aws lambda update-function-code --function-name GigyaProxyHandler --zip-file fileb://code.zip [--publish]
    // 
    
    const proxy = new lambda.Function(this, 'IDSProxyHandler', {
      functionName: 'IDSProxyHandler',
      runtime:      lambda.Runtime.NODEJS_10_X,
      code:         lambda.Code.fromAsset('lambda'),
      handler:      'lambda/handlers.proxyHandler',
      role:         lambdaExecutionRole,
      timeout:      Duration.seconds(12),
      description:  'Proxy function for ID token verification endpoints',
      environment: {
        'DEBUG'                     : DEBUG
      }
    });

    // reference to previously provisioned certificate '*.gravitaz.co.uk' - a domain that I own. 
    // need to create CNAME for 'api' subdomain.
    const domainCertificate = Certificate.fromCertificateArn(this, 'SSLCertificate', CERTIFICATE_URN);
    
    // define API endpoint
    const api = new apigw.LambdaRestApi(this, 'IDSAPIProxyEndpoint', {
      restApiName:    API_ENDPOINT_NAME,
      endpointTypes:  [ EndpointType.REGIONAL ],
      handler:        proxy,
      description:    'Proxy API endpoint for ID Token services',
      domainName: {
        certificate: domainCertificate,
        domainName: DOMAIN_NAME
      }
    });

    const dn = api.domainName;

    // print out endpoint info after deployment
    if (dn) {
      new CfnOutput(this, 'CertifiedProxyEndpointAlias', {
        value: dn.domainName + ' -> ' + dn.domainNameAliasDomainName + ' -> ' + api.url
      })
    };

  }
}