/**
 * Routes.
 * @module routes
 */

import { defaultRoutes } from '@plone/volto/routes';
import config from '@plone/volto/registry';

/**
 * Routes array.
 * @array
 * @returns {array} Routes.
 */
const routes = [
  {
    path: '/',
    component: config.getComponent('App').component, // Change this if you want a different component
    routes: [
      // Add your routes here
      ...(config.addonRoutes || []),
      ...defaultRoutes,
    ],
  },
];
routes[0].routes = routes[0].routes
  .filter((r) => r.path !== '/search')
  .filter((r) => r.path !== '/(nl|en|de)/search');

export default routes;
