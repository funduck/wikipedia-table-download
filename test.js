'use strict';

const assert = require('assert')

require('./index.js')
    ('List_of_mobile_telephone_prefixes_by_country')
    .then((res) => {
        assert.equal(Object.keys(res).length, 1);
        assert(res[Object.keys(res)[0]].length > 100);
        console.log('ok')
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
