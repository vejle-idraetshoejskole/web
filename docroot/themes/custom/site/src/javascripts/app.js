// Document ready
(function ($) {
  'use strict';

  // Flatten structure of modals, so they are not nested.
  // Ex. .modal > .modal > .modal
  var $modals = $('.modal');
  $('body').append($modals);

  // Enable layout
  layout.init();

  // Slinky
  $('.slinky-menu')
      .find('ul, li, a')
      .removeClass();

  $('.region-mobile-header-navigation .slinky-menu').slinky({
    title: true,
    label: ''
  });

  // Table
  $('.layout__content').find('table')
      .addClass('table table-striped table-hover');

  // Notify
  var $notifications = $('.notify');
  if ($notifications.length) {

    $notifications.each(function(index, val) {
      var $document = $('.layout__document'),
          $region = $('.region-notify'),
          $element = $(this),
          cookie_id = 'notify_id_' + $element.attr('id'),
          $close = $element.find('.notify__close');

      // Flex magic - fixing display: block on fadeIn (see: https://stackoverflow.com/questions/28904698/how-fade-in-a-flex-box)
      $element.css('display', 'flex').hide();

      // No cookie has been set yet
      if (! Cookies.get(cookie_id)) {

        // Fade the element in
        $element
            .delay(2000)
            .fadeIn(function() {
              var height = $region.outerHeight(true);

              $document.css('padding-bottom', height);
            });
      }

      // Closed
      $close.on('click', function(event) {
        $element.fadeOut(function() {
          $document.css('padding-bottom', 0);
        });

        // Set a cookie, to stop this notification from being displayed again
        Cookies.set(cookie_id, true);
      });
    });
  }

  $("#toggle_mobile_menu").click(function (event) {
    $('#main-menu').toggleClass('mobile-menu-open');
    $('.layout__document').toggleClass('mobile-menu-open');
  });

  //Show search form block
  $(".search-button").click(function (event) {
    event.preventDefault();

    if ($("#search-form-popover").hasClass("hidden")) {
      $("#search-form-popover").removeClass('hidden');
      $(".form-control").focus();
    }
  });

  //Hide search form block
  $(document).click(function (event) {
    if (!$(event.target).closest('#search-form-popover').length && !$(event.target).closest('.search-button').length) {
      if (!$("#search-form-popover").hasClass("hidden")) {
        $("#search-form-popover").addClass('hidden');
      }
    }
  });

  //Improving usability for menudropdowns for mobile devices
  if (!!('ontouchstart' in window)) {//check for touch device
    $('li.dropdown.layout-navigation__dropdown').find('> a').click(function (e) {
      if ($(this).parent().hasClass("expanded")) {
        //$(this).parent().removeClass("expanded");
      }
      else {
        e.preventDefault();
        $(this).parent().addClass("expanded");
      }
    });
  }
  else {//keeping it compatible with desktop devices
    $('li.dropdown.layout-navigation__dropdown').hover(
        function (e) {
          $(this).addClass("expanded");
        }, function (e) {
          $(this).removeClass("expanded");
        }
    );
  }

  // Toggler
  $('[data-toggler]').on('click', function(event) {
    event.preventDefault();

    var $element = $(this),
        target = $element.attr('data-toggler'),
        $parent = $element.parents('.toggler'),
        $target = $parent.find(target),
        $all_toggle_buttons = $parent.find('[data-toggler]'),
        $toggle_button = $parent.find('[data-toggler="' + target + '"]'),
        $all_content = $parent.find('.toggler__content');

    // Remove all active togglers
    $all_toggle_buttons
        .parent()
        .removeClass('active');

    $all_content.removeClass('active');

    // Show
    $toggle_button.parent().addClass('active');
    $target.addClass('active');
  });

  $(".toggler").each(function (index) {
      $(this).find('.toggler__button').first().trigger('click');
  });

  // Use multiple modals (http://jsfiddle.net/likhi1/wtj6nacd/)
  $(document).on({
    'show.bs.modal': function () {
      var zIndex = 1040 + (10 * $('.modal:visible').length);
      $(this).css('z-index', zIndex);
      setTimeout(function () {
        $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
      }, 0);
    },
    'hidden.bs.modal': function () {
      if ($('.modal:visible').length > 0) {
        // restore the modal-open class to the body element, so that scrolling
        // works properly after de-stacking a modal.
        setTimeout(function () {
          $(document.body).addClass('modal-open');
        }, 0);
      }
    }
  }, '.modal');

})(jQuery);
