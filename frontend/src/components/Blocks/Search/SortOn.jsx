import React from 'react';
import { Button, Checkbox } from 'semantic-ui-react';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
import { compose } from 'redux';
import { Icon } from '@plone/volto/components';

import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

import upSVG from '@plone/volto/icons/sort-up.svg';
import downSVG from '@plone/volto/icons/sort-down.svg';

const messages = defineMessages({
  noSelection: {
    id: 'No selection',
    defaultMessage: 'No selection',
  },
  sortOn: {
    id: 'Sort',
    defaultMessage: 'Sort',
  },
  ascending: {
    id: 'Ascending',
    defaultMessage: 'Ascending',
  },
  descending: {
    id: 'Descending',
    defaultMessage: 'Descending',
  },
});

const SortOn = (props) => {
  const {
    data = {},
    sortOn = null,
    sortOrder = null,
    setSortOn,
    setSortOrder,
    isEditMode,
    querystring = {},
    intl,
  } = props;
  const { sortable_indexes } = querystring;

  const activeSortOn = sortOn || data?.query?.sort_on || '';

  const { sortOnOptions = [] } = data;
  const value = activeSortOn || intl.formatMessage(messages.noSelection);

  return (
    <div className="search-sort-wrapper">
      <div className="search-sort-on">
        <span className="sort-label">
          {intl.formatMessage(messages.sortOn)}
        </span>

        <div className="entries">
          {sortOnOptions.map((opt, i) => (
            <div className="entry" key={i}>
              <Checkbox
                radio
                disabled={isEditMode}
                label={sortable_indexes[opt]?.title || opt}
                checked={opt === value}
                onChange={() => {
                  setSortOn(opt);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <Button
        icon
        basic
        compact
        title={intl.formatMessage(messages.ascending)}
        className={cx({
          active: sortOrder === 'ascending',
        })}
        onClick={() => {
          !isEditMode && setSortOrder('ascending');
        }}
      >
        <Icon name={upSVG} size="25px" />
      </Button>
      <Button
        icon
        basic
        compact
        title={intl.formatMessage(messages.descending)}
        className={cx({
          active: sortOrder === 'descending',
        })}
        onClick={() => {
          !isEditMode && setSortOrder('descending');
        }}
      >
        <Icon name={downSVG} size="25px" />
      </Button>
    </div>
  );
};

export default compose(injectIntl, injectLazyLibs(['reactSelect']))(SortOn);
