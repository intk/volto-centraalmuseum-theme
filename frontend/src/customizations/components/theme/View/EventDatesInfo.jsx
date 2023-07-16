import React from 'react';
import PropTypes from 'prop-types';
import { List } from 'semantic-ui-react';
import cx from 'classnames';

import { toBackendLang } from '@plone/volto/helpers';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

const getDateRangeDescription = (lang, start, end) => {
  const format = (date, options) =>
    new Intl.DateTimeFormat(lang, options).format(date);
  const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const dayOptions = { day: 'numeric' };

  if (
    !end ||
    (start.getDate() === end?.getDate() &&
      start.getMonth() === end?.getMonth() &&
      start.getFullYear() === end?.getFullYear())
  ) {
    return format(start, defaultOptions);
  }

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${format(start, dayOptions)} — ${format(end, defaultOptions)}`;
  }

  return `${format(start, defaultOptions)} — ${format(end, defaultOptions)}`;
};

const getHourRangeDescription = (lang, start, end, open_end, whole_day) => {
  if (whole_day) return '';

  const format = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const startHour = format.format(start);
  const endHour = format.format(end);
  if (startHour === '00:00') return '';
  if (endHour === '23:59') return `, ${startHour}`;

  console.log(start, end, open_end, whole_day )

  return open_end
    ? `, ${startHour}`
    : `, ${startHour} - ${end ? format.format(end) : ''}`;
};

export const datesForDisplay = (start, end, moment) => {
  const mStart = moment(start);
  const mEnd = moment(end);
  if (!mStart.isValid() || !mEnd.isValid()) {
    return null;
  }
  const sameDay = mStart.isSame(mEnd, 'day');
  const sameTime = mStart.isSame(mEnd, 'minute');
  return {
    sameDay,
    sameTime,
    startDate: mStart.toDate(), // Convert to JavaScript Date object
    startTime: mStart.format('LT'),
    endDate: mEnd.toDate(), // Convert to JavaScript Date object
    endTime: mEnd.format('LT'),
  };
};

const When_ = ({ start, end, whole_day, open_end, moment: momentlib }) => {
  const lang = useSelector((state) => state.intl.locale);
  const intl = useIntl();

  const moment = momentlib.default;
  moment.locale(toBackendLang(lang));

  const datesInfo = datesForDisplay(start, end, moment);
  if (!datesInfo) {
    return;
  }


  const startDate = new Date(datesInfo.startDate);
  const endDate = new Date(datesInfo.endDate);


  // TODO I18N INTL
  return (
    <>
      {start && !open_end ? (
        <span className="hero-dates">
          {getDateRangeDescription(intl.locale, startDate, endDate)}
        </span>
      ) : (
        start && (
          <span className="hero-dates">
            {getDateRangeDescription(intl.locale, startDate)}
          </span>
        )
      )}
      {start && !whole_day && (
        <span className="hero-dates">
          {getHourRangeDescription(
            intl.locale,
            startDate,
            endDate,
            open_end,
            whole_day,
          )}{' '}
        </span>
      )}
    </>
  );
};

export const When = injectLazyLibs(['moment'])(When_);

When.propTypes = {
  start: PropTypes.string.isRequired,
  end: PropTypes.string,
  whole_day: PropTypes.bool,
  open_end: PropTypes.bool,
};

export const Recurrence_ = ({
  recurrence,
  start,
  moment: momentlib,
  rrule,
}) => {
  const moment = momentlib.default;
  const { RRule, rrulestr } = rrule;
  if (recurrence.indexOf('DTSTART') < 0) {
    var dtstart = RRule.optionsToString({
      dtstart: new Date(start),
    });
    recurrence = dtstart + '\n' + recurrence;
  }
  const rule = rrulestr(recurrence, { unfold: true, forceset: true });

  return (
    <List
      items={rule
        .all()
        .map((date) => datesForDisplay(date, undefined, moment))
        .map((date) => date.startDate)}
    />
  );
};
export const Recurrence = injectLazyLibs(['moment', 'rrule'])(Recurrence_);

Recurrence.propTypes = {
  recurrence: PropTypes.string.isRequired,
  start: PropTypes.string.isRequired,
};
