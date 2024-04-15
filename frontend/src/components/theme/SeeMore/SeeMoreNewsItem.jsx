import React, { useEffect, useState, createRef } from 'react';
import { connect } from 'react-redux';
import { UniversalLink } from '@plone/volto/components';
import { Container } from 'semantic-ui-react';
import { searchContent } from '@plone/volto/actions';
import qs from 'query-string';
import { defineMessages, useIntl } from 'react-intl';
import { PreviewImage } from '@plone/volto/components';
import Masonry from 'react-masonry-css';
import { useSelector } from 'react-redux';
import { HiMiniArrowLongLeft } from 'react-icons/hi2';
import { HiMiniArrowLongRight } from 'react-icons/hi2';
import { Pagination } from 'semantic-ui-react';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';

const messages = defineMessages({
  seemore: {
    id: 'seemore',
    defaultMessage: 'Kijk verder',
  },
});

const Search = (props) => {
  const { content, searchContent, items, items_total } = props;
  const intl = useIntl();
  const [currentPage, setCurrentPage] = useState(1);
  // const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const doSearch = () => {
      const currentPath = intl.locale;
      const options = {
        portal_type: 'News Item',
        Creator: content?.blogWriterID || content?.title?.toLowerCase(),
        path: currentPath,
        metadata_fields: ['effective', 'created'],
        b_size: 2,
        b_start: (currentPage - 1) * 2,
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
  }, [props.searchableText, currentPage, content, searchContent, intl.locale]);

  const sortedItems = props.items
    .slice(0, 20)
    .sort((a, b) => a.title.localeCompare(b.title));

  let authors = [];
  if (content['@type'] === 'blogwriter') {
    const authorTitle = content.title;
    authors = [authorTitle];
  } else if (content['@type'] === 'News Item') {
    authors =
      content.authors?.map((author) => author.title.split('(')[0].trim()) || [];
  }

  // const authors_text = authors.join(', ');
  const totalPages = Math.ceil(items_total / 2);

  const breakpointColumnsObj = {
    default: 3,
    1200: 3,
    992: 2,
    768: 1,
  };

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
  }, [pathname, items]);

  const listingRef = createRef();

  return (
    <Container id="page-search-artwork">
      <div id="page-search-title" className="page-search-title">
        <h1 style={{ fontFamily: 'BonnefantenBlock, Arial, sans-serif' }}>
          {intl.formatMessage(messages.seemore)}
        </h1>
      </div>

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="search-items"
        columnClassName="masonry-grid_column"
        style={{ display: 'flex' }}
      >
        {authors.length !== 0 &&
          updatedItems.slice(0, 20).map(
            (item) =>
              props.location.pathname !== item['@id'] && (
                <div className="SeeMoreItem" key={item['@id']} ref={listingRef}>
                  {item.image_field ? (
                    <UniversalLink item={item}>
                      <PreviewImage
                        item={item}
                        size="large"
                        alt={
                          item.image_caption ? item.image_caption : item.title
                        }
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
                        alt={
                          item.image_caption ? item.image_caption : item.title
                        }
                        className="ui image"
                        isFallback={true}
                      />
                    </UniversalLink>
                  ) : null}
                  <UniversalLink item={item}>
                    <div className="item_title">{item.title}</div>
                  </UniversalLink>
                  {/* <div className="description">
                    <p>
                      {authors_text && (
                        <span className="item-description">{authors_text}</span>
                      )}
                      {authors_text && item.dating && (
                        <span className="item-description">, </span>
                      )}
                      {item.dating && (
                        <span className="item-description">
                          {String(item.dating.split('(')[0])}
                        </span>
                      )}
                    </p>
                  </div> */}
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
              ),
          )}
      </Masonry>
      {/* <div
        style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}
      >
        <Button
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span style={{ margin: '0 10px' }}>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div> */}
      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <Pagination
            activePage={currentPage}
            totalPages={totalPages}
            onPageChange={(e, { activePage }) => {
              listingRef.current.scrollIntoView({ behavior: 'smooth' });
              setCurrentPage(activePage);
            }}
            firstItem={null}
            lastItem={null}
            prevItem={{
              content: <HiMiniArrowLongLeft />,
              icon: true,
              'aria-disabled': currentPage === 1,
              className: currentPage === 1 ? 'disabled' : null,
            }}
            nextItem={{
              content: <HiMiniArrowLongRight />,
              icon: true,
              'aria-disabled': currentPage === totalPages,
              className: currentPage === totalPages ? 'disabled' : null,
            }}
          />
        </div>
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
