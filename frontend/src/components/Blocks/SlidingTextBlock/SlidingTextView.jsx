import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';
import cx from 'classnames';
import BlockRenderer from './BlockRenderer';
import { withBlockExtensions } from '@plone/volto/helpers';
import config from '@plone/volto/registry';
import './css/slidingtextblock.less';
// eslint-disable-next-line no-unused-vars
import { getScaleUrl, getPath } from './utils';
import DefaultImageSVG from '@plone/volto/components/manage/Blocks/Listing/default-image.svg';
import { flattenToAppURL } from '@plone/volto/helpers';

const ViewGrid = (props) => {
  const { data, path, className } = props;
  const blocksConfig =
    config.blocks.blocksConfig.__grid.blocksConfig || props.blocksConfig;

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
      id="sliding-block-wrapper"
    >
      {data.headline && <h2 className="headline">{data.headline}</h2>}

      <Grid stackable stretched columns={data.columns.length}>
        {/* {console.log(
          `${flattenToAppURL(getScaleUrl(data.columns[0].url, 'great'))}`,
        )} */}
        <div
          className="background-image"
          style={{
            backgroundImage: `url(${
              flattenToAppURL(getScaleUrl(data.columns[0].url, 'great')) ||
              DefaultImageSVG
            })`,
          }}
          role="img"
        />
        <div
          className="shadow"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(46, 46, 46, 0) 0%, #242424 200%)',
            // zIndex: 1,
            height: '100%',
            width: '100vw',
            position: 'absolute',
          }}
        ></div>
        <div
          className="text-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            zIndex: 0,
          }}
        >
          {data.columns.map((column) => (
            <Grid.Column
              key={column.id}
              className={`grid-block-${column['@type']}`}
            >
              {column['@type'] === 'image' ? (
                <div id="photo-credit">
                  {/* <span>{column?.alt || ''}</span> */}
                  {column?.caption?.data ? (
                    <div
                      id="slidingtext-caption"
                      className=""
                      dangerouslySetInnerHTML={{ __html: column.caption.data }}
                    />
                  ) : (
                    ''
                  )}
                </div>
              ) : (
                <BlockRenderer
                  block={column.id}
                  id={column.id}
                  type={column['@type']}
                  data={column}
                  path={path}
                  blocksConfig={blocksConfig}
                />
              )}
            </Grid.Column>
          ))}
        </div>
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
