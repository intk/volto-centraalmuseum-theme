/**
 * Search component.
 * @module components/theme/Search/Search
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { UniversalLink } from '@plone/volto/components';
import { asyncConnect } from '@plone/volto/helpers';
import { FormattedMessage } from 'react-intl';
import { Portal } from 'react-portal';
import { Container, Pagination, Button, Header } from 'semantic-ui-react';
import qs from 'query-string';
// import classNames from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';
import config from '@plone/volto/registry';
import { Helmet } from '@plone/volto/helpers';
import { searchContent } from '@plone/volto/actions';
// eslint-disable-next-line no-unused-vars
import { SearchTags, Toolbar, Icon } from '@plone/volto/components';
import { PreviewImage } from '@plone/volto/components';
import SearchBar from '@package/components/theme/Search/SearchBar';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';

import { HiMiniArrowLongLeft } from 'react-icons/hi2';
import { HiMiniArrowLongRight } from 'react-icons/hi2';

const messages = defineMessages({
  Search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
});

const translations = {
  searchresults: {
    en: 'Search results',
    nl: 'Zoekresultaten',
    de: 'Suchergebnisse',
  },
  results: {
    en: 'items matching your search terms.',
    nl: 'resultaten voor de zoekopdracht.',
    de: 'Artikel gefunden.',
  },
  for: {
    en: 'for',
    nl: 'voor',
    de: 'für',
  },
  advancedsearch: {
    en: 'Advanced search',
    nl: 'Geavanceerd zoeken',
  },
  filterArtworks: {
    en: 'Only in the collection',
    nl: 'Alleen in de collectie',
  },
  excludeArtworks: {
    en: 'Only in the website',
    nl: 'Alleen in de website',
  },
  hasImage: {
    nl: 'Alleen met beeld',
    en: 'Only Images',
  },
  onDisplay: {
    en: 'Now on view',
    nl: 'Nu te zien',
  },
  filterheading: {
    nl: 'Filter »',
    en: 'Filter »',
  },
};

function truncate(str, num) {
  if (str.length <= num) {
    return str;
  }

  const subString = str.substr(0, num);
  return subString.substr(0, subString.lastIndexOf(' ')) + ' ...';
}

// const test = withQuerystringResults(this.props);
// console.log(test);

/**
 * Search class.
 * @class SearchComponent
 * @extends Component
 */
