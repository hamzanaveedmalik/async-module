var async=require("async");
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var queryString = require('querystring');
var url = require('url');
var jsdom = require("jsdom");

const port = process.env.PORT || 3000;
var titles=[];

var server = http.createServer( (req, res) => {

    if (req.method == 'GET') {

        async.waterfall([
            function getQueryParamFunc(callback)
            {
                var queryString = url.parse(req.url, true).query;
                console.log('----');
                console.log('----');
                console.log(queryString);

                if(!queryString.address)
                {

                    res.end('<h1>Error 404</h1>');
                    return;
                }

                callback(null, queryString);
            },

            function requestForAddresses(queryString,callback)
            {
                var count=Object.keys(queryString.address).length;

                if(typeof queryString.address ==='string')
                {
                    count=1;
                }

                if(count>1)
                {
                    queryString.address.forEach((element) => {
                        console.log(element);
                                request(element, (error, response, body)=> {
                                    if(error){
                                        titles.push(error.message);
                                        if(titles.length==count)
                                                callback(null,titles);

                                    }
                                    else{
                                        var $ = cheerio.load(body);
                                        var title = $("title");
                                        console.log(title.html());
                                        titles.push(title.html());

                                        if(titles.length==count)
                                            callback(null,titles);
                                    }
                                })
                            }, this);
                        }
                        else{
                            console.log(queryString.address);
                            request(queryString.address, (error, response, body) => {
                                    if(error){
                                        titles.push(error.message);
                                        if(titles.length==count)
                                            callback(null,titles);

                                        }
                                    else{
                                        var $ = cheerio.load(body);
                                        var title = $("title");
                                        console.log(title.html());
                                        titles.push(title.html());

                                        if(titles.length==count)
                                            callback(null,titles);
                                    }
                                })
                        }

            },

            function renderHtml(titles,callback){
                fs.readFile('./views.html', 'utf8', (error, data) => {
                    jsdom.env(data, [], function (errors, window) {
                        var $ = require('jquery')(window);

                        for(var i=0;i<titles.length;i++)
                            $("ul").append('<li>'+titles[i]+'</li>');



                        callback(null, window.document.documentElement.outerHTML);


                    });
                });
            }


        ],(err,result)=>
        {
            if(err){
                res.writeHeader(200, {"Content-Type": "text/html"});
                res.end("Error 500" + err.message);

            }
                res.writeHeader(200, {"Content-Type": "text/html"});
                res.write(result);
                res.end();
        });



    }
      else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Error 404: ' + req.method +' not supported</h1>');
      }
    })

server.listen(port, ()=> {
  console.log(`Server is up on port: ${port}`);
});
