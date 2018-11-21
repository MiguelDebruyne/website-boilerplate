import './cookies';
import './forms';
import './lazyload';
import './internal-links';



objectFitImages();

// Add jQuery class to body
if ($('body').hasClass('no-jquery')) {
    $('body').removeClass('no-jquery');
    $('body').addClass('jquery');
}

