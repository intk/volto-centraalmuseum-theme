/**
 * NewsItemView view component.
 * @module components/theme/View/NewsItemView
 */

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Container as SemanticContainer, Image } from 'semantic-ui-react';
import {
  hasBlocksData,
  flattenToAppURL,
  flattenHTMLToAppURL,
} from '@plone/volto/helpers';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
import config from '@plone/volto/registry';
import { useIntl } from 'react-intl';
import { searchContent } from '@plone/volto/actions';
import { Link } from 'react-router-dom';

/**
 * NewsItemView view component class.
 * @function NewsItemView
 * @params {object} content Content object.
 * @returns {string} Markup of the component.
 */
const NewsItemView = ({ content }) => {
  const [blogWriter, setBlogWriter] = useState();
  const [tooltip, setTooltip] = useState({
    display: 'none',
    top: 0,
    left: 0,
  });
  const dispatch = useDispatch();
  const intl = useIntl();
  const Container =
    config.getComponent({ name: 'Container' }).component || SemanticContainer;

  useEffect(() => {
    const doSearch = () => {
      const currentPath = intl.locale; // Adjust the path as necessary
      const options = {
        portal_type: 'blogwriter',
        blogWriterID: content?.creators[0].toLowerCase(),
        path: currentPath,
        metadata_fields: ['title', 'description'],
      };

      dispatch(searchContent('', options))
        .then((response) => {
          if (response?.items?.length > 0) {
            setBlogWriter(response?.items[0]);
          } else {
            setBlogWriter([]);
          }
        })
        .catch((error) => {
          setBlogWriter([]);
        });
    };
    doSearch();
  }, [content, dispatch, intl]);

  const showTooltip = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      display: 'block',
      top: event.clientY - rect.top + 15,
      left: event.clientX - rect.left,
    });
  };

  const hideTooltip = () => {
    setTooltip({ display: 'none', top: 0, left: 0 });
  };

  return hasBlocksData(content) ? (
    <Container id="page-document" className="view-wrapper newsitem-view">
      {blogWriter && (
        <div
          className="blog-writer"
          onMouseOver={(e) => showTooltip(e)}
          onMouseMove={(e) => showTooltip(e)}
          onMouseOut={hideTooltip}
          onFocus={(e) => showTooltip(e)}
          onBlur={hideTooltip}
          key={blogWriter['@id']}
        >
          {blogWriter.image_field && (
            <div className="writer-image-wrapper">
              <Link to={flattenToAppURL(blogWriter?.['@id'])}>
                <img
                  src={`${blogWriter?.['@id']}/${blogWriter?.image_scales?.preview_image[0]?.download}`}
                  alt="writer"
                ></img>
              </Link>
            </div>
          )}
          <Link to={flattenToAppURL(blogWriter?.['@id'])}>
            <h1 className="writer-title">{blogWriter?.title}</h1>
          </Link>
          {blogWriter?.description && (
            <p className="writer-description">
              {blogWriter.description}{' '}
              <span
                className="writer-description-tooltip"
                style={{
                  display: tooltip.display,
                  position: 'absolute',
                  left: `${tooltip.left}px`,
                  top: `${tooltip.top}px`,
                  backgroundColor: '#282931',
                  opacity: '85%',
                  width: 'auto',
                  color: 'white',
                  padding: '5px',
                  lineHeight: '12px',
                  fontSize: '12px',
                  textWrap: 'nowrap',
                  // borderRadius: '5px',
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              >
                {blogWriter.description}
              </span>
            </p>
          )}
        </div>
      )}
      <RenderBlocks content={content} />
    </Container>
  ) : (
    <Container className="view-wrapper">
      {content.title && (
        <h1 className="documentFirstHeading">
          {content.title}
          {content.subtitle && ` - ${content.subtitle}`}
        </h1>
      )}
      {content.description && (
        <p className="documentDescription">{content.description}</p>
      )}
      {content.image && (
        <Image
          className="documentImage"
          alt={content.title}
          title={content.title}
          src={
            content.image['content-type'] === 'image/svg+xml'
              ? flattenToAppURL(content.image.download)
              : flattenToAppURL(content.image.scales.mini.download)
          }
          floated="right"
        />
      )}
      {content.text && (
        <div
          dangerouslySetInnerHTML={{
            __html: flattenHTMLToAppURL(content.text.data),
          }}
        />
      )}
    </Container>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
NewsItemView.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    text: PropTypes.shape({
      data: PropTypes.string,
    }),
  }).isRequired,
};

export default NewsItemView;
