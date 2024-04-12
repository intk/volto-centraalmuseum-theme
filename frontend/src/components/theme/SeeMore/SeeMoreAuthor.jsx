import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { UniversalLink } from '@plone/volto/components';
import { Container } from 'semantic-ui-react';
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
  const { content, searchContent, items, location } = props;
  const intl = useIntl();

  const authors = useMemo(() => {
    if (content['@type'] === 'author') {
      return [content.title];
    } else if (content['@type'] === 'artwork') {
      return (
        content.authors?.map((author) => author.title.split('(')[0].trim()) ||
        []
      );
    }
    return [];
  }, [content]);

  const authorQueryString = useMemo(
    () => authors.map((author) => `"${author}"`).join(' || '),
    [authors],
  );

  useEffect(() => {
    const currentPath = intl.locale;
    const options = {
      portal_type: 'artwork',
      artwork_author: authorQueryString,
      path: currentPath,
      metadata_fields: ['dating'],
    };
    searchContent('', options);
  }, [searchContent, authorQueryString, intl.locale]);

  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 20);
  }, [items]);

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
          sortedItems.map(
            (item) =>
              location.pathname !== item['@id'] && (
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
