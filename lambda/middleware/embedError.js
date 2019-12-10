// hide real statusCode and place in the body
let opts = {enabled: true};

module.exports = (_opts) => {
    opts = {...opts, ..._opts}
    return {
        after: (handler, next) => {
            if (opts.enabled) {
                try {
                    if (handler && handler.response && handler.response.body && handler.response.statusCode && (handler.response.statusCode>=400)) {
                        handler.response.body.statusCode = handler.response.statusCode;
                        handler.response.statusCode = 200;
                    }
                } catch (e) {
                    console.log('embedError error', e);
                }
            }
            next();
        }
    }
}

module.exports.toString = () => 'embedError';