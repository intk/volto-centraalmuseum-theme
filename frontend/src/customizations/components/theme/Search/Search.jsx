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
// eslint-disable-next-line no-unused-vars
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
import FilterMenu from '@package/components/theme/Search/FilterMenu';
import { When } from '@package/customizations/components/theme/View/EventDatesInfo';
import { Link } from 'react-router-dom';

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
    de: 'Erweiterte Suche',
  },
  filterArtworks: {
    en: 'Only in the collection',
    nl: 'Alleen in de collectie',
    de: 'Nur in der Sammlung',
  },
  excludeArtworks: {
    en: 'Only in the website',
    nl: 'Alleen in de website',
    de: 'Nur auf der Website',
  },
  hasImage: {
    nl: 'Met beeld',
    en: 'With image',
    de: 'Mit Bild',
  },
  onDisplay: {
    en: 'Collection now on view',
    nl: 'Collectie nu te zien',
    de: 'Sammlung jetzt zu sehen',
  },
  filterheading: {
    nl: 'Filter »',
    en: 'Filter »',
    de: 'Filter »',
  },
  filter: {
    nl: 'Filter de resultaten',
    en: 'Filter the results',
    de: 'Filtern Sie die Ergebnisse',
  },
  showFilters: {
    nl: 'showFilters',
    en: 'showFilters',
    de: 'showFilters',
  },
  hideFilters: {
    nl: 'Verberg filters',
    en: 'Hide Filters',
    de: 'Filter ausblenden',
  },
  deleteEverything: {
    nl: 'Verwijder alles',
    en: 'Clear all',
    de: 'Alles löschen',
  },
  total: {
    nl: 'Totaal',
    en: 'Total',
    de: 'Gesamt',
  },
  currentSearch: {
    nl: 'Huidige zoekopdracht',
    en: 'Current search',
    de: 'Aktuelle Suche',
  },
  description: {
    nl:
      'Wegens werkzaamheden aan de website is de collectie online momenteel beperkt raadpleegbaar.',
    en:
      'Due to maintenance work the online collection is only accessible to a limited extent.',
    de:
      'Vanwege onderhoudswerkzaamheden is de online collectie slechts beperkt toegankelijk.',
  },
  periods: {
    nl: 'Periode',
    en: 'Period',
    de: 'Zeitraum',
  },
  century: {
    nl: 'e Eeuw',
    en: '. century',
    de: '. Jahrhundert',
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
      hasPreviewImage: false,
      ObjOnDisplay: false,
      filtersDisplay: false,
      showFilters: true,
      artworkDates: [],
      datingFilters: [],
      choosenPeriodFilters: [],
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
    this.fetchArtworkDates();
    // this.fetchDatingFilters();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.pathname !== this.props.pathname ||
      prevProps.items !== this.props.items
    ) {
      this.fetchAllFallbackImages();
      this.fetchArtworkDates();
      // this.fetchDatingFilters();
    }
  }

  componentWillUnmount() {
    this.isMountedFlag = false;
  }

  fetchArtworkDates = async () => {
    const { history, intl } = this.props;
    const queryParams = qs.parse(history.location.search);
    try {
      const response = await fetch(
        `/++api++${history.location.pathname}/@@SearchArtworks?SearchableText=${queryParams.SearchableText}&Language=${intl.locale}`,
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (this.isMountedFlag) {
        this.setState({ artworkDates: data.results || [] });
      }
    } catch (error) {
      if (this.isMountedFlag) {
        this.setState({ artworkDates: [] });
      }
    }
  };

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

  // fetchDatingFilters = async () => {
  //   const { history, intl } = this.props;
  //   const queryParams = qs.parse(history.location.search);
  //   try {
  //     const response = await fetch(
  //       `/++api++/${intl.locale}/@@search_facets?SearchableText=${queryParams.SearchableText}&Language=${intl.locale}`,
  //     );

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok');
  //     }
  //     const data = await response.json();
  //     this.setState({ datingFilters: data.centuries });
  //   } catch (error) {
  //     this.setState({ datingFilters: {} });
  //   }
  // };

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

  handleCheckboxChange = (checkboxType, filters) => {
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
      case 'showFilters':
        updates = { showFilters: !this.state.showFilters };
        break;
      case 'Period':
        updates = {
          choosenPeriodFilters: this.state.datingFilters[filters],
        };
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
      currentUrlParams.delete('dating');

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

      if (this.state.choosenPeriodFilters?.length > 0) {
        this.state.choosenPeriodFilters.forEach((period) => {
          currentUrlParams.set('dating', period);
        });
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
    options['metadata_fields'] = [
      'start',
      'end',
      'whole_day',
      'open_end',
      'artwork_author',
      'dating',
    ];
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
        <label>
          <input
            type="checkbox"
            checked={this.state.hasPreviewImage}
            onChange={() => this.handleCheckboxChange('hasPreviewImage')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.hasImage[intl.locale]}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={this.state.ObjOnDisplay}
            onChange={() => this.handleCheckboxChange('ObjOnDisplay')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.onDisplay[intl.locale]}</span>
        </label>
      </>
    );
  };

  // renderPeriodButtons = () => {
  //   const { intl } = this.props;
  //   return (
  //     <div className="filter-summary">
  //       <div className="filter-summary-title side">
  //         {' '}
  //         <h5>{translations.periods[intl.locale]}</h5>
  //       </div>
  //       {Object.keys(this.state.datingFilters).map((period) => (
  //         <label key={period}>
  //           <input
  //             type="checkbox"
  //             className="artwork-checkbox"
  //             onChange={() => this.handleCheckboxChange('Period', period)}
  //           />
  //           <span className="label">
  //             {period}
  //             {translations.century[intl.locale]}
  //           </span>
  //         </label>
  //       ))}
  //     </div>
  //   );
  // };

  renderOnlyartworksbutton = () => {
    const { intl } = this.props;
    return (
      <>
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
      </>
    );
  };

  renderExcludeartworksbutton = () => {
    const { intl } = this.props;
    return (
      <>
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
      </>
    );
  };
  renderPreviewimagebutton = () => {
    const { intl } = this.props;
    return (
      <>
        <label>
          <input
            type="checkbox"
            checked={this.state.hasPreviewImage}
            onChange={() => this.handleCheckboxChange('hasPreviewImage')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.hasImage[intl.locale]}</span>
        </label>
      </>
    );
  };
  renderOndisplaybutton = () => {
    const { intl } = this.props;
    return (
      <>
        <label>
          <input
            type="checkbox"
            checked={this.state.ObjOnDisplay}
            onChange={() => this.handleCheckboxChange('ObjOnDisplay')}
            className="artwork-checkbox"
          />
          <span className="label">{translations.onDisplay[intl.locale]}</span>
        </label>
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
                {translations.searchresults[intl.locale]}
                {/* {translations.for[intl.locale]} {this.props.searchableText} */}
              </h1>
              <h2 className="subheading">
                {translations.description[intl.locale]}
              </h2>
              {/* <SearchTags /> */}
              <div className="search">
                <SearchBar />
              </div>
              <div
                id="filter-section"
                className="artwork-search-check button advancedsearch-button"
              >
                {' '}
                <Link
                  to={
                    intl.locale !== 'de'
                      ? `/${intl.locale}/advancedsearch`
                      : `/en/advancedsearch`
                  }
                >
                  <button className="filter-button text-button btn-block advancedsearch">
                    {translations.advancedsearch[intl.locale]}
                  </button>
                </Link>
              </div>
              <FilterMenu
                renderOnlyartworksbutton={this.renderOnlyartworksbutton()}
                renderExcludeartworksbutton={this.renderExcludeartworksbutton()}
                renderPreviewimagebutton={this.renderPreviewimagebutton()}
                renderOndisplaybutton={this.renderOndisplaybutton()}
              />
              <div className="result-count">
                {this.props.search?.items_total > 0 ? (
                  <>
                    <div className="items_total">
                      <strong>{this.props.search.items_total}</strong>
                      {translations.results[intl.locale]}
                    </div>
                  </>
                ) : (
                  <div>
                    <FormattedMessage
                      id="No results found"
                      defaultMessage="No results found"
                    />
                  </div>
                )}
              </div>
            </header>
            <section id="content-core">
              <div className="artwork-search-check heading">
                {this.renderFilterButtons()}
                {/* this will be the next filters */}
                {/* {this.renderPeriodButtons()} */}
              </div>
              <div className="search-results-wrapper">
                <div className="filter-summary">
                  <div className="filter-summary-title">
                    <h5>{translations.currentSearch[intl.locale]}</h5>
                  </div>

                  <div
                    className={`filter-summary-list-wrapper ${
                      this.state.showFilters ? 'show' : 'hide'
                    }`}
                  >
                    {(this.state.onlyArtworks ||
                      this.state.excludeArtworks) && (
                      <>
                        <div className="filter-summary-subtitle">
                          <button
                            onClick={() =>
                              this.state.onlyArtworks
                                ? this.handleCheckboxChange('onlyArtworks')
                                : this.handleCheckboxChange('excludeArtworks')
                            }
                            className="filter-cancel-button"
                          >
                            [X]
                          </button>
                          {translations.filter[intl.locale]}
                        </div>
                        <div className="filter-summary-display">
                          {this.state.onlyArtworks && (
                            <>
                              <button
                                onClick={() =>
                                  this.handleCheckboxChange('onlyArtworks')
                                }
                                className="filter-cancel-button"
                              >
                                [X]
                              </button>
                              {translations.filterArtworks[intl.locale]}
                            </>
                          )}
                          {this.state.excludeArtworks && (
                            <>
                              <button
                                onClick={() =>
                                  this.handleCheckboxChange('excludeArtworks')
                                }
                                className="filter-cancel-button"
                              >
                                [X]
                              </button>
                              {translations.excludeArtworks[intl.locale]}
                            </>
                          )}
                        </div>
                      </>
                    )}{' '}
                    {!this.state.onlyArtworks && !this.state.excludeArtworks && (
                      <>
                        <div className="filter-summary-subtitle">
                          <button
                            onClick={() =>
                              this.handleCheckboxChange('showFilters')
                            }
                            className="filter-cancel-button"
                          >
                            [X]
                          </button>
                          {translations.filter[intl.locale]}
                        </div>
                        <div className="filter-summary-display">
                          <button
                            onClick={() =>
                              this.handleCheckboxChange('showFilters')
                            }
                            className="filter-cancel-button"
                          >
                            [X]
                          </button>
                          {translations.total[intl.locale]}
                        </div>
                      </>
                    )}
                    {this.state.hasPreviewImage && (
                      <>
                        <div className="filter-summary-subtitle">
                          <button
                            onClick={() =>
                              this.handleCheckboxChange('hasPreviewImage')
                            }
                            className="filter-cancel-button"
                          >
                            [X]
                          </button>
                          {translations.hasImage[intl.locale]}
                        </div>
                        <div className="filter-summary-display">
                          <>
                            <button
                              onClick={() =>
                                this.handleCheckboxChange('hasPreviewImage')
                              }
                              className="filter-cancel-button"
                            >
                              [X]
                            </button>
                            {translations.hasImage[intl.locale]}
                          </>
                        </div>
                      </>
                    )}
                    {this.state.ObjOnDisplay && (
                      <>
                        <div className="filter-summary-subtitle">
                          <button
                            onClick={() =>
                              this.handleCheckboxChange('ObjOnDisplay')
                            }
                            className="filter-cancel-button"
                          >
                            [X]
                          </button>
                          {translations.onDisplay[intl.locale]}
                        </div>
                        <div className="filter-summary-display">
                          <>
                            <button
                              onClick={() =>
                                this.handleCheckboxChange('ObjOnDisplay')
                              }
                              className="filter-cancel-button"
                            >
                              [X]
                            </button>
                            {translations.onDisplay[intl.locale]}
                          </>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="filter-summary-end-buttons">
                    <div className="filter-summary-display">
                      <>
                        <button
                          onClick={() =>
                            this.handleCheckboxChange('showFilters')
                          }
                          className="filter-cancel-button"
                        >
                          {this.state.showFilters ? 'Δ' : '∇'}
                        </button>
                        {/* {translations.onDisplay[intl.locale]} */}
                        {this.state.showFilters
                          ? translations.hideFilters[intl.locale]
                          : translations.showFilters[intl.locale]}
                      </>
                    </div>
                    <div className="filter-summary-display">
                      <>
                        <button
                          onClick={() => {
                            this.state.onlyArtworks &&
                              this.handleCheckboxChange('onlyArtworks');
                            this.state.excludeArtworks &&
                              this.handleCheckboxChange('excludeArtworks');
                            this.state.hasPreviewImage &&
                              this.handleCheckboxChange('hasPreviewImage');
                            this.state.ObjOnDisplay &&
                              this.handleCheckboxChange('ObjOnDisplay');
                          }}
                          className="filter-cancel-button"
                        >
                          [X]
                        </button>
                        {translations.deleteEverything[intl.locale]}
                      </>
                    </div>
                  </div>
                </div>
                <div className="result-count-filter">
                  {this.props.search?.items_total > 0 ? (
                    <>
                      <div className="items_total">
                        <strong>{this.props.search.items_total}</strong>
                        {translations.results[intl.locale]}
                      </div>
                    </>
                  ) : (
                    <div>
                      <FormattedMessage
                        id="No results found"
                        defaultMessage="No results found"
                      />
                    </div>
                  )}
                </div>
                {this.props.search?.batching && (
                  <div className="pagination-wrapper top">
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
                          ? 'disabledthis.state'
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
                    ) : item.hasFallbackImage === true ? (
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

                      {item?.['@type'] === 'artwork' && (
                        <div>
                          {item.artwork_author && (
                            <span className="item-description">
                              {item?.artwork_author[0]}
                            </span>
                          )}
                          {item?.artwork_author &&
                            item?.artwork_author.length > 0 &&
                            item?.dating &&
                            item?.dating.split('(')[0] !== '' && (
                              <span className="item-description">, </span>
                            )}
                          {item?.dating && (
                            <span className="item-description">
                              {String(item?.dating)}
                            </span>
                          )}
                        </div>
                      )}

                      {
                        item?.['@type'] !== 'artwork'
                          ? item.description && (
                              <div className="tileBody">
                                <span className="description">
                                  {truncate(item.description, 155)}
                                </span>
                              </div>
                            )
                          : ''
                        // item.description && (
                        //     <div className="tileBody">
                        //       <span
                        //         className={`description`}
                        //         dangerouslySetInnerHTML={{
                        //           __html: truncate(item.description, 155),
                        //         }}
                        //       />
                        //     </div>
                        //   )
                      }

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
