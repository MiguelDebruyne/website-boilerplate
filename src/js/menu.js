import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock/lib/bodyScrollLock.es6.js';


var $mainNav = $('#main-nav');
var $btnMenu = $('#btn-mobile-menu');
var mainNav = document.getElementById('main-nav');
$mainNav.open = false;

function openMobileMenu () {
    $mainNav.open = true;
    $mainNav.addClass('open');
    disableBodyScroll(mainNav);
    $btnMenu.addClass('is-active');
}


function closeMobileMenu () {
    $mainNav.open = false;
    $mainNav.removeClass('open');
    enableBodyScroll(mainNav);
    $btnMenu.removeClass('is-active');
}


function toggleMobileMenu () {
    if (!$mainNav.open) {
        openMobileMenu();
    } else {
        closeMobileMenu();
    }
}


$btnMenu.click(function() {
    toggleMobileMenu();
});


// var menuJustOpened = false;

// $('.btn-close-mobile-menu').click(function () {
//     closeMobileMenu();
// });


// $(document).click(function (e) {
//     console.log(e.target);
//     if (menuJustOpened) {
//         menuJustOpened = false;
//         return;
//     }

//     var d = e.target;

//     // if this node is not the one we want, move up the dom tree
//     while (d != null && d['id'] != 'main-nav') {
//         d = d.parentNode;
//     }

//     // at this point we have found our containing div or we are out of parent nodes
//     var insideMyDiv = (d != null && d['id'] == 'main-nav');

//     if (!insideMyDiv) {
//         closeMobileMenu();
//     }
// });
