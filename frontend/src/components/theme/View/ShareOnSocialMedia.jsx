const shareSocial = (event, socialmedia, url) => {
  event.preventDefault();

  let shareUrl =
    'https://www.facebook.com/sharer/sharer.php?u=https://www.centraalmuseum.nl/nl/collectie/bruna/bruna0383-nijntje-dick-bruna';

  switch (socialmedia) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'twitter':
      shareUrl = `http://twitter.com/share?&url=${url}`;
      break;
    case 'pinterest':
      shareUrl = `http://www.pinterest.com/pin/create/button/?url=${url}`;
      break;
    default:
      break;
  }

  const socialWindow = window.open(
    shareUrl,
    'social-media-popup',
    'height=450,width=600',
  );
  if (socialWindow.focus) {
    socialWindow.focus();
  }
};

export default shareSocial;
