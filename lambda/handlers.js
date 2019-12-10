/**
    # Gigya Proxy handler
    Provides an proxy layer between OIDC RP and Gigya endpoints. Features:
    1. hides Gigya configuration from clients - API keys, client ID, client and partner secrets
    2. Inserts an Authorisation header if not present formed from client id and secret
    3. Supports AWS X-Ray (not tested)
    4. Provides a mechanism for implementing additional security/services not supported by Gigya e.g.
    4.1 PKCE (sort of)
    4.2 Dynamic Client registration (not yet)

    Config parameters are currently stored in SSM and accessed within lambda. An alternative is to handle these within CDK.
 */

const
    middy                   = require('middy'),
    httpHeaderDefaults      = require('./middleware/httpHeaderDefaults'),
    stringifyJsonResponse   = require('./middleware/stringifyJsonResponse'),
    logTrace                = require('./middleware/logTrace'),
    awsXRay                 = require('./middleware/awsXRay'),
    { Router }              = require('./router'),
    { httpHeaderNormalizer, jsonBodyParser, httpErrorHandler, urlEncodeBodyParser, httpPartialResponse } 
                            = require('middy/middlewares'),
    { log, jwtdecode, awsAssertion }
                            = require('./endpoints');

// create router and set the default handler
const router = new Router();

router
    .post('/decode',      jwtdecode)
    .post('/assertAWS',   awsAssertion);

const eventHandler = async (event, context) => {
    log('event', JSON.stringify(event));
    log('context', JSON.stringify(context));
    return router.handle(event, context);
}

let handler = middy(eventHandler)
    .use(awsXRay())
    .use(httpHeaderNormalizer())
    .use(httpHeaderDefaults())
    .use(jsonBodyParser())
    .use(urlEncodeBodyParser())
    .use(httpErrorHandler())
    .use(httpPartialResponse())
    .use(stringifyJsonResponse())
    .use(logTrace(log));

module.exports.proxyHandler = handler;