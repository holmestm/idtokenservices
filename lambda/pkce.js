// my implementation of PKCE on top of Gigya - when a client initiates an OAuth dance if it supplies a code_challenge and 
// code challenge method we store these in a dynamodb table. When a request for a token exchange is made with a code_verifier
// we check that value matches at least one value in the table. It's not great, but if the code_verifier parameter is mandatory
// it's better than nothing. Really we want the endpoint to support PKCE because then they can associate the code_challenge with a 
// specific authentication_code - which we can't do because we don't get to see if (Gigya passes it directly to the client)

const 
    AWS = require('aws-sdk'),
    stringify = require('json-stringify-safe'),
    { fromBase64 } = require('base64url');

let opts = {
    log: function () { if (truthy(process.env.DEBUG)) { console.log(...arguments) } },
    TABLE_NAME: 'PKCE_VERIFIER'
}
    
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.configure = (newopts) => { opts = {...opts, ...newopts}};

module.exports.saveCodeRequest = async ({client_id, code_challenge, code_challenge_method, state}) => {
    let d = (new Date()).toJSON();
    let item = {
        'state'                 : {'S': state},
        'client_id'             : {'S': client_id},
        'code_challenge'        : {'S': code_challenge},
        'code_challenge_method' : {'S': code_challenge_method},
        'timestamp'             : {'S': d}
    };

    let ddbArgs = {
        'TableName': opts.TABLE_NAME,
        'Item': item
    };

    opts.log('storing', stringify(ddbArgs));
    try {
        await ddb.putItem(ddbArgs).promise();
    } catch (e) {
        opts.log('error writing to dd', stringify(e))
    }       
}

const findThenDeleteItem = async(itemKey) => {
    let ddbArgs = {
        'TableName': opts.TABLE_NAME,
        'Key': {
            'code_challenge': {
                S: itemKey
            }
        }
    };

    let response=undefined;

    opts.log('search ddb for', stringify(ddbArgs));

    try {
        response = await ddb.getItem(ddbArgs).promise();
    } catch (e) {
        opts.log('error reading from dd', stringify(e));
        return false;
    }
    opts.log('retrieved', itemKey, stringify(response));

    if (!response || !response.Item) {
        return false;
    }

    let item = response.Item;
    ddb.deleteItem(ddbArgs).promise().then(opts.log(ddbArgs, 'deleted from ddb'));
    return (item.code_challenge && (item.code_challenge.S==itemKey));

}

// only gigya knows the code prior to this so our solution is a bit crap and not sufficient for production use
module.exports.verifyCodeChallenge = async ({client_id, code_verifier, state}) => {
    if (!code_verifier) {
        return false;
    }
    // try plain then S256
    
    let found=await findThenDeleteItem(code_verifier);
    if (!found) {
        let originalChallenge = fromBase64(crypto.createHash('sha256').update(code_verifier).digest('base64'));
        found = await findThenDeleteItem(originalChallenge);
    }

    return found;
}