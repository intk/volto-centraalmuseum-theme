import React from 'react';
import { useIntl } from 'react-intl';

const FilterSummary = ({
  translations,
  showBottomFilters,
  setShowBottomFilters,
  onlyArtworks,
  setOnlyArtworks,
  excludeArtworks,
  setExcludeArtworks,
  hasPreviewImage,
  setHasPreviewImage,
  objOnDisplay,
  setObjOnDisplay,
  handleFacetChange,
}) => {
  const intl = useIntl();

  return (
    <div className="filter-summary">
      <div className="filter-summary-title">
        <h5>{translations.currentSearch[intl.locale]}</h5>
      </div>

      <div
        className={`filter-summary-list-wrapper ${
          showBottomFilters ? 'show' : 'hide'
        }`}
      >
        {(onlyArtworks || excludeArtworks) && (
          <>
            <div className="filter-summary-subtitle">
              <button
                onClick={() => handleFacetChange('portal_type', '')}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.filter[intl.locale]}
            </div>
            <div className="filter-summary-display">
              {onlyArtworks && (
                <>
                  <button
                    onClick={() => {
                      handleFacetChange('portal_type', '');
                      setOnlyArtworks(false);
                    }}
                    className="filter-cancel-button"
                  >
                    [X]
                  </button>
                  {translations.filterArtworks[intl.locale]}
                </>
              )}
              {excludeArtworks && (
                <>
                  <button
                    onClick={() => {
                      handleFacetChange('portal_type', '');
                      setExcludeArtworks(false);
                    }}
                    className="filter-cancel-button"
                  >
                    [X]
                  </button>
                  {translations.excludeArtworks[intl.locale]}
                </>
              )}
            </div>
          </>
        )}
        {!onlyArtworks && !excludeArtworks && (
          <>
            <div className="filter-summary-subtitle">
              <button
                onClick={() => handleFacetChange('portal_type', '')}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.filter[intl.locale]}
            </div>
            <div className="filter-summary-display">
              <button
                onClick={() => handleFacetChange('portal_type', '')}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.total[intl.locale]}
            </div>
          </>
        )}
        {hasPreviewImage && (
          <>
            <div className="filter-summary-subtitle">
              <button
                onClick={() => {
                  handleFacetChange('hasPreviewImage', '');
                  setHasPreviewImage(false);
                }}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.hasImage[intl.locale]}
            </div>
            <div className="filter-summary-display">
              <button
                onClick={() => {
                  handleFacetChange('hasPreviewImage', '');
                  setHasPreviewImage(false);
                }}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.hasImage[intl.locale]}
            </div>
          </>
        )}
        {objOnDisplay && (
          <>
            <div className="filter-summary-subtitle">
              <button
                onClick={() => {
                  handleFacetChange('objOnDisplay');
                  setObjOnDisplay(false);
                }}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.onDisplay[intl.locale]}
            </div>
            <div className="filter-summary-display">
              <button
                onClick={() => {
                  handleFacetChange('objOnDisplay');
                  setObjOnDisplay(false);
                }}
                className="filter-cancel-button"
              >
                [X]
              </button>
              {translations.onDisplay[intl.locale]}
            </div>
          </>
        )}
      </div>

      <div className="filter-summary-end-buttons">
        <div className="filter-summary-display">
          <button
            onClick={() => setShowBottomFilters(!showBottomFilters)}
            className="filter-cancel-button"
          >
            {showBottomFilters ? 'Δ' : '∇'}
          </button>
          {showBottomFilters
            ? translations.hideFilters[intl.locale]
            : translations.showFilters[intl.locale]}
        </div>
        <div className="filter-summary-display">
          <button
            onClick={() => {
              handleFacetChange('portal_type', '');
              setOnlyArtworks(false);
              setExcludeArtworks(false);
              setObjOnDisplay(false);
              setHasPreviewImage(false);
              // hasPreviewImage && handleFacetChange('hasPreviewImage');
              // objOnDisplay && handleFacetChange('objOnDisplay');
            }}
            className="filter-cancel-button"
          >
            [X]
          </button>
          {translations.deleteEverything[intl.locale]}
        </div>
      </div>
    </div>
  );
};

export default FilterSummary;
