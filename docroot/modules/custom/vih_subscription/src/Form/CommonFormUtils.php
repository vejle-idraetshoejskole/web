<?php

/**
 * @file
 * Contains Drupal\vih_subscription\Form\CommonFormUtils.
 */

namespace Drupal\vih_subscription\Form;

use Drupal\Core\Url;
use Drupal\Core\Link;

class CommonFormUtils {

  /**
   * Return link to the terms and conditions page by nid
   * 
   * @param int $nid
   * @param string $text
   * @return string
   */
  static function getTermsAndConditionsLink($nid, $text = 'terms and conditions') {

    $options = [
      'attributes' => [
        'target' => '_blank',
        'class' => ['use-ajax'],
        'data-dialog-class' => 'terms-and-conditions',
        'data-dialog-type' => 'modal',
      ]
    ];

    $terms_and_conditions_url = Url::fromRoute('vih_subscription.vih_node_modal', array('node' => $nid), $options);
    $terms_and_conditions_link = Link::fromTextAndUrl(t($text), $terms_and_conditions_url);
    $terms_and_conditions_link = $terms_and_conditions_link->toRenderable();
    $terms_and_conditions_link = render($terms_and_conditions_link);

    return $terms_and_conditions_link;
  }

}
