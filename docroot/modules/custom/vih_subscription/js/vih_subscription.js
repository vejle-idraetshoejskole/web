(function ($, Drupal, drupalSettings) {
  'use strict';

  Drupal.behaviors.accordionClassSelection = {
    attach: function (context, settings) {
      var $buttons = $('.btn-radio-select').once('btn-radio-select');

      // Run through all buttons to check if any has a selected radio button
      // inside If so, we can add an active class to the button
      $buttons.each(function (index, item) {
        var $element = $(this),
            $radio = $element.find('input[type=radio]'),
            $class_collection = $element.parents('.panel'),
            $class_collection_heading = $class_collection.find('.panel-heading'),
            $class = $element.parents('.entity-list-advanced--class');

        if ($radio.is(':checked')) {
          $element.addClass('active');

          // Move the selected class outside of panel-body so it's always
          // displayed.
          $class
              .addClass('selected-class')
              .detach()
              .insertAfter($class_collection_heading);
        }
      });

      $buttons.on('click', function (event) {
        if ($(this).hasClass('disabled')) {
            return;
        }

        var $element = $(this),
            $period = $element.parents('.panel-group'),
            $class_collection = $element.parents('.panel'),
            $class_collection_heading = $class_collection.find('.panel-heading'),
            $class_collection_body = $class_collection.find('.panel-body'),
            $class_collection_buttons = $class_collection.find('.btn-radio-select'),
            $next_class_collection = $class_collection.next('.panel'),
            $next_period = $period.parents('.boxy--course-periods').next('.boxy--course-periods'),
            $next_period_class_collection = $next_period.find('.panel').first(),
            $class = $element.parents('.entity-list-advanced--class');

        $class_collection_buttons
            .removeClass('active')
            .find('input[type=radio]')
            .prop('checked', false);

        // Deselect class
        if ($class.hasClass('selected-class')) {

          $class.slideUp(300, function() {
            var $element = $(this),
                $class_collection = $element.parents('.panel'),
                $class_collection_body = $class_collection.find('.panel-body');

            // Move the selected class back in the body again
            $element
                .removeClass('selected-class')
                .detach()
                .appendTo($class_collection_body)
                .show();

            $class_collection
                .find('.panel-collapse')
                .collapse('show');
          });
        }

        // Select class
        else {
          var $selected_class = $class_collection.find('.selected-class');

          // Move the selected class back in the body again
          if ($selected_class.length) {

            $selected_class
                .removeClass('selected-class')
                .detach()
                .appendTo($class_collection_body);
          }

          // Move the current class outside of panel-body so it's always
          // displayed.
          $class
              .addClass('selected-class')
              .detach()
              .insertAfter($class_collection_heading);

          // Collapse, decollapse panels
          $class_collection
              .find('.panel-collapse')
              .collapse('hide');

          // Next collection exists
          if ($next_class_collection.length) {
            // There is classes inside the collection
            if ($next_class_collection.find('.entity-list-advanced--class').length) {
              $next_class_collection
                  .find('.panel-collapse')
                  .collapse('show');
            }
          }

          // No more class collections inside this period (look inside the next period)
          else {
            // There is classes inside the collection
            if ($next_period_class_collection.find('.entity-list-advanced--class').length) {
              $next_period_class_collection
                  .find('.panel-collapse')
                  .collapse('show');
            }
          }

          // Button
          $element
              .addClass('active')
              .find('input[type=radio]')
              .prop('checked', true);
        }

        $element.find('input[type=radio]').change();
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
