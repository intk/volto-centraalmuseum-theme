import React from 'react';
import { FormattedMessage } from 'react-intl';
import { flushSync } from 'react-dom';
import { defineMessages, useIntl } from 'react-intl';
import { Button, Grid } from 'semantic-ui-react';
import { Icon } from '@plone/volto/components';
import downSVG from '@plone/volto/icons/down-key.svg';
import upSVG from '@plone/volto/icons/up-key.svg';
import cx from 'classnames';
import { isEqual } from 'lodash';
import { useDeepCompareMemoize } from 'use-deep-compare-effect';

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
});

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
                  onClick={() => onTriggerSearch(searchText)}
                >
                  {data.searchButtonLabel ||
                    intl.formatMessage(messages.searchButtonText)}
                </Button>
              )}
              {data.facets?.length > 0 && data?.facets[0]?.field && (
                <Button
                  className={cx('secondary filters-btn', {
                    open: showFilters,
                  })}
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    'margin-top': '15px',
                    background: '#494a51',
                    color: '#fff',
                  }}
                >
                  <FormattedMessage id="Filters" defaultMessage="Filters" />
                  {showFilters ? (
                    <Icon
                      name={upSVG}
                      size="20px"
                      style={{
                        'margin-bottom': '-5px',
                        'margin-left': '5px',
                        'margin-right': '0px',
                      }}
                    />
                  ) : (
                    <Icon
                      name={downSVG}
                      size="20px"
                      style={{
                        'margin-bottom': '-5px',
                        'margin-left': '5px',
                        'margin-right': '0px',
                      }}
                    />
                  )}
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
