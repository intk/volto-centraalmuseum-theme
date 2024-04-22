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
import './css/SeeMoreNewsBlogs.less';

const Search = (props) => {
  const { content, searchContent, items } = props;
  const intl = useIntl();
  // const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const doSearch = () => {
      const currentPath =
        intl.locale === 'nl'
          ? '/nl/over-het-museum/nieuws-en-pers/kort-nieuws-en-blogs'
          : '/en';
      const options = {
        portal_type: 'News Item',
        path: currentPath,
        b_size: 3,
        metadata_fields: ['effective', 'created'],
        sort_on: 'getObjPositionInParent',
        sort_order: 'ascending',
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

  const sortedItems = props.items
    .slice(0, 20)
    .sort((a, b) => a.title.localeCompare(b.title));

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
      const promises = sortedItems.map((item) => fetchHasFallbackImage(item));
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

  return (
    <Container id="footer-listing-newsandblogs">
      <div id="page-search-title" className="page-search-title">
        <h1 style={{ fontFamily: 'BonnefantenBlock, Arial, sans-serif' }}>
          Nieuws & blogs
        </h1>
        <Link to="/nl">Meer...</Link>
      </div>

      <div className="search-items" style={{ display: 'flex' }}>
        {updatedItems.slice(0, 20).map((item) => (
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
            <UniversalLink item={item}>
              <div className="item_title">{item.title}</div>
            </UniversalLink>
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
