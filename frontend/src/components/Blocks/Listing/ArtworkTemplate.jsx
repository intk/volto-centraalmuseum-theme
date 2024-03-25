import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { flattenToAppURL } from '@plone/volto/helpers';
import { PreviewImage } from '@plone/volto/components';
import { ConditionalLink, UniversalLink } from '@plone/volto/components';
import { isInternalURL } from '@plone/volto/helpers/Url/Url';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
import { BodyClass } from '@plone/volto/helpers';
import Masonry from 'react-masonry-css';
import { useSelector } from 'react-redux';

const ArtworkTemplate = ({ items, linkTitle, linkHref, isEditMode }) => {
  let link = null;
  let href = linkHref?.[0]?.['@id'] || '';

  if (isInternalURL(href)) {
    link = (
      <ConditionalLink to={flattenToAppURL(href)} condition={!isEditMode}>
        {linkTitle || href}
      </ConditionalLink>
    );
  } else if (href) {
    link = <UniversalLink href={href}>{linkTitle || href}</UniversalLink>;
  }
  const breakpointColumnsObj = {
    default: 3,
    1200: 3,
    992: 2,
    768: 1,
  };

  const pathname = useSelector((state) => state.router.location.pathname);
  const [updatedItems, setUpdatedItems] = useState([]);

  useEffect(() => {
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
      setUpdatedItems(results);
    };
    fetchAllFallbackImages();
  }, [pathname, items]);

  return (
    <>
      <BodyClass className="artwork-listing-page" />
      <div id="page-listing">
        <section id="content-core">
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="search-items"
            columnClassName="masonry-grid_column"
            style={{ display: 'flex' }}
          >
            {updatedItems.map((item, index) => (
              <>
                <div key={item.url} className="listing-items">
                  {item.image_field ? (
                    <UniversalLink item={item}>
                      <PreviewImage
                        item={item}
                        size="preview"
                        alt={
                          item.image_caption ? item.image_caption : item.title
                        }
                        className="ui image"
                      />
                    </UniversalLink>
                  ) : (
                    item['@type'] === 'exhibition' &&
                    item.hasFallbackImage === true && (
                      <UniversalLink item={item}>
                        <PreviewImage
                          item={item}
                          size="preview"
                          alt={
                            item.image_caption ? item.image_caption : item.title
                          }
                          className="ui image"
                          isFallback={item.hasImage === true}
                        />
                      </UniversalLink>
                    )
                  )}
                  <div
                    id="jaarverslag-title"
                    className={`item-title ${
                      item.review_state === 'private' ? 'private' : ''
                    }`}
                  >
                    {item['@type'] === 'Event' ||
                    item['@type'] === 'Exhibition' ? (
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
                    ) : (
                      ''
                    )}
                    <h2>
                      <UniversalLink item={item}>{item.title}</UniversalLink>
                    </h2>
                    {item['@type'] !== 'artwork'
                      ? item.description && <p>{item.description}</p>
                      : ''}
                    <div className="description">
                      <p>
                        {item.artwork_author && (
                          <span className="item-description">
                            {item.artwork_author[0]}
                          </span>
                        )}
                        {item.artwork_author && item.dating && (
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
              </>
            ))}
          </Masonry>
        </section>
      </div>

      {link && <div className="footer">{link}</div>}
    </>
  );
};

ArtworkTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  linkMore: PropTypes.any,
  isEditMode: PropTypes.bool,
};

export default ArtworkTemplate;
