import React, { createRef } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import cx from 'classnames';
import { Pagination, Dimmer, Loader } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import withQuerystringResults from './withQuerystringResults';

import { HiMiniArrowLongLeft } from 'react-icons/hi2';
import { HiMiniArrowLongRight } from 'react-icons/hi2';

import { useSelector } from 'react-redux';

const ListingBody = withQuerystringResults((props) => {
  const {
    data = {},
    isEditMode,
    listingItems,
    totalPages,
    onPaginationChange,
    variation,
    currentPage,
    prevBatch,
    nextBatch,
    isFolderContentsListing,
    hasLoaded,
  } = props;

  let ListingBodyTemplate;
  // Legacy support if template is present
  const variations = config.blocks?.blocksConfig['listing']?.variations || [];
  const defaultVariation = variations.filter((item) => item.isDefault)?.[0];

  if (data.template && !data.variation) {
    const legacyTemplateConfig = variations.find(
      (item) => item.id === data.template,
    );
    ListingBodyTemplate = legacyTemplateConfig.template;
  } else {
    ListingBodyTemplate =
      variation?.template ?? defaultVariation?.template ?? null;
  }

  const listingRef = createRef();

  const NoResults = variation?.noResultsComponent
    ? variation.noResultsComponent
    : config.blocks?.blocksConfig['listing'].noResultsComponent;

  // const HeadlineTag = data.headlineTag || 'h2';

  const buttonMessage = {
    button: {
      en: 'Read More',
      nl: 'Lees Meer',
      de: 'Weiterlesen',
    },
  };
  const lang = useSelector((state) => state.intl.locale);

  return (
    <>
      {listingItems?.length > 0 ? (
        <div className="listing-wrapper" ref={listingRef}>
          <ListingBodyTemplate items={listingItems} isEditMode={isEditMode} {...data} {...variation} />
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <Pagination
                activePage={currentPage}
                totalPages={totalPages}
                onPageChange={(e, { activePage }) => {
                  !isEditMode && listingRef.current.scrollIntoView({ behavior: 'smooth' });
                  onPaginationChange(e, { activePage });
                }}
                firstItem={null}
                lastItem={null}
                prevItem={{
                  content: <HiMiniArrowLongLeft />,
                  icon: true,
                  'aria-disabled': !prevBatch,
                  className: !prevBatch ? 'disabled' : null,
                }}
                nextItem={{
                  content: <HiMiniArrowLongRight />,
                  icon: true,
                  'aria-disabled': !nextBatch,
                  className: !nextBatch ? 'disabled' : null,
                }}
              />
            </div>
          )}
          {data.headline && (
            <div
              className={cx('buttomline', {
                emptyListing: !listingItems?.length > 0,
              })}
            >
              <h2>{data.headline}</h2>
              <p className={`content-button`}>{buttonMessage['button'][lang]}</p>
            </div>
          )}
        </div>
      ) : isEditMode ? (
        <div className="listing message" ref={listingRef}>
          {isFolderContentsListing && <FormattedMessage id="No items found in this container." defaultMessage="No items found in this container." />}
          {hasLoaded && NoResults && <NoResults isEditMode={isEditMode} {...data} />}
          <Dimmer active={!hasLoaded} inverted>
            <Loader indeterminate size="small">
              <FormattedMessage id="loading" defaultMessage="Loading" />
            </Loader>
          </Dimmer>
        </div>
      ) : (
        <div className="emptyListing">
          {hasLoaded && NoResults && <NoResults isEditMode={isEditMode} {...data} />}
          <Dimmer active={!hasLoaded} inverted>
            <Loader indeterminate size="small">
              <FormattedMessage id="loading" defaultMessage="Loading" />
            </Loader>
          </Dimmer>
        </div>
      )}
    </>
  );
});

export default injectIntl(ListingBody);
