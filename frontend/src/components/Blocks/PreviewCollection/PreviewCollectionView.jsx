import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';
import cx from 'classnames';
// import BlockRenderer from './BlockRenderer';
import { withBlockExtensions } from '@plone/volto/helpers';
// import config from '@plone/volto/registry';
import './css/previewimageblock.less';
import ImageAlbum from '../../theme/ImageAlbum/ImageAlbum';
import { flattenToAppURL } from '@plone/volto/helpers';
import { GET_CONTENT } from '@plone/volto/constants/ActionTypes';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

const messages = defineMessages({
  previewcollection: {
    id: 'previewcollection',
    defaultMessage: 'PRAKTISCHE INFORMATIE',
  },
});

const getContent = (url, subrequest) => {
  const query = { b_size: 1000000 };
  let qs = Object.keys(query)
    .map((key) => key + '=' + query[key])
    .join('&');
  return {
    type: GET_CONTENT,
    subrequest,
    request: {
      op: 'get',
      path: `${url}${qs ? `?${qs}` : ''}`,
    },
  };
};

const ViewGrid = (props) => {
  // eslint-disable-next-line no-unused-vars
  const { data, path, className } = props;
  const [albumItems, setAlbumItems] = useState([]);
  const dispatch = useDispatch();
  const location = useLocation();

  let slideshowPath =
    data?.sliderelementslink?.[0] !== undefined
      ? flattenToAppURL(data.sliderelementslink[0]['@id'])
      : `${location.pathname}/slideshow`;

  const id = `full-items@${slideshowPath}`;

  useEffect(() => {
    const action = getContent(slideshowPath, id);
    dispatch(action).then((content) => {
      setAlbumItems(content.items || []);
    });
  }, [dispatch, id, slideshowPath]);

  // const blocksConfig =
  //   config.blocks.blocksConfig.__grid.blocksConfig || props.blocksConfig;

  const intl = useIntl();

  // let sliderelementstitle =
  //   data.sliderelementslink[0] !== undefined
  //     ? data.sliderelementlink[0]['title']
  //     : '';
  // let sliderelementsdescription =
  //   data.sliderelementslink[0] !== undefined
  //     ? data.sliderelementlink[0]['Description']
  //     : '';

  return (
    <div
      className={cx(
        'block __grid',
        {
          [data['@type']]: data['@type'] !== '__grid',
          centered: data.align === 'center' || data.align === undefined,
          'space-between': data.align === 'space-between',
          'centered-text': data.centeredText,
          one: data?.columns?.length === 1,
          two: data?.columns?.length === 2,
          three: data?.columns?.length === 3,
          four: data?.columns?.length === 4,
        },
        className,
      )}
      id="quote-block-wrapper"
    >
      {data.headline && <h2 className="headline">{data.headline}</h2>}

      <Grid stackable stretched columns={data.columns.length}>
        {data.columns.map((column) => (
          <Grid.Column
            key={column.id}
            className={`grid-block-${column['@type']}`}
          >
            {column['@type'] === 'text' && (
              <div>
                <h4 id="preview-collection-headline">
                  {' '}
                  {intl.formatMessage(messages.previewcollection)}
                </h4>
                <h2 id="preview-collection-item-title">
                  {props.content?.title}
                </h2>{' '}
                <p id="preview-collection-item-description">
                  {props.content?.description}
                </p>
              </div>
            )}
            {column['@type'] === 'text' && (
              <div className="preview-collection-block-button">
                <ImageAlbum
                  // items={props.content?.items}
                  items={
                    slideshowPath !== '' ? albumItems : props.content?.items
                  }
                  itemTitle={props.content?.objectTitle}
                  image="false"
                  buttonname="Preview"
                  // sliderelementlink={albumItems}
                />
              </div>
            )}
            {column['@type'] === 'image' && (
              <ImageAlbum
                // items={props.content?.items}
                items={slideshowPath !== '' ? albumItems : props.content?.items}
                itemTitle={props.content?.objectTitle}
                image="true"
              />
            )}
          </Grid.Column>
        ))}
      </Grid>
    </div>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
ViewGrid.propTypes = {
  data: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default withBlockExtensions(ViewGrid);
