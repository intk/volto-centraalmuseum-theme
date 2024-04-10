import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { UniversalLink } from '@plone/volto/components';
import { defineMessages, useIntl } from 'react-intl';
import './less/TeaserListingTemplate.less';
import { PreviewImage } from '@plone/volto/components';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
import { useDispatch } from 'react-redux';
import { GET_CONTENT } from '@plone/volto/constants/ActionTypes';
import { isCmsUi } from '@plone/volto/helpers';
import ImageAlbum from './ListingImageAlbum/ImageAlbum';

const messages = defineMessages({
  moreInfo: {
    id: 'moreInfo',
    defaultMessage: 'More info',
  },
});

const Card = ({ item, index, showDescription = true }) => {
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

  const pathname = item['@id'];

  const slideshowPath = `${pathname}/slideshow`;
  const id = `full-items@${slideshowPath}`;

  const dispatch = useDispatch();
  const cmsView = isCmsUi(pathname);

  const [albumItems, setAlbumItems] = useState([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(
          `/++api++/${pathname}/@@has_fallback_image`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.hasFallbackImage) {
          try {
            const action = getContent(slideshowPath, id);
            const contentActionResponse = await dispatch(action);
            const content = await contentActionResponse;

            if (content && content.items) {
              setAlbumItems(content.items);
            } else {
              setAlbumItems([]);
            }
          } catch (error) {
            setAlbumItems([]);
          }
        } else {
          setAlbumItems([]);
        }
      } catch (error) {}
    };
    if (item?.['@type'] === 'exhibition' && !cmsView) {
      fetchContent();
    }
  }, [dispatch, id, slideshowPath, pathname, item, cmsView]);

  const intl = useIntl();
  return (
    <div className="plone-item-card">
      {/* <BodyClass className="masonary-listing-page" /> */}
      <div className="plone-item-card-link">
        <div className="content">
          <div
            className={`image-description-wrapper ${
              index % 2 === 1 ? 'odd' : 'even'
            }`}
          >
            {item.image_field ? (
              <UniversalLink item={item} className="image-link">
                <PreviewImage
                  item={item}
                  size="large"
                  alt={item.image_caption ? item.image_caption : item.title}
                  className="ui image"
                />
              </UniversalLink>
            ) : (item['@type'] === 'exhibition' || item['@type'] === 'Event') &&
              item.hasFallbackImage === true ? (
              <div className="image-link">
                {albumItems.length > 1 && (
                  <ImageAlbum
                    items={albumItems}
                    image="false"
                    className="ui image"
                  />
                )}
              </div>
            ) : null}
            <div
              id="jaarverslag-title"
              className={`item-title ${
                item.review_state === 'private' ? 'private' : ''
              }`}
            >
              {item['@type'] === 'Event' || item['@type'] === 'exhibition' ? (
                <div className="listing-dates">
                  <div className={`listing-dates-wrapper`}>
                    <When
                      start={item.start}
                      end={item.end}
                      whole_day={item.whole_day}
                      open_end={item.open_end}
                    />
                  </div>
                </div>
              ) : null}
              <h2>
                <UniversalLink item={item}>{item.title}</UniversalLink>
              </h2>
              {item['@type'] !== 'artwork' && item.description ? (
                <p>{item.description}</p>
              ) : null}
              {/* <div className="description">
                <p>
                  {item.artwork_author && (
                    <span className="item-description">
                      {item.artwork_author[0]}
                    </span>
                  )}
                  {item.artwork_author &&
                    item.artwork_author.length > 0 &&
                    item.dating && <span className="item-description">, </span>}
                  {item.dating && (
                    <span className="item-description">
                      {String(item.dating.split('(')[0])}
                    </span>
                  )}
                </p>
              </div> */}
              <UniversalLink item={item}>
                <button className="showmore-button">
                  {intl.formatMessage(messages.moreInfo)}
                </button>
              </UniversalLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeaserListingTemplate = (props) => {
  const { items } = props;
  const pathname = useSelector((state) => state.router.location.pathname);
  const [updatedItems, setUpdatedItems] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchHasFallbackImage = async (item) => {
      try {
        const response = await fetch(
          `/++api++/${item['@id']}/@@has_fallback_image`,
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return { ...item, hasFallbackImage: data.hasFallbackImage };
      } catch (error) {
        return { ...item, hasFallbackImage: false };
      }
    };

    const fetchAllFallbackImages = async () => {
      const promises = items.map((item) => fetchHasFallbackImage(item));
      const results = await Promise.all(promises);
      if (isMounted) {
        setUpdatedItems(results);
      }
    };

    fetchAllFallbackImages();

    return () => {
      isMounted = false;
    };
  }, [pathname, items]);

  return (
    <div className="collection-slider-template">
      <div className="collectie-header">
        <div>
          {/* <p className="collectie_online">
            {props?.headline}
          </p> */}
          <UniversalLink
            className="browse_collection"
            href={props?.linkHref?.[0]?.['@id']}
          >
            {/* {intl.formatMessage(messages.browse_collection)} */}
            {props?.linkTitle}
          </UniversalLink>
        </div>
      </div>
      <div className="content-wrapper">
        {updatedItems.map((item, index) => (
          <Card key={index} item={item} showDescription={true} index={index} />
        ))}
      </div>
    </div>
  );
};

TeaserListingTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default TeaserListingTemplate;
