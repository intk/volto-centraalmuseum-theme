import React, { useState } from 'react';
// import { FormattedMessage } from 'react-intl';
import { flushSync } from 'react-dom';
import { defineMessages, useIntl } from 'react-intl';
import { Button, Grid } from 'semantic-ui-react';
// import { Icon } from '@plone/volto/components';
// import downSVG from '@plone/volto/icons/down-key.svg';
// import upSVG from '@plone/volto/icons/up-key.svg';
import cx from 'classnames';
import { isEqual } from 'lodash';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';
// import FilterMenu from '@package/components/theme/Search/FilterMenu';
// import { Link } from 'react-router-dom';
// import { useHistory } from 'react-router-dom';
// import { useLocation } from 'react-router-dom';
import FilterSummary from './FilterSummary';

import {
  SearchInput,
  SearchDetails,
  ViewSwitcher,
} from '@plone/volto/components/manage/Blocks/Search/components';
import Facets from './Facets';

// import HiddenFacets from './HiddenFacets';
import SortOn from './SortOn';

const messages = defineMessages({
  searchButtonText: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  showMore: {
    id: 'ShowMore',
    defaultMessage: 'Geavanceerd zoeken in de collectie',
  },
  showLess: {
    id: 'ShowLess',
    defaultMessage: 'Minder filters',
  },
});

