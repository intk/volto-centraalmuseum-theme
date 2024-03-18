/**
 * EventView view component.
 * @module components/theme/View/EventView
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  hasBlocksData,
  // flattenHTMLToAppURL,
  getBaseUrl,
} from '@plone/volto/helpers';
// import { Image, Grid } from 'semantic-ui-react';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
// import { EventDetails } from '@plone/volto/components';
import { useDispatch, useSelector } from 'react-redux';
import config from '@plone/volto/registry';
import { getSchema } from '@plone/volto/actions';
import {
  Container as SemanticContainer,
  Segment,
  Grid,
  Label,
} from 'semantic-ui-react';
import { isEqual } from 'lodash';
import { getWidget } from '@plone/volto/helpers/Widget/utils';

const translations = {
  expired: {
    en: 'PAST EXHIBITION',
    nl: 'TENTOONSTELLING IS AFGELOPEN',
    de: 'VERLEDEN TENTOONSTELLING',
  },
};

function filterBlocks(content, types) {
  if (!(content.blocks && content.blocks_layout?.items)) return content;

  return {
    ...content,
    blocks_layout: {
      ...content.blocks_layout,
      items: content.blocks_layout.items.filter(
        (id) => types.indexOf(content.blocks[id]?.['@type']) === -1,
      ),
    },
  };
}

/**
 * EventView view component class.
 * @function EventView
 * @params {object} content Content object.
 * @returns {string} Markup of the component.
 */
const ExhibitionView = (props) => {
  const { content, location } = props;
  const path = getBaseUrl(location?.pathname || '');
  const dispatch = useDispatch();
  const { views } = config.widgets;
  const contentSchema = useSelector((state) => state.schema?.schema);
  const fieldsetsToExclude = [
    'categorization',
    'dates',
    'ownership',
    'settings',
  ];
  const fieldsets = contentSchema?.fieldsets.filter(
    (fs) => !fieldsetsToExclude.includes(fs.id),
  );
  // const description = content?.description;
  let hasLeadImage = content?.preview_image;

  content.hide_top_image !== null
    ? (hasLeadImage = content?.preview_image && !content.hide_top_image)
    : (hasLeadImage = content?.preview_image);

  const filteredContent = hasLeadImage
    ? filterBlocks(content, ['title'])
    : content;

  // TL;DR: There is a flash of the non block-based view because of the reset
  // of the content on route change. Subscribing to the content change at this
  // level has nasty implications, so we can't watch the Redux state for loaded
  // content flag here (because it forces an additional component update)
  // Instead, we can watch if the content is "empty", but this has a drawback
  // since the locking mechanism inserts a `lock` key before the content is there.
  // So "empty" means `content` is present, but only with a `lock` key, thus the next
  // ugly condition comes to life
  const contentLoaded = content && !isEqual(Object.keys(content), ['lock']);

  React.useEffect(() => {
    content?.['@type'] &&
      !hasBlocksData(content) &&
      dispatch(getSchema(content['@type'], location.pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Container =
    config.getComponent({ name: 'Container' }).component || SemanticContainer;

  const lang = useSelector((state) => state?.intl?.locale);
  const startDate = new Date(props?.content?.start);
  const endDate = new Date(props?.content?.end);
  const format = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const startHour = format.format(startDate);
  const endHour = format.format(endDate);

  return contentLoaded ? (
    hasBlocksData(content) ? (
      <Container id="page-document">
        {(!(startHour === '00:00' || endHour === '23:59') &&
          startDate.getDate() === endDate?.getDate() &&
          startDate.getMonth() === endDate?.getMonth() &&
          startDate.getFullYear() === endDate?.getFullYear()) ||
        (!(
          startDate.getDate() === endDate?.getDate() &&
          startDate.getMonth() === endDate?.getMonth() &&
          startDate.getFullYear() === endDate?.getFullYear()
        ) &&
          new Date(props?.content?.end) < new Date()) ? (
          <p
            style={{
              marginBottom: '0px',
              fontFamily: "'FranklinMed', Arial, sans-serif",
              fontSize: '17px',
              letterSpacing: '0.85px',
            }}
          >
            <strong>{translations.expired[lang]}</strong>
          </p>
        ) : (
          ''
        )}
        <RenderBlocks {...props} path={path} content={filteredContent} />
      </Container>
    ) : (
      <Container id="page-document">
        {fieldsets?.map((fs) => {
          return (
            <div className="fieldset" key={fs.id}>
              {fs.id !== 'default' && <h2>{fs.title}</h2>}
              {fs.fields?.map((f, key) => {
                let field = {
                  ...contentSchema?.properties[f],
                  id: f,
                  widget: getWidget(f, contentSchema?.properties[f]),
                };
                let Widget = views?.getWidget(field);
                return f !== 'title' ? (
                  <Grid celled="internally" key={key}>
                    <Grid.Row>
                      <Label title={field.id}>{field.title}:</Label>
                    </Grid.Row>
                    <Grid.Row>
                      <Segment basic>
                        <Widget value={content[f]} />
                      </Segment>
                    </Grid.Row>
                  </Grid>
                ) : (
                  <Widget key={key} value={content[f]} />
                );
              })}
            </div>
          );
        })}
      </Container>
    )
  ) : null;
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
ExhibitionView.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    text: PropTypes.shape({
      data: PropTypes.string,
    }),
    attendees: PropTypes.arrayOf(PropTypes.string).isRequired,
    contact_email: PropTypes.string,
    contact_name: PropTypes.string,
    contact_phone: PropTypes.string,
    end: PropTypes.string.isRequired,
    event_url: PropTypes.string,
    location: PropTypes.string,
    open_end: PropTypes.bool,
    recurrence: PropTypes.any,
    start: PropTypes.string.isRequired,
    subjects: PropTypes.arrayOf(PropTypes.string).isRequired,
    whole_day: PropTypes.bool,
  }).isRequired,
};

export default ExhibitionView;
