import React from 'react';
import { Container } from 'semantic-ui-react';
import './css/blogwriterview.less';
import { BodyClass } from '@plone/volto/helpers';
import { flattenToAppURL } from '@plone/volto/helpers';
import { SeeMoreNewsItem } from '../../index';
import {
  hasBlocksData,
  // flattenHTMLToAppURL,
  // getBaseUrl,
} from '@plone/volto/helpers';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';

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

export default function BlogWriterView(props) {
  const src = props.content.preview_image
    ? flattenToAppURL(`${props.content.preview_image.download}`)
    : '';

  const filteredContent = filterBlocks(props.content, ['title', 'description']);

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
      <div className="blog-writer-body">
        {hasBlocksData(props.content) &&
        props.content.blocks_layout.items.length > 0 ? (
          <Container>
            <RenderBlocks {...props} content={filteredContent} />
          </Container>
        ) : (
          ''
        )}
      </div>
      <Container>
        <SeeMoreNewsItem {...props} />
      </Container>
    </div>
  );
}
