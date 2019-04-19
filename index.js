'use strict';

const when = require('when');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const https = require('https');

let $;

const getHTML = (url) => {
    const d = when.defer();

    https.get(url, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
            `Status Code: ${statusCode}`);
        }
        if (error) {
            // consume response data to free up memory
            res.resume();
            return d.reject(error);
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                d.resolve(rawData);
            } catch (e) {
                d.reject(error);
            }
        });
    }).on('error', (e) => {
        d.reject(e)
    });

    return d.promise;
}

const parsedTableToJson = (cols) => {
    const keys = [];
    for (const i in cols) {
        keys.push(cols[i][0]);
    }

    const rows = [];
    for (let i = 1; i < cols[0].length; i++) {
        const row = {};
        row[keys[0]] = cols[0][i];
        rows.push(row);
    }

    for (let c = 1; c < cols.length; c++) {
        for (let i = 1; i < cols[c].length; i++) {
            rows[i - 1][keys[c]] = cols[c][i];
        }
    }

    return rows;
}

const main = (url, article) => {
    url = url || 'https://en.wikipedia.org/wiki/';

    return getHTML(`${url}${article || ''}`)
    .then((doc) => {
        //console.log('downloaded HTML, building jQuery')
        //console.log(doc)

        const tables = {};

        $ = cheerio.load(doc)
        cheerioTableparser($);
        $('table').each(function() {
            const parsedTable = $(this).parsetable(false, true, true);
            //console.log(parsedTable)

            const table = parsedTableToJson(parsedTable);
            //console.log(table)
            if (table.length == 0) return;

            const tableDescr = Object.keys(table[0]).join('|');
            //console.log(tableDescr)

            tables[tableDescr] = tables[tableDescr] || [];
            tables[tableDescr] = tables[tableDescr].concat(table)
        })

        return tables;
    })
    .catch((e) => {
        console.log(e)
    })
}

module.exports = main;

if (process.argv[1] == module.filename) {
    main(process.argv[2] || 'https://en.wikipedia.org/wiki/List_of_mobile_telephone_prefixes_by_country')
    .then((res) => {console.log(JSON.stringify(res, null, '  '))});
}