const translations = {
  searchresults: {
    en: 'Search results',
    nl: 'Zoekresultaten',
  },
  results: {
    en: 'items matching your search terms.',
    nl: 'resultaten voor de zoekopdracht.',
  },
  for: {
    en: 'for',
    nl: 'voor',
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
    nl: 'Met beeld',
    en: 'With image',
  },
  onDisplay: {
    en: 'Collection now on view',
    nl: 'Collectie nu te zien',
  },
  filterheading: {
    nl: 'Filter »',
    en: 'Filter »',
  },
  filter: {
    nl: 'Filter de resultaten',
    en: 'Filter the results',
  },
  showFilters: {
    nl: 'Toon filters',
    en: 'Show Filters',
  },
  hideFilters: {
    nl: 'Verberg filters',
    en: 'Hide Filters',
  },
  deleteEverything: {
    nl: 'Verwijder alles',
    en: 'Clear all',
  },
  total: {
    nl: 'Totaal',
    en: 'Total',
  },
  currentSearch: {
    nl: 'Huidige zoekopdracht',
    en: 'Current search',
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
const FacetWrapper = ({ children }) => (
  <Grid.Column mobile={12} tablet={4} computer={3}>
    {children}
  </Grid.Column>
);

const isDirty = (searchDataQuery, query) => {
  let isDirty = searchDataQuery.find((q) => {
    const predefined = query.find((pf) => pf.i === q.i);
    return predefined
      ? !isEqual(predefined.v, q.v) || predefined.o !== q.o
      : true;
  });

  return isDirty;
};

const TopSideFacets = (props) => {
  const {
    children,
    data,
    totalItems,
    facets,
    setFacets,
    setSortOn,
    setSortOrder,
    sortOn,
    sortOrder,
    onTriggerSearch,
    searchedText, // search text for previous search
    searchText, // search text currently being entered (controlled input)
    isEditMode,
    querystring = {},
    searchData,
    // mode = 'view',
    // variation,
  } = props;
  const { showSearchButton } = data;
  const isLive = !showSearchButton;
  const intl = useIntl();

  // eslint-disable-next-line no-unused-vars
  const defaultOpened = isDirty(
    searchData.query || [],
    data.query?.query || [],
  );
  // eslint-disable-next-line no-unused-vars
  const [showFilters, setShowFilters] = React.useState(false);

  React.useState(() => {
    if (isEditMode) {
      setShowFilters(true);
    }
  }, [isEditMode]);

  const _hiddenData = {
    ...data,
    facets: data.facets?.map((f) => ({
      ...f,
      hidden: f.hidden
        ? Object.keys(facets).includes(f.field.value) && facets[f.field.value]
          ? false
          : true
        : false,
    })),
  };
  const hiddenData = useDeepCompareMemoize(_hiddenData);

  const [onlyArtworks, setOnlyArtworks] = useState(false);
  const [excludeArtworks, setExcludeArtworks] = useState(false);
  const [hasPreviewImage, setHasPreviewImage] = useState(false);
  const [objOnDisplay, setObjOnDisplay] = useState(false);
  const [showBottomFilters, setShowBottomFilters] = React.useState(false);

  const handleFacetChange = (id, value) => {
    flushSync(() => {
      const newFacets = { ...facets, [id]: value };
      setFacets(newFacets);
      onTriggerSearch(searchedText || '', newFacets);
    });
  };

  const renderFilterButtons = () => {
    return (
      <>
        <label>
          <input
            type="radio"
            checked={onlyArtworks}
            onChange={() => {
              setOnlyArtworks(!onlyArtworks);
              setExcludeArtworks(false);
              handleFacetChange('portal_type', ['artwork']);
            }}
            className="artwork-checkbox"
          />
          <span className="label">
            {translations.filterArtworks[intl.locale]}
          </span>
        </label>
        <label>
          <input
            type="radio"
            checked={excludeArtworks}
            onChange={() => {
              setExcludeArtworks(!excludeArtworks);
              setOnlyArtworks(false);
              handleFacetChange('portal_type', [
                'Documents',
                'Event',
                'News Item',
                'author',
                'Link',
                'exhibition',
              ]);
            }}
            className="artwork-checkbox"
          />
          <span className="label">
            {translations.excludeArtworks[intl.locale]}
          </span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={hasPreviewImage}
            onChange={() => {
              handleFacetChange(
                'hasImage',
                hasPreviewImage === true ? '' : 'true',
              );
              setHasPreviewImage(!hasPreviewImage);
            }}
            className="artwork-checkbox"
          />
          <span className="label">{translations.hasImage[intl.locale]}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={objOnDisplay}
            onChange={() => {
              handleFacetChange(
                'ObjOnDisplay',
                objOnDisplay === true ? '' : 'true',
              );
              setObjOnDisplay(!objOnDisplay);
            }}
            className="artwork-checkbox"
          />
          <span className="label">{translations.onDisplay[intl.locale]}</span>
        </label>
      </>
    );
  };

  return (
    <Grid className="searchBlock-facets" stackable>
      {data.headline && (
        <Grid.Row>
          <Grid.Column>
            <h2 className="headline">{data.headline}</h2>
          </Grid.Column>
        </Grid.Row>
      )}

      <Grid.Row>
        <Grid.Column>
          {(Object.keys(data).includes('showSearchInput')
            ? data.showSearchInput
            : true) && (
            <div className="searchbar">
              <SearchInput {...props} isLive={isLive} />
              {data.showSearchButton && (
                <Button
                  className="Search-main-button"
                  primary
                  onClick={() => {
                    onTriggerSearch(searchText);
                    setShowFilters(false);
                  }}
                >
                  {data.searchButtonLabel ||
                    intl.formatMessage(messages.searchButtonText)}
                </Button>
              )}
            </div>
          )}
          <div className="search-filters-sort">
            {data.showSortOn && (
              <SortOn
                data={data}
                querystring={querystring}
                isEditMode={isEditMode}
                sortOn={sortOn}
                sortOrder={sortOrder}
                setSortOn={(sortOn) => {
                  flushSync(() => {
                    setSortOn(sortOn);
                    onTriggerSearch(searchedText || '', facets, sortOn);
                  });
                }}
                setSortOrder={(sortOrder) => {
                  flushSync(() => {
                    setSortOrder(sortOrder);
                    onTriggerSearch(
                      searchedText || '',
                      facets,
                      sortOn,
                      sortOrder,
                    );
                  });
                }}
              />
            )}
            {data.availableViews && data.availableViews.length > 1 && (
              <ViewSwitcher {...props} />
            )}
          </div>
          {showFilters && data.facets?.length > 0 && (
            <div className="facets">
              {data.facetsTitle && <h3>{data.facetsTitle}</h3>}

              {/* <Facets */}
              {/*   data={data} */}
              {/*   querystring={querystring} */}
              {/*   facets={facets} */}
              {/*   setFacets={(f) => { */}
              {/*     flushSync(() => { */}
              {/*       setFacets(f); */}
              {/*       onTriggerSearch(searchedText || '', f); */}
              {/*     }); */}
              {/*   }} */}
              {/*   facetWrapper={FacetWrapper} */}
              {/* /> */}

              <Facets
                data={hiddenData}
                querystring={querystring}
                facets={facets}
                setFacets={(f) => {
                  flushSync(() => {
                    setFacets(f);
                    onTriggerSearch(searchedText || '', f);
                  });
                }}
                facetWrapper={FacetWrapper}
              />
            </div>
          )}
          {data.facets?.length > 0 && data?.facets[0]?.field && (
            <div className="advanced-search-filter-button">
              <Button
                className={cx('secondary filters-btn', {
                  open: showFilters,
                })}
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters
                  ? intl.formatMessage(messages.showLess)
                  : intl.formatMessage(messages.showMore)}
              </Button>
            </div>
          )}

          {data?.showExtraFilters && (
            <div id="extra-filters-wrapper">
              <div className="filter-summary">
                <FilterSummary
                  translations={translations}
                  showBottomFilters={showBottomFilters}
                  setShowBottomFilters={setShowBottomFilters}
                  onlyArtworks={onlyArtworks}
                  setOnlyArtworks={setOnlyArtworks}
                  excludeArtworks={excludeArtworks}
                  setExcludeArtworks={setExcludeArtworks}
                  hasPreviewImage={hasPreviewImage}
                  setHasPreviewImage={setHasPreviewImage}
                  objOnDisplay={objOnDisplay}
                  setObjOnDisplay={setObjOnDisplay}
                  handleFacetChange={handleFacetChange}
                />
              </div>
              <div className="artwork-search-check heading">
                {renderFilterButtons()}
              </div>
            </div>
          )}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row></Grid.Row>
      <Grid.Row>
        <SearchDetails
          text={searchedText}
          total={totalItems}
          as="h5"
          data={data}
        />
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>{children}</Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default TopSideFacets;
