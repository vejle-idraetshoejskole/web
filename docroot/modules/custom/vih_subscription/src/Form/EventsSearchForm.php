<?php
/**
 * @file
 * Contains \Drupal\vih_subscription\Form\ShortCourseOrderForm.
 */

namespace Drupal\vih_subscription\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Url;
use \Drupal\Core\Datetime\DrupalDateTime;

/**
 * Implements an example form.
 */
class EventsSearchForm extends FormBase {
  /**
   * Returns page title
   */
  public function getTitle($event) {
    return $this->t('Sign up @label', ['@label' => $event->label()]);
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'vih-subscription-event-search-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $date_from = \Drupal::request()->query->get('date_from');
    $date_to = \Drupal::request()->query->get('date_to');
    $available_spots = \Drupal::request()->query->get('available_spots');
    $now = new DrupalDateTime('now');
    $now->setTimezone(new \DateTimeZone(DATETIME_STORAGE_TIMEZONE));

    $form['filters'] = [
      '#type' => 'fieldset',
    ];

    $form['filters']['date_from'] = [
      '#prefix' => '<div class="form--inline clearfix">',
      '#title'         => t('Date from'),
      '#type'          => 'date',
      '#default_value' =>  isset($date_from) ? $date_from : $now->format('Y-m-d')
    ];

    $form['filters']['date_to'] = [
      '#title'         => t('Date to'),
      '#type'          => 'date',
      '#format' => 'd-m-Y',
      '#default_value' =>  isset($date_to) ? $date_to : '',
    ];
     $form['filters']['available_spots'] = [
      '#title'         => t('Available spots'),
      '#type'          => 'number',
      '#default_value' =>  isset($available_spots) ? $available_spots : 10,
       '#suffix' => '</div>'
    ];
    $form['filters']['submit'] = [
      '#type'  => 'submit',
      '#value' => t('Search')
    ];
    $form['filters']['reset'] = [
      '#type'  => 'submit',
      '#value' => t('Reset'),
      '#submit' => array([$this, 'resetForm']),

    ];

 return $form;
  }
  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $date_from = $form_state->getValue('date_from');
    $date_to = $form_state->getValue('date_to');
    $available_spots = $form_state->getValue('available_spots');
    $url = parse_url(\Drupal::request()->getRequestUri(), PHP_URL_PATH);
    $response = Url::fromUserInput($url . '?date_from=' . $date_from . '&date_to='. $date_to . '&available_spots=' . $available_spots);
    $form_state->setRedirectUrl($response);
  }

  /*
   * Reset button submit handler.
   */
  public function resetForm(array &$form, FormStateInterface $form_state) {
    $url = parse_url(\Drupal::request()->getRequestUri(), PHP_URL_PATH);
    $response = Url::fromUserInput($url);
    $form_state->setRedirectUrl($response);
  }
}
