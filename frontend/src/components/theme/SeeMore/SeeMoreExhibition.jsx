import React, { useEffect, useState, createRef } from 'react';
import { connect } from 'react-redux';
import { UniversalLink } from '@plone/volto/components';
import { Container } from 'semantic-ui-react';
import { searchContent } from '@plone/volto/actions';
import qs from 'query-string';
import { useIntl } from 'react-intl';
import { PreviewImage } from '@plone/volto/components';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
import { Link } from 'react-router-dom';
import './css/SeeMoreExhibition.less';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
// import FetchAuthor from './fetchAuthors';

function truncate(str, num) {
  if (str.length <= num) {
    return str;
  }

  const subString = str.substr(0, num);
  return subString.substr(0, subString.lastIndexOf(' ')) + ' ...';
}

const SocialButtons = () => {
  let location = useLocation();
  let currentPath = location.pathname;

  return (
    <div className="social-buttons">
      <div className="button facebook">
        <a
          onclick="return !window.open(this.href, 'Facebook', 'width=500,height=500')"
          className="share-btn-social"
          href={`https://www.facebook.com/sharer/sharer.php?u=${window?.location.href}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            id="Capa_1"
            x="0px"
            y="0px"
            viewBox="0 0 155.139 155.139"
            width="20"
            height="27"
          >
            <g>
              <path
                id="f_1_"
                d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184   c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452   v20.341H37.29v27.585h23.814v70.761H89.584z"
              ></path>
            </g>
          </svg>
        </a>
      </div>
      <div className="button twitter">
        <a
          onclick="return !window.open(this.href, 'Twitter', 'width=500,height=500')"
          className="share-btn-social"
          href={`http://twitter.com/share?text=${''}&url=${
            window?.location.href
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="27"
            viewBox="0 0 28 28"
          >
            <path d="M24.253 8.756C24.69 17.08 18.297 24.182 9.97 24.62c-3.122.162-6.22-.646-8.86-2.32 2.702.18 5.375-.648 7.507-2.32-2.072-.248-3.818-1.662-4.49-3.64.802.13 1.62.077 2.4-.154-2.482-.466-4.312-2.586-4.412-5.11.688.276 1.426.408 2.168.387-2.135-1.65-2.73-4.62-1.394-6.965C5.574 7.816 9.54 9.84 13.802 10.07c-.842-2.738.694-5.64 3.434-6.48 2.018-.624 4.212.043 5.546 1.682 1.186-.213 2.318-.662 3.33-1.317-.386 1.256-1.248 2.312-2.4 2.942 1.048-.106 2.07-.394 3.02-.85-.458 1.182-1.343 2.15-2.48 2.71z"></path>
          </svg>
        </a>
      </div>
      <div className="button mail">
        <a
          href={`mailto:?subject=Centraal Museum Utrecht&body=https://www.centraalmuseum.nl${currentPath}`}
          target="blank"
          rel="noopener noreferrer"
        >
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 1000 1000"
            enable-background="new 0 0 1000 1000"
            width="20"
            height="27"
          >
            <g>
              <path d="M990,220c0-12.3-3.5-23.7-9.1-33.8L637.2,512.5l345.4,298.2c4.6-9.3,7.4-19.6,7.4-30.7V220z M611.7,536.8l-74.9,71.1c-10.2,9.7-23.5,14.5-36.8,14.5c-13.3,0-26.7-4.8-36.8-14.5l-75.4-71.7L37.4,835.2C49.2,844.4,63.9,850,80,850h840c14.8,0,28.5-4.7,39.9-12.6L611.7,536.8L611.7,536.8z M487.3,582.6c6.9,6.5,18.5,6.5,25.4,0l444.2-421.8c-10.7-6.7-23.3-10.8-36.9-10.8H80c-13.4,0-25.7,3.9-36.3,10.4L487.3,582.6L487.3,582.6z M19.4,185.6C13.6,195.8,10,207.5,10,220v560c0,9.8,2,19.1,5.7,27.6L362.3,512L19.4,185.6L19.4,185.6z"></path>
            </g>
          </svg>
        </a>
      </div>
    </div>
  );
};

const Search = (props) => {
  const { content, searchContent, items } = props;
  const intl = useIntl();
  // const [totalItems, setTotalItems] = useState(0);
  const pathname = useSelector((state) => state.router.location.pathname);
  const pathnameArray = pathname.split('/');
  const currPath = pathnameArray[pathnameArray.length - 1];

  useEffect(() => {
    let isMounted = true;

    if (currPath === 'contents') {
      return;
    }

    const doSearch = () => {
      const currentPath = intl.locale === 'nl' ? '/nl/agenda' : '/en/agenda';
      const options = {
        portal_type: 'Event',
        path: currentPath,
        b_size: 10,
        metadata_fields: [
          'start',
          'end',
          'whole_day',
          'open_end',
          'effective',
          'created',
          'description',
          '@type',
        ],
        sort_on: 'getObjPositionInParent',
        // sort_order: 'descending',
      };
      searchContent('', options);
    };

    if (isMounted) {
      doSearch();
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchableText, content, searchContent, intl.locale]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const listingRef = createRef();

  const filteredEvents = updatedItems.filter((event) => {
    let today = new Date();
    const endDate = new Date(event.end);
    return endDate >= today;
  });

  return (
    <Container id="footer-listing-newsandblogs">
      <SocialButtons />
      <div id="page-search-title" className="page-search-title">
        <Link to="/nl/plan-je-bezoek/nu-te-zien/activiteiten">
          <h1 style={{ fontFamily: 'BonnefantenBlock, Arial, sans-serif' }}>
            Doe mee
          </h1>
        </Link>
        <div className="more-link">
          <Link to="/nl/plan-je-bezoek/nu-te-zien/activiteiten">Meer…</Link>
        </div>
      </div>
      <div className="search-items" style={{ display: 'flex' }}>
        {filteredEvents.slice(0, 3).map((item) => (
          <div className="SeeMoreItem" key={item['@id']} ref={listingRef}>
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
            <div className={`listing-dates-wrapper`}>
              <When
                start={item?.start}
                end={item?.end}
                whole_day={item?.whole_day}
                open_end={item?.open_end}
                type={item?.['@type']}
                published={
                  item?.effective !== '1969-12-30T22:00:00+00:00'
                    ? item?.effective
                    : item?.created
                }
              />
            </div>
            <UniversalLink item={item}>
              <div className="item_title">{item.title}</div>
            </UniversalLink>
            <div className="item_description">
              {truncate(item?.description, 100)}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
};

const mapStateToProps = (state, ownProps) => {
  const locationSearch = ownProps.location?.search || '';
  return {
    items: state.search.items,
    items_total: state.search.total,
    searchableText: qs.parse(locationSearch).SearchableText,
  };
};

export default connect(mapStateToProps, { searchContent })(Search);
