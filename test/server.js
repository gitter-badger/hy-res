'use strict';

var express = require('express');
var hal = require('express-hal');
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
var api = express();

api.use(hal.middleware);
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());
api.use(bodyParser.json({ type: 'application/*+json' }));
api.use(multer());

var posts = [];

api.route('/')
  .options(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
       .header('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
       .header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type')
       .header('Access-Control-Expose-Headers', 'Location')
       .sendStatus(204);
  })
  .get(function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');

    res.format({
      'application/hal+json': function() {
        res.hal({
          links: {
            self: req.url,
            'thing-template': { href: api.mountpath + '/things{/id}', templated: true }
          }
        });
      },
      'application/vnd.collection+json': function () {
        res.json({
          collection: {
            href: req.url,
            links: [
              {rel: 'posts', href: api.mountpath + '/posts'}
            ],

            items: [
              {
                'href': 'http://example.org/friends/jdoe',
                'data': [
                  {'name': 'full-name', 'value': 'J. Doe', 'prompt': 'Full Name'},
                  {'name': 'email', 'value': 'jdoe@example.org', 'prompt': 'Email'}
                ],
                'links': [
                  {'rel': 'blog', 'href': 'http://examples.org/blogs/jdoe', 'prompt': 'Blog'},
                  {'rel': 'avatar', 'href': 'http://examples.org/images/jdoe', 'prompt': 'Avatar', 'render': 'image'}
                ]
              },

              {
                'href': 'http://example.org/friends/msmith',
                'data': [
                  {'name': 'full-name', 'value': 'M. Smith', 'prompt': 'Full Name'},
                  {'name': 'email', 'value': 'msmith@example.org', 'prompt': 'Email'}
                ],
                'links': [
                  {'rel': 'blog', 'href': 'http://examples.org/blogs/msmith', 'prompt': 'Blog'},
                  {'rel': 'avatar', 'href': 'http://examples.org/images/msmith', 'prompt': 'Avatar', 'render': 'image'}
                ]
              }
            ],

            template: {
              data: [
                {name: 'full-name', prompt: 'Full Name'},
                {name: 'email', prompt: 'Email'}
              ]
            }
          }
        });
      },
      'application/vnd.siren+json': function() {
        res.json({
          links: [
            { rel: ['self'], href: req.url }
          ],
          actions: [
            {
              name: 'search',
              title: 'Search Posts',
              href: api.mountpath + '/posts',
              fields: [
                { name: 'q', title: 'Search' }
              ]
            },
            {
              name: 'create-form',
              title: 'New Post',
              href: api.mountpath + '/posts',
              method: 'POST',
              fields: [
                { name: 'title', title: 'Title' },
                { name: 'post', title: 'Post' }
              ]
            },
            {
              name: 'edit-form',
              title: 'Edit Post',
              href: api.mountpath + '/posts/1',
              method: 'PUT',
              type: 'multipart/form-data',
              fields: [
                { name: 'title', title: 'Title', value: 'First Post!' },
                { name: 'post', title: 'Post', value: 'hy-res rocks!' }
              ]
            },
            {
              name: 'edit-form-json',
              title: 'Edit Post',
              href: api.mountpath + '/posts/1',
              method: 'PUT',
              type: 'application/json',
              fields: [
                { name: 'title', title: 'Title', value: 'First Post!' },
                { name: 'post', title: 'Post', value: 'hy-res rocks!' }
              ]
            }
          ]
        });
      }
    });
  });

api.route('/posts')
  .options(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
       .header('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
       .header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type')
       .sendStatus(204);
  })
  .get(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.format({
      'application/json': function () {
        res.json(req.query);
      },
      'application/vnd.collection+json': function () {
        res.json({
          collection: {
            href: api.mountpath + '/posts',


            items: [
            ],

            template: {
              data: [
                {name: 'title', prompt: 'Post Title'},
                {name: 'body', prompt: 'Post Content'}
              ]
            }
          }
        });
      }
    });
  })
  .post(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
      .header('Access-Control-Expose-Headers', 'Location');

    if (req.is('application/vnd.collection+json')) {
      if (!req.body || !req.body.template || !req.body.template.data) {
        res.sendStatus(400);
        return;
      }

      var idx = posts.unshift(req.body.template.data);

      res.location(api.mountpath + '/posts/' + idx).sendStatus(201);
    } else if (req.is('application/x-www-form-urlencoded')) {
      res.send(req.body);
    } else {
      res.sendStatus(415);
    }
  });

api.route('/posts/:id')
  .options(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
       .header('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT')
       .header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type')
       .sendStatus(204);
  })
  .get(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.format({
      'application/vnd.collection+json': function() {
        var idx =  parseInt(req.params.id);
        if (!idx) {
          return res.sendStatus(404);
        }

        idx = idx - 1;
        if (!posts[idx]) {
          return res.sendStatus(404);
        }

        res.json({collection: {
          items: [
            {
              href: req.url,
              data: posts[idx]
            }
          ]
        }});
      }
    });
  })
  .put(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
       .json(req.body);
  });

api.route('/things/:id')
  .options(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*')
       .header('Access-Control-Allow-Methods', 'GET,OPTIONS')
       .header('Access-Control-Allow-Headers', 'Cache-Control, Pragma, Origin, Authorization, Content-Type')
       .sendStatus(204);
  })
  .get(function(req, res) {
    res.header('Access-Control-Allow-Origin', '*').type('application/hal+json').hal({
      links: {
        self: req.url
      }
    });
  });

app.use('/api', api);

var server = app.listen(10000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
