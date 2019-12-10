// wrapper around jwks libraries to work with JWT verification use cases
// we also try and catche the jwks client objects since they involve a network 
// round trip to the host in order to obtain appropriate keys

const 
    truthy = require('truthy'),
    jwt    = require('jsonwebtoken'),
    jwks   = require('jwks-rsa');

let opts = {
    TTL: 1000 * 60 * 10, // 10 minutes
    log: function () { if (truthy(process.env.DEBUG)) { console.log(...arguments) } }
}

let jwksClients = {}; // simple in memory cache

// regenerate jwks client after TTL
const findJwksClient = function (issuer) {
    let now = new Date(),
        jwksEntry = jwksClients[issuer];
    if (jwksEntry) {
        let { jwksClient, timestamp } = jwksEntry;
        if ((now - timestamp) < opts.TTL) {
            return jwksClient;
        }
    }
    let jwksUri = issuer + '/.well-known/jwks.json';
    jwksClient = jwks({ 
        jwksUri: jwksUri, 
        cache: true,
        rateLimit: true    
    });
    jwksClients[issuer]={ jwksClient, timestamp: now };
    return jwksClient
};

module.exports = {
    configure: function (newopts) {
        opts = {...opts, ...newopts}
    },
    jwtdecode: async function (token, verify) {
        let verified = false,
            response = {};
        try {
            response.statusCode = 200;
            response.body = jwt.decode(token, { complete: true });

            if (verify) {
                let jwksClient = findJwksClient(response.body.payload.iss);
                let getKey = (header, callback) => {
                    jwksClient.getSigningKey(header.kid, (err, key) => {
                        if (key) {
                            var signingKey = key.publicKey || key.rsaPublicKey;
                            if (signingKey) {
                                callback(null, signingKey);
                            } else {
                                callback(err, "No public key for KID");
                            }
                        } else {
                            callback(err, "No public key for KID");
                        }
                    });
                };
                const psVerify = (token) => {
                    return new Promise((resolve, reject) => {
                        jwt.verify(token, getKey, (err, data) => {
                            if (err) reject(err);
                            resolve(data);
                        })
                    });
                };
                response.body = await psVerify(token);
                verified = true;
            }
        } catch (e) {
            response.statusCode = 500;
            opts.log('jwks.jwtdecode - error', e);
            response.body = {'error': e, ...response.body};
        }
        response.headers = { 'content-type': "application/json", pragma: 'nocache', 'X-JWT-Verified': verified };
        return response;
    }
};