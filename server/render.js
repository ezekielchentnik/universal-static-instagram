'use strict';

import React from 'react';
import createLocation from 'history/lib/createLocation';
import {RoutingContext, match} from 'react-router';
import {Provider} from 'react-redux';
import routes from '../src/routes';
import slash from '../src/helpers/slash';
import pathToKey from '../src/helpers/pathToKey';
import normalize from '../src/helpers/normalize';
import reducer from '../src/reducers';
import store from '../src/store';
import * as ACTIONS from '../src/actions';
import debugThe from 'debug';

const debug = debugThe('usi:render');

const successActions = {
  photo: ACTIONS.PHOTO_SUCCESS,
  photos: ACTIONS.PHOTOS_SUCCESS,
  tags: ACTIONS.TAGS_SUCCESS,
  pages: ACTIONS.PAGES_SUCCESS
};

const template = ({context, body, state}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
        <meta name="apple-mobile-web-app-capable" content="yes">
      </head>
      <body><div id='container'>${body || ''}</div></body>
      ${state ? `<script>__INITIAL_STATE__=${JSON.stringify(state)}</script>` : ''}
      ${context ? `<script src="/${context.main}"></script>` : ''}
    </html>
  `.replace(/\n\s*/g, '');
};

const render = ({context, path, data, key}, done) => {
  // During dev this is called with only a context to just return an empty template
  if (path === undefined) return template({context});

  const location = createLocation(slash(path));
  const actionType = successActions[key];
  const pathKey = pathToKey(location.pathname);

  debug(`Router run ${location.pathname}`);
  debug(`Action type ${actionType}`);
  debug(`Path key ${pathKey}`);
  debug(`Has data ${!!data}`);

  // Use the raw reducer to make the initial data in the correct shape
  // expected by the redux on the client
  const state = data && key ? reducer(undefined, {
    type: actionType,
    key: pathKey,
    ...normalize({json: data, key})
  }) : {};

  match({routes, location}, (err, __, renderProps) => {
    if (err) return done(err);

    debug(`Router found match ${!!renderProps}`);

    // If we wanted to we could make this a completely static site with no JS
    // by using renderToStaticMarkup and not including any <script> tags
    done(null, template({
      context,
      state,
      body: React.renderToString(
        <Provider store={store(state)}>
          {() => <RoutingContext {...renderProps} />}
        </Provider>
      )
    }));
  });
};

export default render;
