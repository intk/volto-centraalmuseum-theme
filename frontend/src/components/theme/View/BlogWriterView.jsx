import React from 'react';
import { Container } from 'semantic-ui-react';
import './css/blogwriterview.less';
import { BodyClass } from '@plone/volto/helpers';
import { flattenToAppURL } from '@plone/volto/helpers';
import { SeeMoreNewsItem } from '../../index';

export default function BlogWriterView(props) {
  const src = props.content.preview_image
    ? flattenToAppURL(`${props.content.preview_image.download}`)
    : '';

  return (
    <div id="object-block">
      <BodyClass className="hide-top-image" />
      {props?.content?.title && (
        <div className="description-wrapper">
          <p className="documentDescription author">
            {props?.content?.preview_image && (
              <div className="writer-image-wrapper">
                <img src={src} alt="writer"></img>
              </div>
            )}
            {props?.content?.title}
          </p>
          {props?.content?.description && (
            <p className="author_url">{props.content.description}</p>
          )}
        </div>
      )}
      <Container>
        <SeeMoreNewsItem {...props} />
      </Container>
    </div>
  );
}
