import React, { useState, useEffect } from 'react';
import { injectIntl } from 'react-intl';
import './css/vimeoblock.less';

const VimeoBlockView = (props) => {
  const [videoLink, setVideoLink] = useState('');

  useEffect(() => {
    if (props.data.VideoLink) {
      const linkWithParams = `${props.data.VideoLink}?dnt=1&loop=1&background=1`;
      setVideoLink(linkWithParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="vimeo-block">
      <div className="video-wrapper">
        <div className="first-frame" style={{ width: '100%' }}>
          <img
            style={{ width: '100%' }}
            src={`${props.data.FirstFrame?.[0]?.['@id']}/${props?.data?.FirstFrame?.[0].image_scales?.image?.[0].download}`}
            alt="homepage-video-screenshot"
          ></img>
        </div>
        <iframe
          frameborder="0"
          webkitAllowFullScreen
          mozallowfullscreen
          allowfullscreen
          allow="autoplay; fullscreen;"
          data-ready="true"
          src={videoLink}
          title="video"
        ></iframe>
      </div>
      <div className="vimeo-buttons">
        <ul className="arrow-lists">
          <li>
            {props.data.button1 && (
              <a className="link" href={props.data.button1link}>
                {props.data.button1}
              </a>
            )}
          </li>
          <li>
            {props.data.button2 && (
              <a className="link" href={props.data.button2link}>
                {props.data.button2}
              </a>
            )}
          </li>
          <li>
            {props.data.button3 && (
              <a className="link" href={props.data.button3link}>
                {props.data.button3}
              </a>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default injectIntl(VimeoBlockView);