class Search extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    searchContent: PropTypes.func.isRequired,
    searchableText: PropTypes.string,
    subject: PropTypes.string,
    path: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        '@id': PropTypes.string,
        '@type': PropTypes.string,
        title: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
    pathname: PropTypes.string.isRequired,
  };

  /**
   * Default properties.
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    items: [],
    searchableText: null,
    subject: null,
    path: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      isClient: false,
      active: 'relevance',
      updatedItems: [],
      onlyArtworks: false,
      excludeArtworks: false,
      objOnDisplay: false,
      hasPreviewImage: false,
      ObjOnDisplay: false,
      filtersDisplay: false,
    };
    this.isMountedFlag = false;
  }

  /**
   * Component did mount
   * @method componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    this.doSearch();
    this.setState({ isClient: true });
    this.isMountedFlag = true;
    this.fetchAllFallbackImages();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.pathname !== this.props.pathname ||
      prevProps.items !== this.props.items
    ) {
      this.fetchAllFallbackImages();
    }
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
  }

  fetchHasFallbackImage = async (item) => {
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

  fetchAllFallbackImages = async () => {
    const { items } = this.props;
    const promises = items.map((item) => this.fetchHasFallbackImage(item));
    const results = await Promise.all(promises);
    if (this.isMountedFlag) {
      this.setState({ updatedItems: results });
    }
  };

  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps = (nextProps) => {
    if (this.props.location.search !== nextProps.location.search) {
      this.doSearch();
    }
  };

  handleCheckboxChange = (checkboxType) => {
    const { history, location } = this.props;
    let currentUrlParams = new URLSearchParams(location.search);

    // Initialize updates based on checkboxType
    let updates = {};

    switch (checkboxType) {
      case 'onlyArtworks':
        updates = {
          onlyArtworks: !this.state.onlyArtworks,
          // Turn off excludeArtworks if onlyArtworks is being turned on
          excludeArtworks: this.state.onlyArtworks
            ? this.state.excludeArtworks
            : false,
        };
        break;
      case 'excludeArtworks':
        updates = {
          excludeArtworks: !this.state.excludeArtworks,
          // Turn off onlyArtworks if excludeArtworks is being turned on
          onlyArtworks: this.state.excludeArtworks
            ? this.state.onlyArtworks
            : false,
        };
        break;
      case 'hasPreviewImage':
        updates = { hasPreviewImage: !this.state.hasPreviewImage };
        break;
      case 'ObjOnDisplay':
        updates = { ObjOnDisplay: !this.state.ObjOnDisplay };
        break;
      default:
        break;
    }

    // Update state with the changes
    this.setState(updates, () => {
      // After state update, adjust URL parameters
      currentUrlParams.delete('portal_type');
      currentUrlParams.delete('portal_type:list');
      currentUrlParams.delete('hasPreviewImage');
      currentUrlParams.delete('ObjOnDisplay');

      if (this.state.onlyArtworks) {
        currentUrlParams.set('portal_type', 'artwork');
      }
      if (this.state.excludeArtworks) {
        const includeTypes = [
          'Document',
          'Event',
          'News Item',
          'author',
          'Link',
        ];
        includeTypes.forEach((type) =>
          currentUrlParams.append('portal_type:list', type),
        );
      }
      if (this.state.hasPreviewImage) {
        currentUrlParams.set('hasPreviewImage', 'true');
      }
      if (this.state.ObjOnDisplay) {
        currentUrlParams.set('ObjOnDisplay', 'true');
      }

      history.push(`${location.pathname}?${currentUrlParams.toString()}`);
      this.doSearch();
    });
  };

  /**
   * Search based on the given searchableText, subject and path.
   * @method doSearch
   * @param {string} searchableText The searchable text string
   * @param {string} subject The subject (tag)
   * @param {string} path The path to restrict the search to
   * @returns {undefined}
   */

  doSearch = () => {
    const options = qs.parse(this.props.history.location.search);
    if (this.state.onlyArtworks) {
      options.portal_type = 'artwork';
    } else if (this.state.excludeArtworks) {
      options.excludeArtworks = 'true';
    } else if (this.state.hasPreviewImage) {
      options.hasPreviewImage = 'true';
    } else if (this.state.ObjOnDisplay) {
      options.hasPreviewImage = 'true';
    } else {
      delete options.portal_type;
      delete options.excludeArtworks;
      delete options.hasPreviewImage;
    }
    this.setState({ currentPage: 1 });
    options['use_site_search_settings'] = 1;
    options['metadata_fields'] = ['start', 'end', 'whole_day', 'open_end'];
    this.props.searchContent('', options);
  };

  handleQueryPaginationChange = (e, { activePage }) => {
    const { settings } = config;
    window.scrollTo(0, 0);
    let options = qs.parse(this.props.history.location.search);
    options['use_site_search_settings'] = 1;

    this.setState({ currentPage: activePage }, () => {
      this.props.searchContent('', {
        ...options,
        b_start: (this.state.currentPage - 1) * settings.defaultPageSize,
      });
    });
  };

  onSortChange = (event, sort_order) => {
    let options = qs.parse(this.props.history.location.search);
    options.sort_on = event.target.name;
    options.sort_order = sort_order || 'ascending';
    if (event.target.name === 'relevance') {
      delete options.sort_on;
      delete options.sort_order;
    }
    let searchParams = qs.stringify(options);
    this.setState({ currentPage: 1, active: event.target.name }, () => {
      // eslint-disable-next-line no-restricted-globals
      this.props.history.replace({
        search: searchParams,
      });
    });
  };

  renderFilterButtons = () => {
    const { intl } = this.props;
    return (
      <>
        {/* <label>
          <input
            type="checkbox"
            checked={this.state.hasPreviewImage}
            onChange={() => this.handleCheckboxChange('hasPreviewImage')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.hasImage[intl.locale]}</span>
        </label> */}
        <label>
          <input
            type="radio"
            checked={this.state.onlyArtworks}
            onChange={() => this.handleCheckboxChange('onlyArtworks')}
            className="artwork-checkbox"
          />
          <span className="label">
            {translations.filterArtworks[intl.locale]}
          </span>
        </label>
        <label>
          <input
            type="radio"
            checked={this.state.excludeArtworks}
            onChange={() => this.handleCheckboxChange('excludeArtworks')}
            className="artwork-checkbox"
          />
          <span className="label">
            {translations.excludeArtworks[intl.locale]}
          </span>
        </label>

        {/* <label>
          <input
            type="checkbox"
            checked={this.state.ObjOnDisplay}
            onChange={() => this.handleCheckboxChange('ObjOnDisplay')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.onDisplay[intl.locale]}</span>
        </label> */}
      </>
    );
  };

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { settings } = config;
    const { intl } = this.props;

    return (
      <Container id="page-search">
        <Helmet title={this.props.intl.formatMessage(messages.Search)} />
        <div className="container">
          <article id="content">
            <header>
              <h1 className="documentFirstHeading">
                {/* {this.props.searchableText ? (
                  <FormattedMessage
                    id="Search results for {term}"
                    defaultMessage="Search results for {term}"
                    values={{
                      term: <q>{this.props.searchableText}</q>,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="Search results"
                    defaultMessage="Search results"
                  />
                )} */}
                {translations.searchresults[intl.locale]}{' '}
                {translations.for[intl.locale]} {this.props.searchableText}
              </h1>
              {/* <SearchTags /> */}
              <div className="search">
                <SearchBar />
              </div>
              <div id="filter-section" className="artwork-search-check button">
                <button
                  className="filter-button text-button btn-block"
                  onClick={() =>
                    this.setState({
                      filtersDisplay: !this.state.filtersDisplay,
                    })
                  }
                >
                  {translations.filterheading[intl.locale]}
                </button>
                {this.state.filtersDisplay && this.renderFilterButtons()}
              </div>
              {/* <div className="artwork-search-check heading">
                <h3 className="search-heading"> */}
              {/* {translations.filterheading[intl.locale]} */}
              {/* </h3>
                {this.renderFilterButtons()}
              </div> */}
              {this.props.search?.items_total > 0 ? (
                <>
                  <div className="items_total">
                    <strong>{this.props.search.items_total}</strong>
                    {/* <FormattedMessage
                      id="results found"
                      defaultMessage="results"
                    /> */}
                    {translations.results[intl.locale]}
                  </div>
                  {/* <Header>
                    <Header.Content className="header-content">
                      <div className="sort-by">
                        <FormattedMessage
                          id="Sort By:"
                          defaultMessage="Sort by:"
                        />
                      </div>
                      <Button
                        onClick={(event) => {
                          this.onSortChange(event);
                        }}
                        name="relevance"
                        size="tiny"
                        className={classNames('button-sort', {
                          'button-active': this.state.active === 'relevance',
                        })}
                      >
                        <FormattedMessage
                          id="Relevance"
                          defaultMessage="Relevance"
                        />
                      </Button>
                      <Button
                        onClick={(event) => {
                          this.onSortChange(event);
                        }}
                        name="sortable_title"
                        size="tiny"
                        className={classNames('button-sort', {
                          'button-active':
                            this.state.active === 'sortable_title',
                        })}
                      >
                        <FormattedMessage
                          id="Alphabetically"
                          defaultMessage="Alphabetically"
                        />
                      </Button>
                      <Button
                        onClick={(event) => {
                          this.onSortChange(event, 'reverse');
                        }}
                        name="effective"
                        size="tiny"
                        className={classNames('button-sort', {
                          'button-active': this.state.active === 'effective',
                        })}
                      >
                        <FormattedMessage
                          id="Date (newest first)"
                          defaultMessage="Date (newest first)"
                        />
                      </Button>
                    </Header.Content>
                  </Header> */}
                </>
              ) : (
                <div>
                  <FormattedMessage
                    id="No results found"
                    defaultMessage="No results found"
                  />
                </div>
              )}
            </header>
            <section id="content-core">
              <div className="artwork-search-check heading">
                <h3 className="search-heading">
                  {/* {translations.filterheading[intl.locale]} */}
                </h3>
                {this.renderFilterButtons()}
              </div>
              <div className="search-results-wrapper">
                {this.state.updatedItems?.map((item) => (
                  <article className="tileItem" key={item['@id']}>
                    {item.image_field ? (
                      <PreviewImage
                        item={item}
                        size="preview"
                        alt={
                          item.image_caption ? item.image_caption : item.title
                        }
                        className="ui image"
                      />
                    ) : item['@type'] === 'exhibition' &&
                      item.hasFallbackImage === true ? (
                      <PreviewImage
                        item={item}
                        size="large"
                        alt={
                          item.image_caption ? item.image_caption : item.title
                        }
                        className="ui image"
                        isFallback={true}
                      />
                    ) : (
                      <div className="image-placeholder"></div>
                    )}

                    <div className="search-text-wrapper">
                      <h2 className="tileHeadline">
                        <UniversalLink
                          item={item}
                          className="summary url"
                          title={item['@type']}
                        >
                          {item.title}
                        </UniversalLink>
                      </h2>
                      {item['@type'] === 'Event' ? (
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
                      {item.description && (
                        <div className="tileBody">
                          <span className="description">
                            {truncate(item.description, 155)}
                          </span>
                        </div>
                      )}
                      {/* <div className="tileFooter">
                      <UniversalLink item={item}>
                        <FormattedMessage
                          id="Read More…"
                          defaultMessage="Read More…"
                        />
                      </UniversalLink>
                    </div> */}
                      <div className="visualClear" />
                    </div>
                  </article>
                ))}

                {this.props.search?.batching && (
                  <div className="pagination-wrapper">
                    <Pagination
                      activePage={this.state.currentPage}
                      totalPages={Math.ceil(
                        this.props.search.items_total /
                          settings.defaultPageSize,
                      )}
                      onPageChange={this.handleQueryPaginationChange}
                      firstItem={null}
                      lastItem={null}
                      prevItem={{
                        content: <HiMiniArrowLongLeft />,
                        icon: true,
                        'aria-disabled': !this.props.search.batching.prev,
                        className: !this.props.search.batching.prev
                          ? 'disabled'
                          : null,
                      }}
                      nextItem={{
                        content: <HiMiniArrowLongRight />,
                        icon: true,
                        'aria-disabled': !this.props.search.batching.next,
                        className: !this.props.search.batching.next
                          ? 'disabled'
                          : null,
                      }}
                    />
                  </div>
                )}
              </div>
            </section>
          </article>
        </div>
        {this.state.isClient && (
          <Portal node={document.getElementById('toolbar')}>
            <Toolbar
              pathname={this.props.pathname}
              hideDefaultViewButtons
              inner={<span />}
            />
          </Portal>
        )}
      </Container>
    );
  }
}

export const __test__ = compose(
  injectIntl,
  connect(
    (state, props) => ({
      items: state.search.items,
      searchableText: qs.parse(props.history.location.search).SearchableText,
      pathname: props.history.location.pathname,
    }),
    { searchContent },
  ),
)(Search);

export default compose(
  injectIntl,
  connect(
    (state, props) => ({
      items: state.search.items,
      searchableText: qs.parse(props.history.location.search).SearchableText,
      pathname: props.location.pathname,
      currentLang: state.intl?.locale,
    }),
    { searchContent },
  ),
  asyncConnect([
    {
      key: 'search',
      promise: ({ location, store: { dispatch } }) =>
        dispatch(
          searchContent('', {
            ...qs.parse(location.search),
            use_site_search_settings: 1,
          }),
        ),
    },
  ]),
)(Search);
