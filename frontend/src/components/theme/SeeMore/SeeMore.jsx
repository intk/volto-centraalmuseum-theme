import React, { useEffect } from 'react';
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
  const { content, searchContent } = props;
  const intl = useIntl();

  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchableText]);

  const sortedItems = props.items
    .slice(0, 20) // Assuming you still want to limit to 20 items
    .sort((a, b) => a.title.localeCompare(b.title)); // Sorting logic

  let authors = [];
  if (content['@type'] === 'author') {
    const authorTitle = content?.title;
    authors = [authorTitle];
  } else if (content['@type'] === 'artwork') {
    authors = content.authors?.map((author) => author?.title || []);
  }

  let authorQueryString = authors.length
    ? authors.map((author) => `"${author}"`).join('OR')
    : undefined;

  const doSearch = () => {
    const currentPath = intl.locale;
    const options = {
      portal_type: 'artwork',
      artwork_author: authorQueryString,
      path: currentPath,
      metadata_fields: ['ObjDateFromTxt'],
    };
    searchContent('', options);
  };
  const authors_text = authors.join(', ');

  const breakpointColumnsObj = {
    // default: 3,
    // 1200: 3,
    992: 2,
    768: 1,
  };

  let pathname = props.location.pathname;
  if (pathname.charAt(pathname.length - 1) === '/') {
    pathname = pathname.slice(0, -1);
  }

  return (
    <Container id="page-search-artwork">
      <div id="page-search-title" className="page-search-title">
        <h1>{intl.formatMessage(messages.seemore)}</h1>
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
              pathname !== item['@id'] && (
                <div className="SeeMoreItem" key={item['@id']}>
                  <ArtworkPreview {...item} />
                  <UniversalLink item={item}>
                    <div className="item_title">{item?.title}</div>
                  </UniversalLink>
                  <div className="description">
                    <p>
                      {authors_text && (
                        <span className="item-description">{authors_text}</span>
                      )}
                      {authors_text && item.ObjDateFromTxt && (
                        <span className="item-description">, </span>
                      )}
                      {item.ObjDateFromTxt && (
                        <span className="item-description">
                          {item.ObjDateFromTxt}
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
