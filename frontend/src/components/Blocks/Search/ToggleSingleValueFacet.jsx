import React from 'react';
import { Checkbox, Header } from 'semantic-ui-react';
import { useSelector, useDispatch } from 'react-redux';
import { getQueryStringResults } from '@plone/volto/actions';

const ToggleSingleValueFacet = (props) => {
  const { facet, isEditMode, onChange, value } = props; // value, choices, isMulti, onChange,
  const { label = value.value } = value; // TODO: what to do about this?

  return (
    <div className="button-facet">
      <Header as="h4">{facet?.title ?? facet?.field?.label}</Header>
      <div className="radio">
        <Checkbox
          disabled={isEditMode}
          label={label}
          checked={true}
          onChange={(e, { checked }) => {
            onChange(facet.field.value, checked ? value : null);
          }}
        />
      </div>
    </div>
  );
};

ToggleSingleValueFacet.stateToValue = ({
  facetSettings,
  index,
  selectedValue,
}) => {
  return selectedValue || typeof selectedValue === 'string';
};

ToggleSingleValueFacet.valueToQuery = ({ value, facet }) => {
  return value
    ? {
        i: facet.field.value,
        o: 'plone.app.querystring.operation.selection.is',
        v: value,
      }
    : null;
};

const withAuthor = (WrappedComponent) => {
  function WithAuthor(props) {
    const { value, facet } = props;
    const authorID = value.value;

    const dispatch = useDispatch();
    const [author, setAuthor] = React.useState();
    const currentLang = useSelector((state) => state.intl.locale);
    const isAuthorField = facet.field.value === 'authorID';

    React.useEffect(() => {
      if (isAuthorField && !author) {
        dispatch(
          getQueryStringResults(
            '/',
            {
              query: [
                {
                  i: 'portal_type',
                  o: 'plone.app.querystring.operation.selection.any',
                  v: ['author'],
                },
                {
                  i: 'authorID',
                  o: 'plone.app.querystring.operation.selection.is',
                  v: authorID,
                },
                {
                  i: 'Language',
                  o: 'plone.app.querystring.operation.selection.is',
                  v: currentLang,
                },
              ],
            },
            `content-${authorID}`,
          ),
        ).then((results) => {
          const { items } = results || {};
          if (items.length) {
            setAuthor(items[0].title);
          }
        });
      }
    }, [isAuthorField, authorID, author, dispatch, currentLang]);

    return <WrappedComponent {...props} value={{ ...value, label: author }} />;
  }
  return WithAuthor;
};

export default withAuthor(ToggleSingleValueFacet);
