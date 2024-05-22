import React from 'react';
import { Container } from 'semantic-ui-react';
import './css/authorview.less';
import { SeeMoreAuthor } from '../../index';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  authorUrl: {
    id: 'authorUrl',
    defaultMessage:
      'Bekijk hier alle werken van {authorName} in de collectie van Centraal Museum. Voor kunsthistorische documentatie over {authorName}, ga naar',
  },
});

export default function AuthorView(props) {
  const intl = useIntl();
  const authorName = props?.content?.title || 'Unknown Author'; // Provide a fallback in case title is not available

  return (
    <div id="object-block">
      {props?.content?.title && (
        <div className="description-wrapper">
          <p className="documentDescription author">{props?.content?.title}</p>

          {props?.content?.authorURL && (
            <p className="author_url">
              {intl.formatMessage(messages.authorUrl, { authorName })}{' '}
              <a href={props.content.authorURL}>{props.content.authorURL}</a>{' '}
              {intl.locale === 'en' && '(in Dutch).'}
            </p>
          )}
        </div>
      )}
      <Container>
        <SeeMoreAuthor {...props} />
      </Container>
    </div>
  );
}
