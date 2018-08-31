<?php

namespace Drupal\vies_valuation\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\Entity\Node;
use Drupal\Component\Render\FormattableMarkup;
use Drupal\Core\Url;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\TermInterface;
use Drupal\vies_application\ApplicationHandler;

/**
 * Class ValuationForm.
 */
class ValuationForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'valuation_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, TermInterface $taxonomy_term = NULL) {
    $form['#prefix'] = '<div id="valuation-form-wrapper">';
    $form['#suffix'] = '</div>';
    $form['#theme'] = 'region_sectioned_fluid';
    $class = $taxonomy_term;
    $applications = \Drupal::entityQuery('node')
      ->condition('type', 'vies_application_form')
      ->condition('field_vies_class', $class->id())
      ->execute();

    if (empty($class) || empty($applications)) {
      $form[] = [
        '#markup' => 'Der er ingen ansøgning at vise',
      ];
      return $form;
    }

    $form['filters'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['row']],
    ];

    $available_period = [];
    $available_courses = [];
    $available_year_of_bitrh = [];
    foreach (Node::loadMultiple($applications) as $application) {
      $course = $application->field_vies_course->referencedEntities()[0];
      $available_courses[$course->id()] = $course->getTitle();

      $period = $application->field_vies_period->referencedEntities()[0];
      $available_period[$period->id()] = $period->getTitle();

      if (!empty($application->field_vies_birthday[0]->value)
        && $dates = \DateTime::createFromFormat('y', substr($application->field_vies_birthday[0]->value, 3, 2))) {
        $year_of_bitrh = $dates->format('Y');
        $available_year_of_bitrh[$year_of_bitrh] = $year_of_bitrh;
      }
    }

    $course_options = $available_courses;
    $course_default_value = $form_state->getValue('course');
    if (count($course_options) > 1) {
      $course_options = ['' => 'Årgang'] + $course_options;
    }
    $form['filters']['course'] = [
      '#type' => 'select',
      '#options' => $course_options,
      '#placeholder' => 'Årgang',
      '#default_value' => $course_default_value,
      '#ajax' => [
        'callback' => '::ajaxUpdate',
        'wrapper' => 'valuation-form-wrapper',
      ],
      '#wrapper_attributes' => ['class' => ['col-md-3']],
    ];

    // Reset form when course has been changed.
    if ($form_state->get('course') != $course_default_value) {
      $this->removeInputValue('period', $form_state);
      $this->removeInputValue('labels', $form_state);
      $this->removeInputValue('statuses', $form_state);
    }
    $form_state->set('course', $course_default_value);

    $period_options = $available_period;

    if (!empty($course_default_value)) {
      $period_options = [];
      $course = Node::load($course_default_value);
      $periods = $course->field_vih_course_periods->referencedEntities();

      foreach ($periods as $period) {
        $period_options[$period->id()] = $period->getTitle();
      }
    }

    $periods_default_value = $form_state->getValue('period');
    if (count($period_options) > 1) {
      $period_options = ['' => 'Klassetrin'] + $period_options;
    }
    $form['filters']['period'] = [
      '#type' => 'select',
      '#options' => $period_options,
      '#placeholder' => 'Klassetrin',
      '#default_value' => $periods_default_value,
      '#ajax' => [
        'callback' => '::ajaxUpdate',
        'wrapper' => 'valuation-form-wrapper',
      ],
      '#wrapper_attributes' => ['class' => ['col-md-3']],
    ];

    $yb_default_value = $form_state->getValue('yb');
    $form['filters']['yb'] = [
      '#type' => 'select',
      '#options' => ['' => 'Fødselsår'] + $available_year_of_bitrh,
      '#placeholder' => 'Fødselsår',
      '#default_value' => $yb_default_value,
      '#ajax' => [
        'callback' => '::ajaxUpdate',
        'wrapper' => 'valuation-form-wrapper',
      ],
      '#wrapper_attributes' => ['class' => ['col-md-3']],
    ];

    $gender_default_value = $form_state->getValue('gender');
    $form['filters']['gender'] = [
      '#type' => 'select',
      '#options' => ['' => 'Køn'] + ApplicationHandler::$gender,
      '#placeholder' => 'Køn',
      '#default_value' => $gender_default_value,
      '#ajax' => [
        'callback' => '::ajaxUpdate',
        'wrapper' => 'valuation-form-wrapper',
      ],
      '#wrapper_attributes' => ['class' => ['col-md-3']],
    ];

    $headers = ['Navn'];
    $questions = $class->field_vies_questions->referencedEntities();

    foreach ($questions as $question) {
      $headers[] = $question->getName();
    }
    $rows = [];

    $valuated = [];
    foreach (Node::loadMultiple($applications) as $application) {
      if (!empty($course_default_value)
        && $course_default_value !=
        $application->field_vies_course->getValue()[0]['target_id']) {
        continue;
      }

      if (!empty($periods_default_value)
        && $periods_default_value != $application->field_vies_period->getValue()[0]['target_id']) {
        continue;
      }

      if (!empty($gender_default_value)
        && $gender_default_value != $application->field_vies_gender->getValue()[0]['value']) {
        continue;
      }

      if (!empty($yb_default_value)
        && !empty($application->field_vies_birthday[0]->value)
        && $dates = \DateTime::createFromFormat('y', substr($application->field_vies_birthday[0]->value, 3, 2))) {
        if ($yb_default_value != $dates->format('Y')) {
          continue;
        }
      }

      if (!empty($application->field_vies_label->getValue())
        || !empty($application->field_vies_status->getValue())) {
        $valuated[] = $application;
        continue;
      }

      $row = [];
      $row[] = new FormattableMarkup('@firstname @lastname', [
        '@firstname' => $application->field_vies_first_name->getValue()[0]['value'],
        '@lastname' => $application->field_vies_last_name->getValue()[0]['value'],
      ]);

      foreach ($application->field_vies_class_questions->referencedEntities() as $class_questions) {
        $question_reference = $class_questions->field_question_reference->getValue();
        if (empty($question_reference[0]['target_id'])) {
          continue;
        }
        $answers[$question_reference[0]['target_id']] = $class_questions->field_answer->getValue()[0]['value'];
      }

      foreach ($questions as $question) {
        $answer = '';
        if (isset($answers[$question->id()])) {
          $answer = $answers[$question->id()];
        }
        $row[] = $answer;
      }

      $row[] = \Drupal::l('Sæt labels og status', Url::fromRoute(
        'entity.node.edit_form',
        ['node' => $application->id()],
        ['query' => ['destination' => '/taxonomy/term/' . $class->id(). '/valuation']]
      ));

      $rows[] = $row;

    }

    $headers[] = 'Handlinger';

    $form['applications'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'studentsWrapper'],
      0 => ['#markup' => 'Der er ingen ansøgning til denne klasse'],
    ];

    if (!empty($rows)) {
      $form['applications'] = [
        '#type' => 'table',
        '#attributes' => ['id' => 'studentsWrapper'],
        '#header' => $headers,
        '#rows' => $rows,
      ];
    }

    // Valuated applications.
    // Used to show checkboxes options.
    $available_labels = [];
    $available_statuses = [];

    // Used for filter applications.
    $availability_labels = [];
    $availability_statuses = [];
    foreach ($valuated as $application) {
      $labels = $application->field_vies_label->getValue();
      foreach ($labels as $val) {
        $availability_labels[$val['target_id']][] = $application->id();
        if (isset($available_labels[$val['target_id']])) {
          continue;
        }
        $term = Term::load($val['target_id']);
        $available_labels[$term->id()] = $term->getName();

      }

      $statuses = $application->field_vies_status->getValue();
      foreach ($statuses as $val) {
        $availability_statuses[$val['target_id']][] = $application->id();
        if (isset($available_statuses[$val['target_id']])) {
          continue;
        }
        $term = Term::load($val['target_id']);
        $available_statuses[$term->id()] = $term->getName();
      }
    }

    $form['valuated'] = [
      '#type' => 'container',
      '#prefix' => '<div id="valuated-application-form-wrapper">',
      '#suffix' => '</div>',
    ];

    $form['valuated']['applications'] = [
      '#markup' => 'Der er ingen værdiansatte ansøgninger at vise',
    ];

    if (empty($valuated)) {
      return $form;
    }

    $form['valuated']['filters'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['row', 'container-inline']],
      '#weight' => -10,
    ];

    $labels_default_value = $form_state->getValue('labels');
    if (count($available_labels) > 1) {
      $form['valuated']['filters']['labels'] = [
        '#type' => 'checkboxes',
        '#title' => 'Labels',
        '#options' => $available_labels,
        '#default_value' => empty($labels_default_value) ? [] : $labels_default_value,
        '#ajax' => [
          'callback' => '::ajaxValuatedUpdate',
          'wrapper' => 'valuated-application-form-wrapper',
        ],
        '#prefix' => '<div class="col-md-4">',
        '#suffix' => '</div>',
      ];
    }

    $statuses_default_value = $form_state->getValue('statuses');
    if (count($available_statuses) > 1) {
      $form['valuated']['filters']['statuses'] = [
        '#type' => 'checkboxes',
        '#title' => 'Statuses',
        '#options' => $available_statuses,
        '#default_value' => empty($statuses_default_value) ? [] : $statuses_default_value,
        '#ajax' => [
          'callback' => '::ajaxValuatedUpdate',
          'wrapper' => 'valuated-application-form-wrapper',
        ],
        '#prefix' => '<div class="col-md-4">',
        '#suffix' => '</div>',
      ];
    }

    $headers = ['Navn'];

    // Use first question as label.
    $questions = $class->field_vies_questions->referencedEntities();
    $question = array_shift($questions);
    $headers[] = $question->getName();

    $headers[] = 'Labels';
    $headers[] = 'Status';
    $headers[] = 'Handlinger';

    $rows = [];

    foreach ($valuated as $application) {
      $excluded = FALSE;
      if (!empty($labels_default_value)) {
        foreach ($labels_default_value as $label) {
          if ($label !== 0 && !in_array($application->id(), $availability_labels[$label])) {
            $excluded = TRUE;
          }
        }
      }

      if (!empty($statuses_default_value)) {
        foreach ($statuses_default_value as $status) {
          if ($status !== 0 && !in_array($application->id(), $availability_statuses[$status])) {
            $excluded = TRUE;
          }
        }
      }

      if ($excluded) {
        continue;
      }

      $row = [];
      $row[] = new FormattableMarkup('@firstname @lastname', [
        '@firstname' => $application->field_vies_first_name->getValue()[0]['value'],
        '@lastname' => $application->field_vies_last_name->getValue()[0]['value'],
      ]);

      $answer = '';
      foreach ($application->field_vies_class_questions->referencedEntities() as $class_questions) {
        $question_reference = $class_questions->field_question_reference->getValue();
        if (empty($question_reference[0]['target_id']) || $question_reference[0]['target_id'] != $question->id()) {
          continue;
        }
        $answer = $class_questions->field_answer->getValue()[0]['value'];
      }
      $row[] = $answer;

      $labels = [];
      foreach ($application->field_vies_label->getValue() as $val) {
        $labels[] = $available_labels[$val['target_id']];
      }
      $row[] = implode(', ', $labels);

      $statuses = [];
      foreach ($application->field_vies_status->getValue() as $val) {
        $statuses[] = $available_statuses[$val['target_id']];
      }
      $row[] = implode(', ', $statuses);
      $row[] = \Drupal::l($this->t('Edit'), Url::fromRoute(
        'entity.node.edit_form',
        ['node' => $application->id()],
        ['query' => ['destination' => '/taxonomy/term/' . $class->id(). '/valuation']]
      ));

      $rows[] = $row;

    }

    $form['valuated']['applications'] = [
      '#type' => 'table',
      '#attributes' => ['class' => ['valuated-applications']],
      '#header' => $headers,
      '#rows' => $rows,
    ];

    return $form;
  }

  /**
   * Ajax callback.
   */
  public function ajaxUpdate(array $form, FormStateInterface $form_state) {
    return $form;
  }

  /**
   * Ajax valuated callback.
   */
  public function ajaxValuatedUpdate(array $form, FormStateInterface $form_state) {
    return $form['valuated'];
  }


  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
  }

  /**
   * Helper function to remove value from user input.
   *
   * @param string $key
   *   The remove value key.
   * @param FormStateInterface $form_state
   *   Form state object.
   */
  private function removeInputValue($key, FormStateInterface $form_state) {
    $input = $form_state->getUserInput();
    if (!empty($input[$key])) {
      unset($input[$key]);
    }
    $form_state->setUserInput($input);
    $form_state->unsetValue($key);
  }
}
