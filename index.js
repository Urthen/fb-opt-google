var querystring = require('querystring'),
    Entities = require('html-entities').AllHtmlEntities,
    request = require('request'),
    _ = require('lodash'),
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

function imageSearch(route, args, animated) {
    var query = { v : '1.0', q : args.join(' '), rsz : '8', safe : 'active' };

    if (animated) {
        query.imgtype = 'animated';
    }
    var url = 'http://ajax.googleapis.com/ajax/services/search/images?' + querystring.stringify(query);

    request.get(url, function (err, res, body) {
        var results = JSON.parse(body),
            data = results.responseData;

        if (results && results.responseData && results.responseData.results && results.responseData.results.length > 0) {
            var imageUrl = _.sample(data.results).unescapedUrl;
            if (/(png|jpe?g|gif)/i.test(imageUrl.split('.').pop())) {
                route.send(imageUrl);
            } else {
                route.send(imageUrl + '.png');
            }
        } else {
            route.send('?google_no_results');
        }
    });
}

module.exports = {
    displayname : 'Google',
    description : 'Let me google that for you.',

    commands : [{
            name : 'Google',
            description : 'Finds the first search result. Use the "more" option to get more results.',
            usage : 'google [more] (search terms)',
            trigger : /google/i,
            func : googleSearch
        },
        {
            name : 'Image Search',
            description : 'Searches for images for your query, and returns a random result.',
            usage : 'image [me] (search terms)',
            trigger : /image( me)?/i,
            func : function (route, args) {
                imageSearch(route, args, false);
            }
        },
        {
            name : 'Animated Image Search',
            description : 'Searches for animated images for your query, and returns a random result.',
            usage : 'animate [me] (search terms)',
            trigger : /animate( me)?/i,
            func : function (route, args) {
                imageSearch(route, args, true);
            }
        }
    ]
};