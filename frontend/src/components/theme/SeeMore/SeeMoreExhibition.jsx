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
import SocialButtons from './SocialButtons';
// import { useLocation } from 'react-router-dom';
// import FetchAuthor from './fetchAuthors';

function truncate(str, num) {
  if (str.length <= num) {
    return str;
  }

  const subString = str.substr(0, num);
  return subString.substr(0, subString.lastIndexOf(' ')) + ' ...';
}

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
      {filteredEvents.length > 0 ? (
        <>
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
        </>
      ) : (
        ''
      )}
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
