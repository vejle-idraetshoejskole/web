<?php

namespace Drupal\vih_subscription\Controller;

use Drupal\Component\Render\FormattableMarkup;
use Drupal\Core\Access\AccessResultAllowed;
use Drupal\Core\Access\AccessResultForbidden;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Link;
use Drupal\Core\Url;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * Available spots controller.
 */
class AvailableSpots extends ControllerBase {

  /**
   * Default.
   */
  public function content() {
    return new RedirectResponse(Url::fromRoute('vih_subscription.admin.orders.available_spots.events')->toString());
  }

  /**
   * Events available spots list.
   */
  public function events() {
    $now = new DrupalDateTime('now');
    $now->setTimezone(new \DateTimeZone(DATETIME_STORAGE_TIMEZONE));

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'event')
      ->condition('field_vih_event_start_date', $now->format(DATETIME_DATETIME_STORAGE_FORMAT), '>=')
      ->sort('field_vih_event_start_date', 'ASC');
    $nids = $query->execute();

    $headers = [
      'Title',
      'Available spots',
    ];
    $rows = [];

    foreach ($nids as $nid) {
      $node = Node::load($nid);
      $available_spots = 'N/A';

      $stock_amount = $node->field_vih_event_persons_limit->value;
      if (!empty($stock_amount)) {
        $available_spots = $stock_amount - VihSubscriptionUtils::calculateSubscribedPeopleNumber($node);
      }
      $rows[] = [
        Link::fromTextAndUrl($node->title->value, $node->toUrl('canonical', ['language' => $node->language()])),
        $available_spots,
      ];
    }
    $build = array(
      '#theme' => 'table',
      '#header' => $headers,
      '#rows' => $rows,
      '#empty' => $this->t('There are no future events'),
    );

    return $build;
  }

  /**
   * Events available spots list.
   */
  public function short_courses() {
    $now = new DrupalDateTime('now');
    $now->setTimezone(new \DateTimeZone(DATETIME_STORAGE_TIMEZONE));

    $query = \Drupal::entityQuery('node')
      ->condition('type', 'vih_short_course')
      ->condition('field_vih_sc_start_date', $now->format(DATETIME_DATETIME_STORAGE_FORMAT), '>=')
      ->sort('field_vih_sc_start_date', 'ASC');
    $nids = $query->execute();

    $headers = [
      'Title',
      'Group',
      'Option',
      'Available',
      'Pending',
      'Confirmed',
      'Total',
    ];
    $rows = [];
    foreach ($nids as $nid) {
      $node = Node::load($nid);
      $row = [];
      $row[] = [
        'data' => Link::fromTextAndUrl($node->title->value, $node->toUrl('canonical', ['language' => $node->language()])),
      ];
      foreach ($node->field_vih_sc_option_groups->referencedEntities() as $optionGroup) {
        $option_group_row = $row;
        $row = [''];
        $option_group_row[] = [
          'data' => $optionGroup->field_vih_og_title->value,
        ];
        foreach ($optionGroup->field_vih_og_options->referencedEntities() as $optionDelta => $option) {
          $option = \Drupal::service('entity.repository')->getTranslationFromContext($option);
          $oprion_row = $option_group_row;
          $option_group_row = ['', ''];
          $oprion_row[] = [
            'data' => $option->field_vih_option_title->value,
          ];
          if (!empty($option->field_vih_option_stock_amount->value)) {
            $confirmed = VihSubscriptionUtils::calculateOptionUsageCount($node, $optionGroup, $option);
            $pending = VihSubscriptionUtils::calculateOptionUsageCount($node, $optionGroup, $option, 'pending');
            $oprion_row[] = $option->field_vih_option_stock_amount->value - $confirmed;
            $oprion_row[] = $pending;
            $oprion_row[] = $confirmed;
            $oprion_row[] = $option->field_vih_option_stock_amount->value;
            $rows[] = $oprion_row;
          }
        }
      }
    }
    $build = array(
      '#theme' => 'table',
      '#header' => $headers,
      '#rows' => $rows,
      '#empty' => $this->t('There are no future short courses'),
    );

    return $build;
  }

  /**
   * Check function to allow access to events available spots list based on
   * present content type in system.
   */
  function checkAccessEvents() {
    return empty(NodeType::load('event')) ? new AccessResultForbidden() : new AccessResultAllowed();
  }

  /**
   * Check function to allow access to short courses available spots list
   * based on present content type in system.
   */
  function checkAccessShortCourses() {
    return empty(NodeType::load('vih_short_course')) ? new AccessResultForbidden() : new AccessResultAllowed();
  }

}