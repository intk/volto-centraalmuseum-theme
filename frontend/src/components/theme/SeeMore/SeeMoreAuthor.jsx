// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { UniversalLink } from '@plone/volto/components';
// eslint-disable-next-line no-unused-vars
import { Container, Button } from 'semantic-ui-react';
import { searchContent } from '@plone/volto/actions';
import qs from 'query-string';
import { defineMessages, useIntl } from 'react-intl';
import ArtworkPreview from '../ArtworkPreview/ArtworkPreview';
import Masonry from 'react-masonry-css';

const messages = defineMessages({
  seemore: {
    id: 'seemore',
    defaultMessage: 'Kijk verder',
  },
});

const Search = (props) => {
  // eslint-disable-next-line no-unused-vars
  const { content, searchContent, items } = props;
  const intl = useIntl();
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalItems, setTotalItems] = useState(0);
  let authors = [];

  let authorQueryString = authors.length
    ? authors.map((author) => `"${author}"`).join(' || ')
    : undefined;

  useEffect(() => {
    let isMounted = true;

    const doSearch = () => {
      const currentPath = intl.locale;
      const options = {
        portal_type: 'artwork',
        artwork_author: authorQueryString,
        path: currentPath,
        metadata_fields: ['dating'],
        b_size: 20,
        // b_start: (currentPage - 1) * 20,
      };
      searchContent('', options);
    };

    if (isMounted) {
      doSearch();
    }

    return () => {
      isMounted = false;
    };
  }, [
    props.searchableText,
    // currentPage,
    content,
    authorQueryString,
    intl,
    searchContent,
  ]);

  const sortedItems = props.items
    .slice(0, 20)
    .sort((a, b) => a.title.localeCompare(b.title));

  if (content['@type'] === 'author') {
    const authorTitle = content.title;
    authors = [authorTitle];
  } else if (content['@type'] === 'artwork') {
    authors =
      content.authors?.map((author) => author.title.split('(')[0].trim()) || [];
  }

  const authors_text = authors.join(', ');

  const breakpointColumnsObj = {
    default: 3,
    1200: 3,
    992: 2,
    768: 1,
  };

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
          sortedItems.slice(0, 20).map(
            (item) =>
              props.location.pathname !== item['@id'] && (
                <div className="SeeMoreItem" key={item['@id']}>
                  <ArtworkPreview {...item} />
                  <UniversalLink item={item}>
                    <div className="item_title">{item.title}</div>
                  </UniversalLink>
                  <div className="description">
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
                  </div>
                </div>
              ),
          )}
      </Masonry>
    </Container>
  );
};

const mapStateToProps = (state, ownProps) => {
  const locationSearch = ownProps.location?.search || '';
  return {
    items: state.search.items,
    searchableText: qs.parse(locationSearch).SearchableText,
  };
};

export default connect(mapStateToProps, { searchContent })(Search);
