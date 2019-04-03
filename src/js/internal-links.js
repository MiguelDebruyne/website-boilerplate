var scrollSpeed = 600;

function scrollToElement (target) {
    $('html, body').animate({
        scrollTop: target.offset().top - 50
    }, 1000).promise().done(function() {
        // Called when the animation in total is complete
        // Callback after animation
        // Must change focus!
        var $target = $(target);
        $target.focus();
        if ($target.is(':focus')) { // Checking if the target was focused
            return false;
        } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
        }

        // Remove ugly outline while staying focussed
        $target.css('outline', 'none');
    });
}


// Select all links with hashes
$('a[href*="#"]')
    // Remove links that don't actually link to anything
    .not('[href="#"]')
    .not('[href="#0"]')
    .click(function(event) {
        // On-page links
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
            &&
            location.hostname == this.hostname
        ) {
            // Figure out element to scroll to
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            // Does a scroll target exist?
            if (target.length) {
                // Only prevent default if animation is actually gonna happen
                event.preventDefault();

                scrollToElement(target);

                // Change address bar
                window.history.pushState('data', '', location.origin + location.pathname + '/#' + target.attr('id'));
            }
        }
    });


var hash = window.location.hash;

if (hash != '' && $(hash).length > 0) {
    setTimeout(function(){
        $('html, body').scrollTop(0);
        scrollToElement($(window.location.hash));
    }, 0);
}



// function scrollToElement (target) {
//     $('html, body').animate({
//         scrollTop: target.offset().top - 50
//     }, 1000, function() {
//         // Callback after animation
//         // Must change focus!
//         var $target = $(target);
//         $target.focus();
//         if ($target.is(':focus')) { // Checking if the target was focused
//             return false;
//         } else {
//             $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
//             $target.focus(); // Set focus again
//         }

//         // Remove ugly outline while staying focussed
//         $target.css('outline', 'none');
//     });
// }
