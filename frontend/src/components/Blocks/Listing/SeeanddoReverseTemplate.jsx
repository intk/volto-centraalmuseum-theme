import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { flattenToAppURL } from '@plone/volto/helpers';
import { PreviewImage } from '@plone/volto/components';
import { UniversalLink } from '@plone/volto/components';
// import { isInternalURL } from '@plone/volto/helpers/Url/Url';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
// import { useSelector } from 'react-redux';
import { searchContent } from '@plone/volto/actions';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

const SeeanddoReverseTemplate = ({
  items,
  linkTitle,
  linkHref,
  isEditMode,
  headline,
}) => {
  const [updatedItems, setUpdatedItems] = useState([]);
  const dispatch = useDispatch();
  const intl = useIntl();

  useEffect(() => {
    const fetchAllData = async () => {
      const promises = items.map(async (item) => {
        const fallbackImageResult = await fetchHasFallbackImage(item);
        const blogWriterData = await fetchBlogWriterData(item);
        return {
          ...item,
          ...fallbackImageResult,
          blogWriter: blogWriterData,
        };
      });

      const results = await Promise.all(promises);
      setUpdatedItems(results);
    };

    const fetchHasFallbackImage = async (item) => {
      try {
        const response = await fetch(
          `/++api++/${item['@id']}/@@has_fallback_image`,
        );
        const data = await response.json();
        return { hasFallbackImage: data.hasFallbackImage };
      } catch (error) {
        return { hasFallbackImage: false };
      }
    };

    const fetchBlogWriterData = async (item) => {
      const options = {
        portal_type: 'blogwriter',
        blogWriterID: item?.Creator?.toLowerCase(),
        metadata_fields: ['title', 'description'],
      };

      try {
        const response = await dispatch(searchContent('', options));
        return response.items || [];
      } catch (error) {
        return [];
      }
    };

    fetchAllData();
  }, [items, dispatch, intl]);

  return (
    <>
      <div id="page-listing">
        <section id="content-core">
          {updatedItems.map((item) => (
            <div key={item.url} className="SeeMoreItem">
              {item.image_field ? (
                <UniversalLink item={item}>
                  <PreviewImage
                    item={item}
                    size="large"
                    alt={item.image_caption ? item.image_caption : item.title}
                    className="ui image"
                  />
                </UniversalLink>
              ) : (item['@type'] === 'exhibition' ||
                  item['@type'] === 'Event' ||
                  item['@type'] === 'News Item') &&
                item.hasFallbackImage === true ? (
                <UniversalLink item={item}>
                  <PreviewImage
                    item={item}
                    size="large"
                    alt={item.image_caption ? item.image_caption : item.title}
                    className="ui image"
                    isFallback={true}
                  />
                </UniversalLink>
              ) : null}
              <div
                className={`${
                  item.review_state === 'private' ? 'private' : ''
                }`}
              >
                {item['@type'] === 'Event' ||
                item['@type'] === 'Exhibition' ||
                item['@type'] === 'News Item' ? (
                  <div className="listing-dates">
                    <div className={`listing-dates-wrapper`}>
                      <When
                        start={item?.start}
                        end={item?.end}
                        whole_day={item?.whole_day}
                        open_end={item?.open_end}
                        type={item?.['@type']}
                        published={item?.effective || item?.created}
                      />
                    </div>
                  </div>
                ) : null}

                <div id="item_title" className="item_title">
                  <UniversalLink item={item}>{item.title}</UniversalLink>
                </div>
                <div className="item_description">
                  {item['@type'] !== 'artwork'
                    ? item.description && <p>{item.description}</p>
                    : ''}
                </div>
                <div className="description">
                  <p>
                    {item.artwork_author && (
                      <span className="item-description">
                        {item.artwork_author[0]}
                      </span>
                    )}
                    {item.artwork_author &&
                      item.artwork_author.length > 0 &&
                      item.dating &&
                      item.dating.split('(')[0] !== '' && (
                        <span className="item-description">, </span>
                      )}
                    {item.dating && (
                      <span className="item-description">
                        {String(item.dating.split('(')[0])}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>
        <div id="page-search-title" className="page-search-title">
          <Link to={linkHref?.[0] && flattenToAppURL(linkHref[0]['@id'])}>
            <h1 style={{ fontFamily: 'BonnefantenBlock, Arial, sans-serif' }}>
              {headline}
            </h1>
          </Link>
          <div className="more-link">
            <Link to={linkHref?.[0] && flattenToAppURL(linkHref[0]['@id'])}>
              Meer...
            </Link>
          </div>
        </div>
      </div>

      {/* {link && <div className="footer">{link}</div>} */}
    </>
  );
};

SeeanddoReverseTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  linkMore: PropTypes.any,
  isEditMode: PropTypes.bool,
};

export default SeeanddoReverseTemplate;
