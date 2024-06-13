// import config from '@plone/volto/registry';
import config from '@plone/volto/registry';
import { flattenToAppURL } from '@plone/volto/helpers';

export function getAllowedBlocks(type) {
  return ['image', 'text'];
}

export const getPath = (url = '') =>
  (url || '').startsWith('http') ? new URL(url).pathname : url;

export const getScaleUrl = (url, size) =>
  (url || '').includes(config.settings.apiPath)
    ? `${flattenToAppURL(url?.replace('/api', ''))}/@@images/image/${size}`
    : `${url?.replace('/api', '')}/@@images/image/${size}`;
