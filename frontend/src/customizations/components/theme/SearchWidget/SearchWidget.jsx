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
const SearchWidget = ({ onClose }) => {
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
    onClose();
  };

  return (
    <div ref={ref} className="searchWrapper">
      <Form action="/search" onSubmit={(e) => onSubmit(e)}>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="18px"
              viewBox="0 0 512 512"
            >
              <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
            </svg>
          </button>
        </Form.Field>
      </Form>
    </div>
  );
};

export default SearchWidget;
