<?php

namespace Drupal\bellcom_common\Plugin\Field\FieldFormatter;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\Plugin\Field\FieldFormatter\EntityReferenceEntityFormatter;

/**
 * Plugin implementation of custom 'vih ls price list view' formatter.
 *
 * @FieldFormatter(
 *   id = "vih_lc_price_list_view",
 *   label = @Translation("VIH Long course price list view"),
 *   description = @Translation("VIH Display the log courses rendered by entity_view()."),
 *   field_types = {
 *     "entity_reference"
 *   }
 * )
 */
class VihLongCoursePriceListFormatter extends EntityReferenceEntityFormatter {

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    if (empty($items->getValue()) && $items->getFieldDefinition()->getTargetBundle() == 'list_of_long_course_prices') {
      $now = new DrupalDateTime('now');
      $now->setTimezone(new \DateTimeZone(DATETIME_STORAGE_TIMEZONE));
      $query = \Drupal::entityQuery('node')
        ->condition('type', 'vih_long_cource')
        ->condition('field_vih_lc_start_date', $now->format(DATETIME_DATETIME_STORAGE_FORMAT), '>=')
        ->sort('field_vih_event_start_date', 'ASC');
      $nids = $query->execute();
      $values = [];
      $entity = $items->getEntity();
      foreach ($nids as $nid) {
        $values[] = [
          'target_id' => $nid,
        ];
      }
      if (!empty($nids)) {
        $items = \Drupal::service('plugin.manager.field.field_type')->createFieldItemList($entity->getTranslation($langcode), 'field_vih_lc_list', $values);
        $items->filterEmptyItems();
        $this->prepareView([$items]);
      }
    }
    $elements = parent::viewElements($items, $langcode);
    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition) {
    if ($field_definition->getTargetBundle() != 'list_of_long_course_prices') {
      return FALSE;
    }
    return parent::isApplicable($field_definition);
  }

}
