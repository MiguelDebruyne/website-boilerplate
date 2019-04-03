import './menu';
import './cookies';
import './forms';
import './lazyload';
import './internal-links';

// Polyfill object-fit/object-position on <img>: IE9, IE10, IE11, Edge, Safari, .. See object-fit mixin in CSS
// objectFitImages();

// Add jQuery class to body
$('body').removeClass('no-jquery');
$('body').addClass('jquery');


// Listen to tab events to enable outlines (accessibility improvement)
document.body.addEventListener('keyup', function(e) {
    // Tab
    if (e.which === 9) {
        document.body.classList.remove('no-focus-outline');
    }
});

document.body.addEventListener('click', function(e) {
    document.body.classList.add('no-focus-outline');
});
