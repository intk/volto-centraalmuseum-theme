import React from 'react';
import shareSocial from '../View/ShareOnSocialMedia';
import { useLocation } from 'react-router-dom';

const SocialButtons = () => {
  let location = useLocation();
  let currentPath = location.pathname;

  return (
    <div className="social-buttons">
      <div className="button facebook">
        <a
          onClick={(event) =>
            shareSocial(
              event,
              'facebook',
              `https://new.centraalmuseum.nl${currentPath}`,
            )
          }
          className="share-btn-social"
          href="/#"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            id="Capa_1"
            x="0px"
            y="0px"
            viewBox="0 0 155.139 155.139"
            width="20"
            height="27"
          >
            <g>
              <path
                id="f_1_"
                d="M89.584,155.139V84.378h23.742l3.562-27.585H89.584V39.184   c0-7.984,2.208-13.425,13.67-13.425l14.595-0.006V1.08C115.325,0.752,106.661,0,96.577,0C75.52,0,61.104,12.853,61.104,36.452   v20.341H37.29v27.585h23.814v70.761H89.584z"
              ></path>
            </g>
          </svg>
        </a>
      </div>
      <div className="button twitter">
        <a
          onClick={(event) =>
            shareSocial(
              event,
              'twitter',
              `https://new.centraalmuseum.nl${currentPath}`,
            )
          }
          className="share-btn-social"
          href="/#"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="27"
            viewBox="0 0 28 28"
          >
            <path d="M24.253 8.756C24.69 17.08 18.297 24.182 9.97 24.62c-3.122.162-6.22-.646-8.86-2.32 2.702.18 5.375-.648 7.507-2.32-2.072-.248-3.818-1.662-4.49-3.64.802.13 1.62.077 2.4-.154-2.482-.466-4.312-2.586-4.412-5.11.688.276 1.426.408 2.168.387-2.135-1.65-2.73-4.62-1.394-6.965C5.574 7.816 9.54 9.84 13.802 10.07c-.842-2.738.694-5.64 3.434-6.48 2.018-.624 4.212.043 5.546 1.682 1.186-.213 2.318-.662 3.33-1.317-.386 1.256-1.248 2.312-2.4 2.942 1.048-.106 2.07-.394 3.02-.85-.458 1.182-1.343 2.15-2.48 2.71z"></path>
          </svg>
        </a>
      </div>
      <div className="button mail">
        <a
          href={`mailto:?subject=Centraal Museum Utrecht&body=https://www.centraalmuseum.nl${currentPath}`}
          target="blank"
          rel="noopener noreferrer"
        >
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 1000 1000"
            enable-background="new 0 0 1000 1000"
            width="20"
            height="27"
          >
            <g>
              <path d="M990,220c0-12.3-3.5-23.7-9.1-33.8L637.2,512.5l345.4,298.2c4.6-9.3,7.4-19.6,7.4-30.7V220z M611.7,536.8l-74.9,71.1c-10.2,9.7-23.5,14.5-36.8,14.5c-13.3,0-26.7-4.8-36.8-14.5l-75.4-71.7L37.4,835.2C49.2,844.4,63.9,850,80,850h840c14.8,0,28.5-4.7,39.9-12.6L611.7,536.8L611.7,536.8z M487.3,582.6c6.9,6.5,18.5,6.5,25.4,0l444.2-421.8c-10.7-6.7-23.3-10.8-36.9-10.8H80c-13.4,0-25.7,3.9-36.3,10.4L487.3,582.6L487.3,582.6z M19.4,185.6C13.6,195.8,10,207.5,10,220v560c0,9.8,2,19.1,5.7,27.6L362.3,512L19.4,185.6L19.4,185.6z"></path>
            </g>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default SocialButtons;
