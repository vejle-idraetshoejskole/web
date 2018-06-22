<?php

namespace Drupal\vies_application\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;

/**
 * Application controller.
 */
class ApplicationController extends ControllerBase {

  /**
   * Success page callback.
   */
  public function success() {
    $build = [
      '#theme' => 'vies_application_submit_message',
      '#title' => 'Tak for din tilmelding!',
    ];

    return $build;
  }

  /**
   * Error page callback.
   */
  public function error() {
    $build['page'] = [
      '#theme' => 'vies_application_submit_message',
      '#title' => 'Åh - en fejl opstod!',
      '#message' => 'Send venligst din ansøgning til os via mail',
    ];

    return $build;
  }
}
