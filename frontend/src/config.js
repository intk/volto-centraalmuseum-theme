/**
 * Add your config changes here.
 * @module config
 * @example
 * export default function applyConfig(config) {
 *   config.settings = {
 *     ...config.settings,
 *     port: 4300,
 *     listBlockTypes: {
 *       ...config.settings.listBlockTypes,
 *       'my-list-item',
 *    }
 * }
 */

// All your imports required for the config here BEFORE this line
import '@plone/volto/config';
import { getContent } from '@plone/volto/actions';
import installFooter from './footer';
import installBlocks from './components/Blocks';
import { BlockButton } from '@plone/volto-slate/editor/ui';
import tiny from '@plone/volto/icons/tiny.svg';
import ArtworkView from './components/theme/View/ArtworkView';
import AuthorView from './components/theme/View/AuthorView';
import BlogWriterView from './components/theme/View/BlogWriterView';
import ExhibitionView from './components/theme/View/ExhibitionView';
import installExpressMiddleware from './express-middleware';

export default function applyConfig(config) {
  const DEFAULT_LANG = 'nl';

  config.settings = {
    ...config.settings,
    isMultilingual: true,
    supportedLanguages: ['nl', 'en'],
    defaultLanguage: DEFAULT_LANG,
  };

  config.settings.navDepth = 2;
  config.settings.siteDataPageId = 'footer';

  config.blocks.initialBlocks = {
    ...config.blocks.initialBlocks,
    Document: ['title', 'description'],
    Event: ['title', 'description'],
    'News Item': ['title', 'description'],
  };
  config.blocks.initialBlocksFocus = {
    ...config.blocks.initialBlocksFocus,
    Document: 'title',
    Event: 'title',
    'News Item': 'title',
  };
  config.blocks.groupBlocksOrder.push({
    id: 'Storytelling',
    title: 'Storytelling',
  });
  config.blocks.groupBlocksOrder.push({
    id: 'Site',
    title: 'Site',
  });
  config.blocks.groupBlocksOrder.push({
    id: 'Homepage',
    title: 'Homepage',
  });

  delete config.views.layoutViews.document_view;
  config.views.layoutViewsNamesMapping = {
    ...config.views.layoutViewsNamesMapping,
    artwork_view: 'Artwork',
  };
  config.views.contentTypesViews = {
    ...config.views.contentTypesViews,
    author: AuthorView,
  };
  config.views.contentTypesViews = {
    ...config.views.contentTypesViews,
    blogwriter: BlogWriterView,
  };
  config.views.contentTypesViews = {
    ...config.views.contentTypesViews,
    artwork: ArtworkView,
  };
  config.views.contentTypesViews = {
    ...config.views.contentTypesViews,
    exhibition: ExhibitionView,
  };

  config.settings.nonContentRoutes = [
    ...config.settings.nonContentRoutes.filter((p) => p !== '/search'),
  ];

  config.settings.slate.toolbarButtons = [
    'bold',
    'italic',
    'strikethrough',
    'link',
    'separator',
    'heading-two',
    'heading-three',
    'separator',
    'sub',
    'sup',
    'separator',
    'numbered-list',
    'bulleted-list',
    'blockquote',
    'styleMenu',
    'callout',
  ];

  const { slate } = config.settings;

  // Override the callout button
  slate.buttons['callout'] = (props) => (
    <BlockButton
      format="callout"
      icon={tiny}
      title="Discreet" // Use the custom title
      {...props}
    />
  );

  config.settings.cookiebotDomainGroupId =
    '40f8dd17-1467-4561-ac52-9b51ccb0a719';

  config.settings.asyncPropsExtenders = [
    ...config.settings.asyncPropsExtenders,
    {
      path: '/',
      key: 'footer',
      extend: (dispatchActions) => {
        const action = {
          key: 'footer',
          promise: ({ location, store }) => {
            // const currentLang = state.intl.locale;
            const bits = location.pathname.split('/');
            const currentLang =
              bits.length >= 2 ? bits[1] || DEFAULT_LANG : DEFAULT_LANG;

            const state = store.getState();
            if (state.content.subrequests?.[`footer-${currentLang}`]?.data) {
              return;
            }

            const siteDataPageId = config.settings.siteDataPageId;
            const url = `/${currentLang}/${siteDataPageId}`;
            const action = getContent(url, null, `footer-${currentLang}`);
            return store.dispatch(action).catch((e) => {
              // eslint-disable-next-line
              // console.log(
              //   `Footer links folder not found: ${url}. Please create as page
              //   named ${siteDataPageId} in the root of your current language and
              //   fill it with the appropriate action blocks`,
              // );
            });
          },
        };
        return [...dispatchActions, action];
      },
    },
  ];

  return installExpressMiddleware(installFooter(installBlocks(config)));
}
