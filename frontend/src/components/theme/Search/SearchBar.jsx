/**
 * Search widget component.
 * @module components/theme/SearchWidget/SearchWidget
 */

import React from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input } from 'semantic-ui-react';
import { defineMessages, useIntl } from 'react-intl';
import { useDetectClickOutside } from 'react-detect-click-outside';

const messages = defineMessages({
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  searchSite: {
    id: 'Search Site',
    defaultMessage: 'Search Site',
  },
});

/**
 * SearchWidget component class.
 * @class SearchWidget
 * @extends Component
 */
const SearchBar = ({ onClose }) => {
  const [text, setText] = React.useState('');
  const [visible, setVisible] = React.useState(false);
  const history = useHistory();
  const intl = useIntl();
  let locale = intl.locale;
  if (locale === 'de') {
    locale = 'en';
  }
  const ref = useDetectClickOutside({
    onTriggered: () => {
      setText('');
      setVisible(false);
    },
  });
  const inputRef = React.useRef(null);

  const onChangeText = (e, { value }) => {
    setText(value);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setVisible(false);
    history.push(
      `/${intl.locale}/search?SearchableText=${encodeURIComponent(
        text,
      )}&Language=${locale}`,
    );
    // reset input value
    setText('');
    // onClose();
  };

  return (
    <div ref={ref} className="searchbar">
      <Form action="/search" onSubmit={onSubmit}>
        <Form.Field className={`searchbox${visible ? ' visible' : ''}`}>
          <Input
            id="input"
            ref={inputRef}
            aria-label={intl.formatMessage(messages.searchSite)}
            onChange={onChangeText}
            name="SearchableText"
            value={text}
            transparent
            autoComplete="off"
            placeholder={intl.formatMessage(messages.searchSite)}
            title={intl.formatMessage(messages.search)}
          />
          <button
            type="submit"
            aria-label={intl.formatMessage(messages.search)}
            onClick={(e) => {
              if (!text?.length) {
                e.preventDefault();

                if (inputRef?.current) {
                  inputRef.current.focus();
                }

                setVisible(true);
              } else {
                onSubmit(e);
              }
            }}
          >
            {intl.formatMessage(messages.search)}
          </button>
        </Form.Field>
      </Form>
    </div>
  );
};

export default SearchBar;
