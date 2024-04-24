/**
 * Routes.
 * @module routes
 */

import { defaultRoutes } from '@plone/volto/routes';
import config from '@plone/volto/registry';
import ImageViewFullscreen from '@package/components/theme/ImageViewFullscreen/ImageViewFullscreen';
// import { Search } from '@plone/volto/components';

/**
 * Routes array.
 * @array
 * @returns {array} Routes.
 */
const routes = [
  {
    path: '/',
    component: config.getComponent('App').component,
    routes: [
      {
        path: '/*.(jpg|jpeg|tif)/image_view_fullscreen',
        // path: '/**/image_view_fullscreen',
        component: ImageViewFullscreen,
      },
      // Add your routes here
      ...(config.addonRoutes || []),
      ...defaultRoutes,
    ],
  },
];
// routes[0].routes = routes[0].routes
// .filter((r) => r.path !== '/search')
// .filter((r) => r.path !== '/(nl|en|de)/search');

export default routes;
