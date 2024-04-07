import React, { useRef } from 'react';
import PropTypes from 'prop-types';
// import { ListingBlockHeader } from '@package/components';
import { UniversalLink } from '@plone/volto/components';
import ArtworkPreview from '../../theme/ArtworkPreview/ArtworkPreview';
// import { BodyClass } from '@plone/volto/helpers';
import ReactSwipe from 'react-swipe';
// import './less/CollectionSliderTemplate.less';
import { defineMessages, useIntl } from 'react-intl';
// import useInViewHomepage from '@package/helpers/useInViewHomepage';
// import { BodyClass } from '@plone/volto/helpers';

const messages = defineMessages({
  collectie_online: {
    id: 'collectie_online',
    defaultMessage: 'COLLECTIE ONLINE',
  },
  browse_collection: {
    id: 'browse_collection',
    defaultMessage: 'Blader door de collectie',
  },
});

const groupItemsByThree = (items) => {
  return items.reduce((acc, item, index) => {
    if (index % 3 === 0) acc.push([]);
    acc[acc.length - 1].push(item);
    return acc;
  }, []);
};

const Card = ({ item, showDescription = true }) => {
  return (
    <div className="plone-item-card">
      {/* <BodyClass className="masonary-listing-page" /> */}
      <UniversalLink href={item['@id']} className="plone-item-card-link">
        <div className="content">
          <ArtworkPreview {...item} />
          <div className="title-description">
            <h3 className="plone-item-title">
              <p>{item.title}</p>
            </h3>
            <div className="desctiption">
              <span className="item-description">
                {item.artwork_author &&
                  item.artwork_author.map((author, index) => (
                    <span key={author}>
                      {author}
                      {index + 1 !== item.artwork_author.length && ', '}
                    </span>
                  ))}
              </span>
              <span className="item-description">
                {item.ObjDateFromTxt && item.artwork_author.length > 0
                  ? ', '
                  : ''}
                {item.ObjDateFromTxt && item.ObjDateFromTxt}
              </span>
            </div>
          </div>
        </div>
      </UniversalLink>
    </div>
  );
};

const CollectionSliderTemplate = (props) => {
  const { items } = props;
  let reactSwipeEl;
  const intl = useIntl();
  const ref = useRef();
  // const titleInView = useInViewHomepage(ref);
  const itemsGrouped = groupItemsByThree(items);

  return (
    <div className="collection-slider-template">
      {/* {titleInView ? (
        <BodyClass className="collectionslide-in-view" />
      ) : (
        <BodyClass className="collectionslide-out-of-view" />
      )} */}
      <div className="collectie-header">
        <h3>
          <div>{intl.formatMessage(messages.collectie_online)}</div>
          <div>{intl.formatMessage(messages.browse_collection)}</div>
        </h3>
      </div>
      <div className="content-wrapper">
        <ReactSwipe
          className="collection-slider"
          swipeOptions={{ continuous: true }}
          ref={(el) => (reactSwipeEl = el)}
        >
          {itemsGrouped.map((group, i) => (
            <div key={i} className="slide">
              {group.map((item, index) => (
                <Card key={index} item={item} showDescription={true} />
              ))}
            </div>
          ))}
        </ReactSwipe>
        {items.length > 1 && (
          <div className="buttons">
            <button
              aria-label="left-arrow-button"
              className="left-button"
              onClick={() => {
                reactSwipeEl.prev();
              }}
            >
              <svg
                id="Layer_1"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                // width="50"
                // height="85"
                viewBox="0 0 50 85"
              >
                <path
                  d="M0,34.7584,0,42.5l0,7.7417L34.59,85H50V69.5158L23.1147,42.5,50,15.4843V0H34.59ZM36.5976,80.2423,6.6616,50.1609l.43-.0046,6.8586.071L43.74,80.1616Zm8.6675-8.71-.08,7.1768L16.1323,49.5163l3.6114-3.6288Zm0-58.0655L19.7437,39.1126l-3.6114-3.6288L45.1847,6.2905ZM43.74,4.8385,13.95,34.7728l-6.8586.071-.43-.0047L36.5976,4.7578Z"
                  fill="#cfb3e4"
                />
              </svg>
            </button>
            {/* <span className="paginator">
          <p>{`${currentIndex + 1}/${props.content?.items_total}`}</p>
        </span>{' '} */}
            <button
              aria-label="right-arrow-button"
              className="right-button"
              onClick={() => {
                reactSwipeEl.next();
              }}
              ref={ref}
            >
              <svg
                id="Layer_1"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                // width="50"
                // height="85"
                viewBox="0 0 50 85"
              >
                <title>Bonnefanten_Website_Assets</title>
                <path
                  d="M50,50.2417,50,42.5l0-7.7417L15.41,0H0V15.4842L26.8853,42.5,0,69.5158V85H15.41ZM13.4024,4.7577l29.936,30.0814-.43.0046-6.8587-.071L6.26,4.8385Zm-8.6675,8.71.08-7.1769L33.8677,35.4837l-3.6114,3.6288Zm0,58.0654L30.2563,45.8875l3.6114,3.6288L4.8152,78.71ZM6.26,80.1615,36.05,50.2273l6.8587-.071.43.0046L13.4024,80.2423Z"
                  fill="#cfb3e4"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

CollectionSliderTemplate.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default CollectionSliderTemplate;
