/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Input, Header } from 'semantic-ui-react';
import './AdvancedSearch.less';
import { Container } from 'semantic-ui-react';
import SelectFacet from './SelectFacet';
import { getVocabulary } from '@plone/volto/actions';
import { defineMessages, useIntl } from 'react-intl';
import { flattenToAppURL } from '@plone/volto/helpers';

const messages = defineMessages({
  zoeken: {
    id: 'zoeken',
    defaultMessage: 'Zoeken',
  },
  zoekindetentoonstelling: {
    id: 'zoekindetentoonstelling',
    defaultMessage: 'Zoek in het tentoonstellingsarchief',
  },
  advancedsearchlink: {
    id: 'advancedsearchlink',
    defaultMessage: 'Geavanceerd zoeken...',
  },
});

const artworkTechniqueVocabulary = [
  { value: 'oil_painting', label: 'Oil Painting' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'acrylic', label: 'Acrylic' },
  // ... other options
];

const AdvancedSearch = () => {
  const dispatch = useDispatch();
  const techniqueVocabulary = useSelector(
    (state) => state.vocabularies.techniqueVocabulary || [],
  );

  const [selectedTechnique, setSelectedTechnique] = useState(null);

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        dispatch({ type: 'GET_VOCABULARY_REQUEST' }); // Set loading to true
        const response = await getVocabulary(
          'plone.app.vocabularies.artwork_technique',
        );
        if (response.ok) {
          const data = await response.json();
          dispatch({ type: 'GET_VOCABULARY_SUCCESS', payload: data });
        } else {
          dispatch({ type: 'GET_VOCABULARY_FAILURE', error: 'Not Found' });
        }
      } catch (error) {
        dispatch({ type: 'GET_VOCABULARY_FAILURE', error: error.message });
      }
    };

    fetchVocabulary();
  }, [dispatch]);

  const [searchParams, setSearchParams] = useState({
    artwork_author: '',
    artwork_material: '',
    artwork_technique: '',
    ObjObjectNumberTxt: '',
    ObjTitleTxt: '',
    ObjObjectTypeTxt: '',
    ObjCreditlineTxt: '',
  });
  const history = useHistory();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
  };

  const intl = useIntl();
  const locale = intl.locale;
  const searchLink = `${locale}/advancedsearch`;

  const handleSubmit = () => {
    // Extract only the necessary search parameters
    const searchQuery = searchParams.SearchableText;

    // Construct the complex query structure
    // const queryParamStructure = [
    //   {
    //     i: 'portal_type',
    //     o: 'paqo.selection.any',
    //     v: ['artwork'],
    //   },
    //   {
    //     i: 'SearchableText',
    //     o: 'paqo.string.contains',
    //     v: searchQuery,
    //   },
    // ];

    // // Convert the structure to a JSON string and encode it for URL
    // const encodedQueryParam = encodeURIComponent(
    //   JSON.stringify(queryParamStructure),
    // );

    // // Redirect to the advanced search page with the encoded query parameters
    // history.push(
    //   `/nl/advancedsearch#b_size=20&query=${encodedQueryParam}&sort_order=ascending`,
    // );
    // Redirect to the search page with the search query as a parameter
    // history.push(`/search?SearchableText=${encodeURIComponent(searchQuery)}`);
    history.push(
      `/${locale}/search?SearchableText=${encodeURIComponent(
        searchQuery,
      )}&Type=Exhibition&Language=${locale}&sort_order=ascending`,
    );
  };

  return (
    <div id="advancedsearchblock">
      {' '}
      <div id="search-page">
        <div className="searchbar">
          <div className="text-input-facet first">
            <Input
              type="text"
              name="SearchableText"
              value={searchParams.SearchableText}
              onChange={handleInputChange}
              placeholder={intl.formatMessage(messages.zoekindetentoonstelling)}
            />
          </div>
          <button
            style={{ pointerEvents: 'auto' }}
            onClick={handleSubmit}
            type="submit"
            className="Search-main-button"
          >
            {intl.formatMessage(messages.zoeken)}
          </button>
        </div>
        <p className="link-to-search">
          {' '}
          <a href={`/${searchLink}`}>
            {' '}
            {intl.formatMessage(messages.advancedsearchlink)}
          </a>{' '}
        </p>
      </div>
    </div>
  );
};

export default AdvancedSearch;
