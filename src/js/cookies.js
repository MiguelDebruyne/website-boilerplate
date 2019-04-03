var $cookiebar = $('#cookiebar');

$cookiebar.hide = function () {
    $cookiebar.css('transform', 'translateY(100%)');
};

$cookiebar.delete = function () {
    $cookiebar.remove();
    $(document).off('click', '#frmcookies button');
};

$('body').on('click', '#frmcookies button', function (e) {
    $.ajax({
        type: 'POST',
        url: this.form.action,
        data: {
            COOKIES: $(this).val(),
        },
        dataType: 'text',

        error: function () {
            $cookiebar.delete();
        },

        success: function(data) {
            $cookiebar.hide();

            setTimeout(function () {
                $cookiebar.delete();
            }, 1000);
        }
    });

    e.preventDefault(); // avoid to execute the actual submit of the form.
});
