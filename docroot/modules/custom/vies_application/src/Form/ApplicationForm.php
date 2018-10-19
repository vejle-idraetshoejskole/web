<?php

namespace Drupal\vies_application\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Locale\CountryManager;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\vies_application\ApplicationHandler;
use Drupal\vih_subscription\Form\CommonFormUtils;
use Drupal\vih_subscription\Form\SubscriptionsGeneralSettingsForm;

/**
 * Class ApplicationForm.
 */
class ApplicationForm extends FormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'application_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-accordion-class-selection';
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-terms-and-conditions-modal';
    $form['#theme'] = 'vies_application_form';

    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);

    $nids = \Drupal::entityQuery('node')->condition('type', 'vih_long_cource')->execute();
    $options = [];
    foreach (Node::loadMultiple($nids) as $node) {
      $options[$node->id()] = $node->getTitle();
    }

    $default_value = $form_state->getValue('course');
    if (empty($default_value)) {
      $default_value = empty($options) ? NULL : key($options);
    }
    $form['course'] = [
      '#type' => 'select',
      '#title' => 'Skoleår',
      '#options' => $options,
      '#empty_label' => 'None',
      '#default_value' => $default_value,
      '#required' => TRUE,
      '#ajax' => [
        'callback' => '::updateAvailablePeriods',
        'wrapper' => 'availablePeriods',
      ],
    ];
    $nid = $default_value;

    // Empty wrapper for periords.
    $form['periodsWrapper'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'availablePeriods'],
    ];

    if (empty($nid)) {
      return $form;
    }

    // Reset form when course has been changed.
    if ($form_state->get('course') != $nid) {
      $this->removeInputValue('period', $form_state);
    }
    $form_state->set('course', $nid);
    $course = Node::load($nid);
    $periods = $course->field_vih_course_periods->referencedEntities();
    $options = [];
    foreach ($periods as $period) {
      $options[$period->id()] = $period->getTitle();
    }

    $periods_default_value = $form_state->getValue('period');
    if (empty($periods_default_value)) {
      $periods_default_value = empty($options) ? NULL : key($options);
    }
    $form['periodsWrapper']['period'] = [
      '#type' => 'select',
      '#title' => 'Klasse',
      '#options' => $options,
      '#empty_label' => 'None',
      '#default_value' => $periods_default_value,
      '#required' => TRUE,
      '#ajax' => [
        'callback' => '::updateCoursesPeriods',
        'wrapper' => 'coursePeriods',
      ],
    ];

    $form['periodsWrapper']['coursePeriods'] = [
      '#type' => 'container',
      '#theme' => 'vies_application_periods',
      '#attributes' => ['id' => 'coursePeriods'],
      // Empty wrapper for questions.
      'questions' => [
        '#type' => 'container',
        '#attributes' => ['id' => 'questions'],
        '#tree' => TRUE,
      ],
    ];

    $nid = $periods_default_value;
    $reset_periods = FALSE;
    if (!empty($nid)) {
      if ($form_state->get('period') != $nid) {
        $reset_periods = TRUE;
      }
      $form_state->set('period', $nid);
      $course_period = Node::load($nid);
      $period_delta = 0;
      // Composing available classes selection per CourseSlot for each
      // CoursePeriod.
      // CoursePeriods render helping array.
      $form['periodsWrapper']['coursePeriods']['#coursePeriods'][$period_delta] = [
        'title' => $course_period->getTitle(),
        'courseSlots' => [],
      ];

      $not_mandatory_course_slots = [];
      foreach ($course_period->field_vih_cp_course_slots->referencedEntities() as $course_slot) {
        // Adding only not mandatory course slots.
        if (!$course_slot->field_vih_cs_mandatory->value) {
          $not_mandatory_course_slots[] = $course_slot;
        }
      }

      foreach ($not_mandatory_course_slots as $slot_delta => $course_slot) {
        // Saving component id for future references.
        $available_classes_cid = "course-period-$period_delta-courseSlot-$slot_delta-availableClasses";

        // Reset previous selection if preiod has been changed.
        if ($reset_periods) {
          $this->removeInputValue($available_classes_cid, $form_state);
        }

        // CourseSlot render helping array.
        $form['periodsWrapper']['coursePeriods']['#coursePeriods'][$period_delta]['courseSlots'][$slot_delta] = [
          'title' => $course_slot->field_vih_cs_title->value,
          'availableClasses' => [
            'cid' => $available_classes_cid,
          ],
        ];

        // Creating real input-ready fields.
        $radios_options = [];
        $classes_radio_selections = [];
        foreach ($course_slot->field_vih_cs_classes->referencedEntities() as $class) {
          // Title is being handled in css depending on button
          // state and active language: see _radio-selection/_vih-class.scss
          $radios_options[$class->id()] = '';

          $classes_radio_selections[$class->id()] = taxonomy_term_view($class, 'radio_selection');
          $classes_radio_selections[$class->id()]['#modal'] = taxonomy_term_view($class, 'modal_window');
        }

        $form['periodsWrapper']['coursePeriods']['classes'][$available_classes_cid] = [
          '#title' => 'Linjefag',
          '#type' => 'radios',
          '#options' => $radios_options,
          '#theme' => 'vih_subscription_class_selection_radios',
          '#classes' => ['radio_selection' => $classes_radio_selections],
          '#ajax' => [
            'callback' => '::updateQuestion',
            'wrapper' => 'questions',
          ],
        ];
      }

      // Load questions from classes terms.
      $values = $form_state->getUserInput();
      $pattern = '/^course-period-(\d)-courseSlot-(\d)-availableClasses$/';
      foreach (preg_grep($pattern, array_keys($values)) as $radio_key) {
        if (empty($values[$radio_key])) {
          continue;
        }
        $class = Term::load($values[$radio_key]);
        $class_questions = $class->field_vies_questions->referencedEntities();
        $questions = $this->buildApplicationQuestions($class_questions);
        if (!empty($questions)) {
          $form['periodsWrapper']['coursePeriods']['questions'][$class->id()] = [
            '#type' => 'container',
            '#theme' => 'vies_application_questions',
            '#title' => $this->t('@class_name spørgsmål', ['@class_name' => $class->getName()]),
          ] + $questions;
        }
      }
    }

    $this->buildApplicationFormElements($form, $form_state);

    if (!empty($terms_and_conditions_page_id = $config->get('vih_subscription_application_terms_and_conditions_page'))) {
      $terms_and_conditions_link = CommonFormUtils::getTermsAndConditionsLink($terms_and_conditions_page_id);
      $form['terms_and_conditions']['accepted'] = array(
        '#type' => 'checkboxes',
        '#options' => array('accepted' => $this->t('I agree to the @terms_and_conditions', array('@terms_and_conditions' => $terms_and_conditions_link))),
        '#title' => $this->t('Terms and conditions'),
        '#required' => TRUE,
      );
    }

    $form['submit'] = [
      '#type' => 'submit',
      '#value' => 'Send min ansøgning',
    ];

    $form_state->setCached(FALSE);

    return $form;
  }

  /**
   * Ajax callback for the Courses.
   */
  public function updateCoursesPeriods(array $form, FormStateInterface $form_state) {
    return $form['periodsWrapper']['coursePeriods'];
  }

  /**
   * Ajax callback for the Periods dropdown.
   */
  public function updateAvailablePeriods(array $form, FormStateInterface $form_state) {
    return $form['periodsWrapper'];
  }

  /**
   * Ajax callback for the Periods dropdown.
   */
  public function updateQuestion(array $form, FormStateInterface $form_state) {
    return $form['periodsWrapper']['coursePeriods']['questions'];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    $values = $form_state->getValues();
    // Going through the selected options.
    $pattern = '/^course-period-(\d)-courseSlot-(\d)-availableClasses$/';
    foreach (preg_grep($pattern, array_keys($values)) as $radio_key) {
      preg_match($pattern, $radio_key, $matches);
      if (!is_numeric($values[$radio_key])) {
        $form_state->setErrorByName($radio_key, 'Venligst foretag et valg i linjefag.');
      }
    }

    if (!empty($values['parents']['current'])) {
      if (0 == $form_state->getValues()['parents']['current']['left']['nocpr'] and NULL == $form_state->getValues()['parents']['current']['left']['cpr']) {
        $form_state->setErrorByName("parents][current][left][cpr", $this->t('Please add, CPR.'));
      }
      if (0 <> $form_state->getValues()['parents']['current']['left']['nocpr'] and NULL == $form_state->getValues()['parents']['current']['left']['birthdate']) {
        $form_state->setErrorByName("parents][current][left][birthdate", $this->t('Please provide birthdate.'));
      }
    }

    $parents = $form_state->get('parents');
    if (empty($values['parents']['current']) && empty($parents)) {
      $form_state->setErrorByName('parents', 'Du skal tilføje mindst en forælder.');
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();

    // Collect parent data.
    $parents = $form_state->get('parents');
    if (isset($values['parents']['current'])) {
      $current_parent = $values['parents']['current'];
      $parents[] = $current_parent['left'] + $current_parent['right'];
    }
    $values['parents'] = $parents;

    if (empty($values['questions'])) {
      drupal_set_message('Noget galt med formular spørgsmål. Prøv igen', 'error');
      $form_state->setRedirect('vies_application.application_form');
      return;
    }

    $application = new ApplicationHandler($values);
    if ($application->process()) {
      $form_state->setRedirect('vies_application.application_form_success');
      return;
    }

    $form_state->setRedirect('vies_application.application_form_error');
  }

  /**
   * Callback for selects and returns the container with the parents in it.
   */
  public function parentsRefreshCallback(array &$form, FormStateInterface $form_state) {
    return $form['parentsWrapper'];
  }

  /**
   * Submit handler for the "submit-parent" button.
   */
  public function submitParent(array &$form, FormStateInterface $form_state) {
    $parents = $form_state->get('parents');
    $parent_index = $form_state->get('parent_index');
    $values = $form_state->getValues();
    $parent = $values['parents']['current'];
    $parents[$parent_index] = $parent['left'] + $parent['right'];
    ksort($parents);
    $form_state->set('parents', $parents);
    $form_state->set('parent_index', NULL);
    $form_state->set('parent_current', NULL);
    $this->removeInputValue('parents', $form_state);
    $form_state->setRebuild();
  }

  /**
   * Submit handler for the hide parent form button.
   */
  public function hideParentForm(array &$form, FormStateInterface $form_state) {
    $parent_index = $form_state->get('parent_index');
    $parent_current = $form_state->get('parent_current');
    // For editing mode restore current parent data.
    if (!empty($parent_current)) {
      $parents = $form_state->get('parents');
      $parents[$parent_index] = $parent_current;
      ksort($parents);
      $form_state->set('parents', $parents);
      $form_state->set('parent_current', NULL);
    }
    $form_state->set('parent_index', NULL);
    $form_state->setRebuild();
  }

  /**
   * Submit handler for the show parent form action.
   */
  public function showParentForm(array &$form, FormStateInterface $form_state) {
    $parents = $form_state->get('parents');
    $triggering_element = $form_state->getTriggeringElement();
    if (isset($triggering_element['#parent_index'])) {
      $parent_index = $triggering_element['#parent_index'];
      $form_state->set('parent_current', $parents[$parent_index]);
    }
    else {
      $parent_index = 1;
      if (!empty($parents)) {
        $parent_index = max(array_keys($parents)) + 1;
      }

      $values = $form_state->getValues();
      if (!empty($values['same_address'])) {
        $form_state->set('parent_same_address', TRUE);
      }
    }
    $form_state->set('parent_index', $parent_index);
    $form_state->setRebuild();
  }

  /**
   * Submit handler for the "remove-parent" button.
   */
  public function removeParent(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $parent_index = $triggering_element['#parent_index'];
    $parents = $form_state->get('parents');
    unset($parents[$parent_index]);
    $form_state->set('parents', $parents);
    $form_state->setRebuild();
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

  /**
   * Helper function to build application form elements.
   *
   * @param array $form
   *   The form array.
   * @param FormStateInterface $form_state
   *   Form state object.
   */
  private function buildApplicationFormElements(array &$form, FormStateInterface $form_state) {
    // Personal data - left side.
    $form['personalDataWrapper'] = [
      '#type' => 'container',
      '#title' => 'Om dig',
      '#theme' => 'vies_application_section',
    ];
    $personal_data = $this->getPersonalDataForm();
    $personal_data['left']['gender'] = [
      '#type' => 'select',
      '#title' => 'Køn',
      '#options' => ApplicationHandler::$gender,
      '#empty_label' => 'None',
      '#required' => TRUE,
    ];

    $form['personalDataWrapper']['data'] = $personal_data;

    $about_school_questions = ApplicationHandler::$aboutSchool;
    $about_school = [];
    foreach ($about_school_questions as $key => $question) {
      $type = 'textarea';
      if ($key == 'schoolFrom') {
        $type = 'textfield';
      }
      $about_school[$key] = [
        '#type' => $type,
        '#title' => $question,
        '#wrapper_attributes' => ['class' => ['col-md-12']],
        '#required' => TRUE,
      ];
    }

    $form['aboutSchool'] = [
      '#type' => 'container',
      '#title' => 'Om at gå i skole',
      '#theme' => 'vies_application_section',
      'questions' => $about_school,
    ];

    $form['parentsWrapper'] = [
      '#type' => 'container',
      '#title' => 'Forældre eller værger',
      '#theme' => 'vies_application_section',
      '#prefix' => '<div id="parents-wrapper">',
      '#suffix' => '</div>',
    ];

    // Gather the number of parents in the form already.
    $parent_index = $form_state->get('parent_index');

    $parents = $form_state->get('parents');
    $default_values = [];
    if (isset($parents[$parent_index])) {
      $default_values = $parents[$parent_index];
      unset($parents[$parent_index]);
      $form_state->set('parents', $parents);
    }

    // Use existing address for new parent.
    $parent_same_address = $form_state->get('parent_same_address');
    if ($parent_same_address && !empty($parents)) {
      $parent = end($parents);
      foreach (['address', 'houseNumber', 'houseLetter', 'houseFloor', 'city', 'municipality', 'zip', 'country'] as $key) {
        $default_values[$key] = $parent[$key];
      }
      $form_state->set('parent_same_address', NULL);
    }
    $form['parentsWrapper']['parents'] = [
      '#type' => 'container',
      '#tree' => TRUE,
    ];

    $ajax_parent_button = [
      '#ajax' => [
        'callback' => '::parentsRefreshCallback',
        'wrapper' => 'parents-wrapper',
      ],
      '#type' => 'submit',
      '#limit_validation_errors' => [],
    ];
    if (!empty($parents)) {
      $form['parentsWrapper']['parents']['added'] = [
        '#type' => 'container',
        '#theme' => 'vies_added_parents',
        '#weight' => -2,
      ];

      foreach ($parents as $key => $parent) {
        $form['parentsWrapper']['parents']['added']['control-buttons'][$key] = [
          'edit' => [
            '#id' => 'edit-parents-' . $key,
            '#name' => 'edit-parents-' . $key,
            '#value' => $this->t('Edit'),
            '#submit' => ['::showParentForm'],
            '#attributes' => ['class' => ['btn-sm']],
            '#parent_index' => $key,
          ] + $ajax_parent_button,
          'remove' => [
            '#id' => 'remove-parents-' . $key,
            '#name' => 'remove-parents-' . $key,
            '#value' => $this->t('Remove'),
            '#submit' => ['::removeParent'],
            '#attributes' => ['class' => ['btn-sm']],
            '#parent_index' => $key,
          ] + $ajax_parent_button,
        ];
        $parents[$key]['type_value'] = ApplicationHandler::$adultType[$parent['type']];
      }
      $form['parentsWrapper']['parents']['added']['#list'] = $parents;
    }

    $form['parentsWrapper']['actions'] = [
      '#type' => 'actions',
      '#attributes' => ['class' => ['col-md-12']],
    ];

    // Show parent form when no parents added.
    // At least one parent should be added.
    if (empty($parents)) {
      $parent_index = 1;
      $form_state->set('parent_index', $parent_index);
    }

    if ($parent_index) {
      $form['parentsWrapper']['parents']['current'] = $this->getPersonalDataForm($default_values) + [
          '#attributes' => ['class' => ['clearfix']],
          '#weight' => -1,
        ];

      $form['parentsWrapper']['parents']['current']['left']['cpr']['#states'] = array(
        // Only show this field when the 'nocpr' checkbox is disabled.
        'visible' => array(
          ':input[name="parents[current][left][nocpr]"]' => array(
            'checked' => FALSE,
          ),
        ),
        'required' => array(
          ':input[name="parents[current][left][nocpr]"]' => array(
            'checked' => FALSE,
          ),
        ),
        'disabled' => array(
          ':input[name="parents[current][left][nocpr]"]' => array(
            'checked' => TRUE,
          ),
        ),
      );

      $form['parentsWrapper']['parents']['current']['left']['birthdate']['#states'] = array(
        // Only show this field when the 'nocpr' checkbox is disabled.
        'visible' => array(
          ':input[name="parents[current][left][nocpr]"]' => array(
            'checked' => TRUE,
          ),
        ),
        'required' => array(
          ':input[name="parents[current][left][nocpr]"]' => array(
            'checked' => TRUE,
          ),
        ),
      );

      $form['parentsWrapper']['parents']['current']['left']['type'] = [
        '#type' => 'radios',
        '#title' => $this->t('Type of adult'),
        '#options' => ApplicationHandler::$adultType,
        '#required' => TRUE,
        '#default_value' => isset($default_values['type']) ? $default_values['type'] : NULL,
        '#prefix' => '<div class="form-inline parents-top">',
        '#weight' => -1,
        '#suffix' => '</div>',
      ];
      $form['parentsWrapper']['actions']['add_parent'] = [
          '#value' => $this->t('Add more adults'),
          '#submit' => ['::submitParent'],
          '#attributes' => ['class' => ['btn-success']],
          '#limit_validation_errors' => [['parents']],
      ] + $ajax_parent_button;

      // First parent can not be skipped.
      if (!empty($parents)) {
        $form['parentsWrapper']['actions']['hide_add_parent_form'] = [
            '#value' => $this->t('Cancel'),
            '#submit' => ['::hideParentForm'],
          ] + $ajax_parent_button;
      }
    }
    else {
      $form['parentsWrapper']['actions']['show_add_parent_form'] = [
          '#value' => empty($parents) ? $this->t('Add parent or guardian') : $this->t('Add another parent or guardian') ,
          '#submit' => ['::showParentForm'],
          '#limit_validation_errors' => [['same_address']],
          '#attributes' => ['class' => ['btn-success']],
        ] + $ajax_parent_button;

      if (!empty($parents)) {
        $form['parentsWrapper']['actions']['same_address'] = [
          '#type' => 'checkbox',
          '#title' => 'Brug samme adresse',
          '#default_value' => TRUE,
        ];
      }
    }

    $after_school_questions = ApplicationHandler::$afterSchool;
    $after_school = [];
    foreach ($after_school_questions as $key => $question) {
      $after_school[$key] = [
        '#type' => 'textarea',
        '#title' => $question,
        '#wrapper_attributes' => ['class' => ['col-md-12']],
      ];
    }

    $form['afterSchool'] = [
      '#type' => 'container',
      '#title' => 'Dig på efterskole',
      '#theme' => 'vies_application_section',
      'questions' => $after_school,
    ];

  }

  /**
   * Helper function to build personal form elements.
   */
  private function getPersonalDataForm($default_values = [], $required = TRUE) {
    $personal_data = [
      '#type' => 'container',
      '#theme' => 'vies_application_personal_data',
    ];
    $personal_data['left'] = [
      '#type' => 'container',
    ];
    $personal_data['left']['firstName'] = [
      '#type' => 'textfield',
      '#title' => 'Navn',
      '#placeholder' => 'Navn',
      '#required' => $required,
      '#default_value' => isset($default_values['firstName']) ? $default_values['firstName'] : NULL,
    ];
    $personal_data['left']['lastName'] = [
      '#type' => 'textfield',
      '#title' => 'Efternavn',
      '#placeholder' => 'Efternavn',
      '#required' => $required,
      '#default_value' => isset($default_values['lastName']) ? $default_values['lastName'] : NULL,
    ];

    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);
    $cprHelpText  = (\Drupal::languageManager()->getCurrentLanguage()
        ->getId() === 'en') ? $config->get('vih_subscription_general_cpr_help_text_en') : $config->get('vih_subscription_general_cpr_help_text_da');

    $personal_data['left']['nocpr'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Jeg har ikke et dansk CPR nummer'),
      '#default_value' => isset($default_values['nocpr']) ? $default_values['nocpr'] : NULL,
    );
    
    $personal_data['left']['birthdate'] = [
      '#type' => 'date',
      '#title' => $this->t('Birthdate'),
      '#placeholder' => $this->t('Birthdate'),
      '#date_date_format' => 'm-d-Y',
      '#default_value' => isset($default_values['birthdate']) ? $default_values['birthdate'] : NULL,
      '#states' => array(
        // Only show this field when the 'nocpr' checkbox is disabled.
        'visible' => array(
          ':input[name="nocpr"]' => array(
            'checked' => TRUE,
          ),
        ),
        'required' => array(
          ':input[name="nocpr"]' => array(
            'checked' => TRUE,
          ),
        ),
      ),
    ];
    
    $personal_data['left']['cpr'] = [
      '#type' => 'textfield',
      '#title' => 'CPR',
      '#placeholder' => 'xxxxxxxxxx',
      '#default_value' => isset($default_values['cpr']) ? $default_values['cpr'] : NULL,
      '#pattern' => '[0-9]{10}',
      '#field_suffix' => '<i type="button" class="icon icon-info-circle form-type-textfield__tooltip" aria-hidden="true" data-toggle="popover" data-placement="top" data-content="' . $cprHelpText . '"></i>',
      '#states' => array(
        // Only show this field when the 'nocpr' checkbox is disabled.
        'visible' => array(
          ':input[name="nocpr"]' => array(
            'checked' => FALSE,
          ),
        ),
        'required' => array(
          ':input[name="nocpr"]' => array(
            'checked' => FALSE,
          ),
        ),
        'disabled' => array(
          ':input[name="nocpr"]' => array(
            'checked' => TRUE,
          ),
        ),
      ),
      ];

    $personal_data['left']['telefon'] = [
      '#type' => 'textfield',
      '#title' => 'Telefon',
      '#placeholder' => 'Telefon',
      '#required' => $required,
      '#default_value' => isset($default_values['telefon']) ? $default_values['telefon'] : NULL,
    ];
    $personal_data['left']['email'] = [
      '#type' => 'email',
      '#title' => 'E-mail',
      '#placeholder' => 'E-mail',
      '#required' => $required,
      '#default_value' => isset($default_values['email']) ? $default_values['email'] : NULL,
    ];
    $personal_data['left']['newsletter'] = [
      '#type' => 'checkbox',
      '#title' => 'Nyhedsbrev',
      '#weight' => 100,
      '#default_value' => isset($default_values['newsletter']) ? $default_values['newsletter'] : NULL,
    ];

    // Personal data - right side.
    $personal_data['right'] = [
      '#type' => 'container',
    ];
    $personal_data['right']['country'] = array(
      '#type' => 'select',
      '#title' => 'Land',
      '#options' => CountryManager::getStandardList(),
      '#default_value' => 'DK',
      '#required' => TRUE,
    );
    $personal_data['right']['address'] = [
      '#type' => 'textfield',
      '#title' => 'Adresse',
      '#placeholder' => 'Adresse',
      '#required' => $required,
      '#default_value' => isset($default_values['address']) ? $default_values['address'] : NULL,
    ];
    $personal_data['right']['houseNumber'] = [
      '#type' => 'textfield',
      '#title' => 'Nr',
      '#placeholder' => 'Nr',
      '#required' => $required,
      '#default_value' => isset($default_values['houseNumber']) ? $default_values['houseNumber'] : NULL,
    ];
    $personal_data['right']['houseLetter'] = [
      '#type' => 'textfield',
      '#title' => 'Bogstav',
      '#placeholder' => 'Bogstav',
      '#default_value' => isset($default_values['houseLetter']) ? $default_values['houseLetter'] : NULL,
    ];
    $personal_data['right']['houseFloor'] = [
      '#type' => 'textfield',
      '#title' => 'Sal',
      '#placeholder' => 'Sal',
      '#default_value' => isset($default_values['houseFloor']) ? $default_values['houseFloor'] : NULL,
    ];
    $personal_data['right']['city'] = [
      '#type' => 'textfield',
      '#title' => 'By',
      '#placeholder' => 'By',
      '#required' => $required,
      '#default_value' => isset($default_values['city']) ? $default_values['city'] : NULL,
    ];
    $personal_data['right']['municipality'] = [
      '#type' => 'textfield',
      '#title' => 'Kommune',
      '#placeholder' => 'Kommune',
      '#required' => $required,
      '#default_value' => isset($default_values['municipality']) ? $default_values['municipality'] : NULL,
    ];
    $personal_data['right']['zip'] = [
      '#type' => 'textfield',
      '#title' => 'Postnummer',
      '#placeholder' => 'Postnummer',
      '#required' => $required,
      '#default_value' => isset($default_values['zip']) ? $default_values['zip'] : NULL,
    ];

    return $personal_data;
  }

  /**
   * Helper function to build application questions.
   *
   * @param array $questions_terms
   *   The array of question terms .
   *
   * @return array $questions
   *   Array of question form elements.
   */
  private function buildApplicationQuestions(array $questions_terms) {
    $questions = [];

    foreach ($questions_terms as $term) {
      $type_value = $term->get('field_vies_question_type')->getValue();
      if (empty($type_value)) {
        continue;
      }
      $type = $type_value[0]['value'];
      $question = [
        '#title' => $term->getName(),
        '#required' => TRUE,
        '#type' => $type,
      ];

      switch ($type) {
        case 'select':
        case 'checkboxes':
        case 'radios':
          $options = [];
          $question_options = $term->get('field_vies_answer')->getValue();
          foreach ($question_options as $key => $option) {
            $options[$key] = $option['value'];
          }
          $question['#empty'] = 'None';
          $question['#options'] = $options;
          break;
      }

      $questions[$term->id()] = $question;
    }

    return $questions;
  }

}
