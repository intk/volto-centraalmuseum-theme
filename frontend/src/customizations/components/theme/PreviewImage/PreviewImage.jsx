import React from 'react';
import { flattenToAppURL } from '@plone/volto/helpers';
import { Placeholder, Image } from 'semantic-ui-react';
import cx from 'classnames';

// const empty =
//   'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
export default function PreviewImage({
  item,
  size,
  isFallback = false,
  showPlaceholder = false,
  className,
}) {
  const url = flattenToAppURL(
    `${item?.['@id']}/@@${isFallback ? 'fallback-image' : 'images'}/${
      item?.image_field || 'preview_image'
    }/${size}`,
  );

  return showPlaceholder ? (
    <Placeholder>
      <Placeholder.Image square></Placeholder.Image>
    </Placeholder>
  ) : (
    <>
      <Image
        src={url}
        // style={{ backgroundImage: `url("${url}")` }}
        size={size}
        alt={item?.title}
        className={cx('preview-image', size, className)}
      />
    </>
  );
}
