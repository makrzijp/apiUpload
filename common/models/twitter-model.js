'use strict';
module.exports = function (Twittermodel) {
    /**
     * fuck u
     * @param {Function(Error, string)} callback
     */
    Twittermodel.twitterSearch = function (query, amount, country, email, callback) {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        today = mm + '/' + dd + '/' + yyyy;
        var http = require('http');
        var q = query;
        var quantity = amount;
        var location = country;
        var options = {
            host: 'cdeservice.mybluemix.net'
            , path: '/api/v1/messages/search?q=' + q + '&size=' + quantity
            , method: 'GET'
            , auth: '628fee1d-7ca7-404d-a38b-d55a4997e90c:7fB4aZTMoi'
        };
        var cb = function (response) {
            var c = 0;
            var str = '';
            response.on('data', function (chunk) {
                str += chunk;
            });
            response.on('end', function () {
                var ne = 0;
                var p = 0;
                var n = 0;
                var data = JSON.parse(str);
                for (var item of data["tweets"]) {
                    if ("cde" in item) {
                        if ("content" in item["cde"]) {
                            if ("sentiment" in item["cde"]["content"]) {
                                if ("polarity" in item["cde"]["content"]["sentiment"]) {
                                    if (location == "any") {
                                        c += 1;
                                        if (item["cde"]["content"]["sentiment"]["polarity"] === "NEUTRAL") {
                                            ne += 1;
                                        }
                                        else if (item["cde"]["content"]["sentiment"]["polarity"] === "POSITIVE") {
                                            p += 1;
                                        }
                                        else if (item["cde"]["content"]["sentiment"]["polarity"] === "NEGATIVE") {
                                            n += 1;
                                        }
                                    }
                                    else if ("author" in item["cde"]) {
                                        if ("location" in item["cde"]["author"]) {
                                            if ("country" in item["cde"]["author"]["location"]) {
                                                if (item["cde"]["author"]["location"]["country"] === location) {
                                                    //console.log(item["cde"]["author"]["location"]["country"]);
                                                    c += 1;
                                                    if (item["cde"]["content"]["sentiment"]["polarity"] === "NEUTRAL") {
                                                        ne += 1;
                                                    }
                                                    else if (item["cde"]["content"]["sentiment"]["polarity"] === "POSITIVE") {
                                                        p += 1;
                                                    }
                                                    else if (item["cde"]["content"]["sentiment"]["polarity"] === "NEGATIVE") {
                                                        n += 1;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                console.log(c);
                var pne = (ne / (ne + p + n)) * 100;
                var pp = (p / (ne + p + n)) * 100;
                var pn = (n / (ne + p + n)) * 100;
                var returnVals = [];
                //create twitter top 
                //Object.getOwnPropertyNames(Twittermodel).forEach(function (item) {
                //      console.log(item);
                //})
                //for (var item of data["tweets"]) {
                var counterTop = 0;
                var authors = [];
                var bodies = [];
                var tweetlocation = [];
                for (var item of data["tweets"]) {
                    if (counterTop == 3) {
                        break;
                    }
                    if ("message" in item && "cde" in item) {
                        if ("actor" in item["message"] && "body" in item["message"] && "author" in item["cde"]) {
                            if ("preferredUsername" in item["message"]["actor"] && "location" in item["cde"]["author"]) {
                                if ("country" in item["cde"]["author"]["location"]) {
                                    if (item["message"]["actor"]["preferredUsername"] != "" && item["message"]["body"] != "" && item["cde"]["author"]["location"]["country"] != "") {
                                        authors.push(item["message"]["actor"]["preferredUsername"]);
                                        bodies.push(item["message"]["body"]);
                                        tweetlocation.push(item["cde"]["author"]["location"]["country"]);
                                        counterTop += 1;
                                    }
                                }
                            }
                        }
                    }
                }
                Twittermodel.app.models.Twittertop3model.create({
                    "Author": [
                        authors[0]
                        , authors[1]
                        , authors[2]
                      ]
                    , "Body": [
                        bodies[0]
                        , bodies[1]
                        , bodies[2]
                      ]
                    , "Location": [
                        tweetlocation[0]
                        , tweetlocation[1]
                        , tweetlocation[2]
                      ]
                }).then(function (tweets) {
                    var theid = tweets["id"];
                    Twittermodel.create({
                        "Keyword": q
                        , "Location": location
                        , "Sentiment": [
                        pp, pne, pn
                      ]
                        , "twittermodelId": theid
                        , "userEmail": email
                        , "Date": today
                    });
                });
                returnVals.push({
                    Keyword: q
                    , Location: location
                    , Sentiment: [pp, pne, pn]
                    , Author: [
                        authors[0]
                        , authors[1]
                        , authors[2]
                      ]
                    , Body: [
                        bodies[0]
                        , bodies[1]
                        , bodies[2]
                      ]
                    , TLocation: [
                        tweetlocation[0]
                        , tweetlocation[1]
                        , tweetlocation[2]
                      ]
                })
                callback(null, returnVals);
            });
        }
        http.request(options, cb).end();
    };
};