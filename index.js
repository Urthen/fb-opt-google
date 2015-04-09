var querystring = require('querystring'),
    Entities = require('html-entities').AllHtmlEntities,
    request = require('request'),
    util = require('util');

var entities = new Entities();

function googleSearch(route, args) {
    var more = args[0] === 'more',
        url;

    if (more) {
        args = args.slice(1);
    }

    url = 'http://ajax.googleapis.com/ajax/services/search/web?' + querystring.stringify({ v : '1.0', q : args.join(' ') });

    request.get(url, function (err, res, body) {
        var results = JSON.parse(body),
            data = results.responseData;

        if (data.results) {
            if (more) {
                var msg = '';

                for (var i = 0; i < data.results.length; i++) {
                    msg += util.format('\n%d: %s - %s', i + 1, entities.decode(data.results[i].titleNoFormatting), data.results[i].url);
                }
                route.send('?google_more_results', msg, data.cursor.moreResultsUrl);
            } else {
                route.send(entities.decode(data.results[0].titleNoFormatting) + ' - ' + data.results[0].url);
            }
        } else {
            route.send('?google_no_results');
        }
    }.bind(this));
}

module.exports = {
    displayname : 'Google',
    description : 'Let me google that for you.',

    commands : [{
            name : 'Google',
            description : 'Finds the first search result. Use the "more" option to get more results.',
            usage : 'google [more ](search terms)',
            trigger : /google/i,
            func : googleSearch
        }
    ]
};