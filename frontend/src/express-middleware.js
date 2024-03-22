export default function (config) {
  if (__SERVER__) {
    const express = require('express');
    const { getAPIResourceWithAuth } = require('@plone/volto/helpers');

    const HEADERS = ['content-type', 'content-disposition', 'cache-control'];

    function imageMiddleware(req, res, next) {
      getAPIResourceWithAuth(req)
        .then((resource) => {
          // Just forward the headers that we need
          HEADERS.forEach((header) => {
            if (resource.headers[header]) {
              res.set(header, resource.headers[header]);
            }
          });
          res.send(resource.body);
        })
        .catch(next);
    }

    const middleware = express.Router();

    middleware.all(['**/@@fallback-image/*'], imageMiddleware);
    middleware.id = 'fallbackImageResourcesProcessor';
    config.settings.expressMiddleware.push(middleware);
  }
  return config;
}
