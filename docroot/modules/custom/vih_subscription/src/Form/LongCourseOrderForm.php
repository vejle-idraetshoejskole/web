<?php

/**
 * @file
 * Contains \Drupal\vih_subscription\Form\LongCourseOrderForm.
 */

namespace Drupal\vih_subscription\Form;

use Drupal\Component\Utility\Crypt;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\vih_subscription\Misc\VihSubscriptionUtils;

/**
 * Implements an example form.
 */
class LongCourseOrderForm extends FormBase {

  protected $course;
  protected $courseOrder;

  /**
   * Returns page title
   */
  public function getTitle($course) {
    return $this->t('Tailor @label', ['@label' => $course->label()]);
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'vih-subscription-long-course-order-form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $course = NULL, NodeInterface $order = NULL, $checksum = NULL) {
    $cur_language_code = \Drupal::languageManager()->getCurrentLanguage()->getId();
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-accordion-class-selection';
    $form['#attached']['library'][] = 'vih_subscription/vih-subscription-terms-and-conditions-modal';

    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);

    $this->course = $course;
    if ($order != NULL) {
      if (Crypt::hashEquals($checksum, VihSubscriptionUtils::generateChecksum($course, $order))) {
        $this->courseOrder = $order;
      }
    }

    $form['#title'] = $course->getTitle();

    //composing available classes selection per CourseSlot for each CoursePeriod
    foreach ($course->field_vih_course_periods->referencedEntities() as $periodDelta => $coursePeriod) {
      $coursePeriod = \Drupal::service('entity.repository')->getTranslationFromContext($coursePeriod);

      //coursePeriods render helping array
      $form['#coursePeriods'][$periodDelta] = array(
        'title' => $coursePeriod->getTitle(),
        'courseSlots' => array(),
      );

      foreach ($coursePeriod->field_vih_cp_course_slots->referencedEntities() as $slotDelta => $courseSlot) {
        // Skipping all mandatory course slots, unless they are mandatory + travel.
        if ($courseSlot->field_vih_cs_mandatory->value && !$courseSlot->field_vih_cs_travel->value) {
          continue;
        }

        $courseSlot = \Drupal::service('entity.repository')->getTranslationFromContext($courseSlot);

        //saving component id for future references
        $availableClassesCid = "course-period-$periodDelta-courseSlot-$slotDelta-availableClasses";

        //courseSlot render helping array
        $form['#coursePeriods'][$periodDelta]['courseSlots'][$slotDelta] = array(
          'title' => $courseSlot->field_vih_cs_title->value . (($courseSlot->field_vih_cs_mandatory->value) ? ' ' . $this->t('(mandatory)') : ''),
          'availableClasses' => array(
            'cid' => $availableClassesCid
          )
        );

        //creating real input-ready fields
        $radiosOptions = array();
        $classesRadioSelections = array();
        foreach ($courseSlot->field_vih_cs_classes->referencedEntities() as $class) {
          //Title is being handled in css depending on button
          //state and active language: see _radio-selection/_vih-class.scss
          $radiosOptions[$class->id()] = ''; //$this->t('Vælg');

          $classesRadioSelections[$class->id()] = taxonomy_term_view($class, 'radio_selection');
          $classesRadioSelections[$class->id()]['#modal'] = taxonomy_term_view($class, 'modal_window');
        }

        if (!$courseSlot->field_vih_cs_mandatory->value) {
          $form[$availableClassesCid] = array(
            '#type' => 'radios',
            '#options' => $radiosOptions,
            '#theme' => 'vih_subscription_class_selection_radios',
            '#classes' => array(
              'radio_selection' => $classesRadioSelections
            ),
          );
        } else {
          $form[$availableClassesCid] = array(
            '#type' => 'container',
            '#default_value' => 1,
            '#disabled' => TRUE,
            '#options' => $radiosOptions,
            '#theme' => 'vih_subscription_class_selection_radios',
            '#classes' => array(
              'radio_selection' => $classesRadioSelections
            ),
          );
        }
      }
    }

    $cprHelpText  = ($cur_language_code === 'en') ? $config->get('vih_subscription_general_cpr_help_text_en') : $config->get('vih_subscription_general_cpr_help_text_da');

    //Personal data - left side
    $form['personalDataLeft'] = array(
      '#type' => 'container',
    );
    $form['personalDataLeft']['firstName'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Firstname'),
      '#placeholder' => $this->t('Firstname'),
      '#required' => TRUE,
    );
    $form['personalDataLeft']['lastName'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Lastname'),
      '#placeholder' => $this->t('Lastname'),
      '#required' => TRUE,
    );
    $form['personalDataLeft']['nocpr'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Jeg har ikke et dansk CPR nummer'),
    );
    $form['personalDataLeft']['birthdate'] = array(
      '#type' => 'date',
      '#title' => $this->t('Birthdate'),
      '#placeholder' => $this->t('Birthdate'),
      '#date_date_format' => 'm-d-Y',
      '#states' => array(
        // Only show this field when the 'nocpr' checkbox is disabled.
        'visible' => array(
          ':input[name="nocpr"]' => array(
            'checked' => TRUE,
          ),
        ),
        'required' => array(
          ':input[name="nocpr"]' => array(
            'checked' => FALSE,
          ),
        ),
      ),
    );
    $form['personalDataLeft']['cpr'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('CPR'),
      '#placeholder' => $this->t('CPR'),
      '#pattern' => '[0-9]{10}',
      '#field_suffix' => '<i type="button" class="icon icon-info-circle form-type-textfield__tooltip" aria-hidden="true" data-trigger="hover" data-toggle="popover" data-placement="top" data-content="' . $cprHelpText . '"></i>',
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
      ),
    );
    $form['personalDataLeft']['telefon'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Phone'),
      '#placeholder' => $this->t('Phone'),
      '#required' => TRUE,
    );
    $form['personalDataLeft']['email'] = array(
      '#type' => 'email',
      '#title' => $this->t('E-mail address'),
      '#placeholder' => $this->t('E-mail address'),
      '#required' => TRUE,
    );
    $form['personalDataLeft']['nationality'] = array(
      '#type' => 'select',
      '#title' => $this->t('Citizenship'),
      '#options' => CourseOrderOptionsList::getNationalityList(),
      '#default_value' => 'DK',
      '#required' => TRUE,
    );
    $form['personalDataLeft']['payment'] = array(
      '#type' => 'select',
      '#title' => $this->t('How are you planning to pay?'),
      '#options' => CourseOrderOptionsList::getPaymentList(),
      '#required' => $cur_language_code === 'en' ? FALSE : TRUE,
      '#disabled' => $cur_language_code === 'en' ? TRUE : NULL,
      '#access' => $cur_language_code === 'en' ? FALSE : NULL,
    );
    $form['personalDataLeft']['newsletter'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Get updates from the school'),
    );

    //Personal data - right side
    $form['personalDataRight'] = array(
      '#type' => 'container',
    );
    $form['personalDataRight']['address'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Address'),
      '#placeholder' => $this->t('Address'),
      '#required' => TRUE,
    );
    $form['personalDataRight']['house']['houseNumber'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('House no.'),
      '#placeholder' => $this->t('House no.'),
      '#required' => TRUE,
    );
    $form['personalDataRight']['house']['houseLetter'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('House letter'),
      '#placeholder' => $this->t('House letter'),
      //'#required' => TRUE,
    );
    $form['personalDataRight']['house']['houseFloor'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Floor'),
      '#placeholder' => $this->t('Floor'),
      //'#required' => TRUE,
    );
    $form['personalDataRight']['zip'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Zipcode'),
      '#placeholder' => $this->t('Zipcode'),
      '#required' => TRUE,
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div>',
    );
    $form['personalDataRight']['city'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('City'),
      '#placeholder' => $this->t('City'),
      '#required' => TRUE,
      '#prefix' => '<div class="col-xs-12 col-sm-8">',
      '#suffix' => '</div></div>',
    );
    $form['personalDataRight']['municipality'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Municipality'),
      '#placeholder' => $this->t('Municipality'),
      '#required' => TRUE,
    );
    $form['personalDataRight']['country'] = array(
      '#type' => 'select',
      '#title' => $this->t('Country'),
      '#options' => CourseOrderOptionsList::getNationalityList(),
      '#default_value' => 'DK',
      '#required' => TRUE,
    );
    $form['personalDataRight']['education'] = array(
      '#type' => 'select',
      '#title' => $this->t('Education at course start'),
      '#options' => CourseOrderOptionsList::getEducationList(),
      '#required' => TRUE,
    );
    $form['personalDataRight']['foundFrom'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('How did you find us?'),
      '#placeholder' => $this->t('How did you find us?'),
      '#required' => TRUE,
    );

    //adult information left
    $form['adultDataLeft'] = array(
      '#type' => 'container',
    );
    $form['adultDataLeft']['adultFirstName'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Firstname'),
      '#placeholder' => $this->t('Firstname'),
      '#required' => TRUE,
    );
    $form['adultDataLeft']['adultLastName'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Lastname'),
      '#placeholder' => $this->t('Lastname'),
      '#required' => TRUE,
    );
    $form['adultDataLeft']['adultTelefon'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Phone'),
      '#placeholder' => $this->t('Phone'),
      '#required' => TRUE,
    );
    $form['adultDataLeft']['adultEmail'] = array(
      '#type' => 'email',
      '#title' => $this->t('E-mail address'),
      '#placeholder' => $this->t('E-mail address'),
      '#required' => TRUE,
    );
    $form['adultDataLeft']['adultNationality'] = array(
      '#type' => 'select',
      '#title' => $this->t('Nationality'),
      '#options' => CourseOrderOptionsList::getNationalityList(),
      '#default_value' => 'DK',
      '#required' => TRUE,
    );
    $form['adultDataLeft']['adultNewsletter'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Get updates from the school'),
    );

    //Adult data - right side
    $form['adultDataRight'] = array(
      '#type' => 'container',
    );
    $form['adultDataRight']['adultAddress'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Address'),
      '#placeholder' => $this->t('Address'),
      '#required' => TRUE,
    );
    $form['adultDataRight']['adultHouse']['adultHouseNumber'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('House no.'),
      '#placeholder' => $this->t('House no.'),
      '#required' => TRUE,
    );
    $form['adultDataRight']['adultHouse']['adultHouseLetter'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('House letter'),
      '#placeholder' => $this->t('House letter'),
      //'#required' => TRUE,
    );
    $form['adultDataRight']['adultHouse']['adultHouseFloor'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Floor'),
      '#placeholder' => $this->t('Floor'),
      //'#required' => TRUE,
    );
    $form['adultDataRight']['adultZip'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Zipcode'),
      '#placeholder' => $this->t('Zipcode'),
      '#required' => TRUE,
      '#prefix' => '<div class="row"><div class="col-xs-12 col-sm-4">',
      '#suffix' => '</div>',
    );
    $form['adultDataRight']['adultCity'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('City'),
      '#placeholder' => $this->t('City'),
      '#required' => TRUE,
      '#prefix' => '<div class="col-xs-12 col-sm-8">',
      '#suffix' => '</div></div>',
    );

    $form['message'] = array(
      '#type' => 'textarea',
      '#title' => $this->t('Message'),
      '#placeholder' => $this->t('Message...'),
    );

    $form['actions']['submit'] = array(
      '#type' => 'submit',
      '#value' => $this->t('Continue'),
    );

    //preloading data
    if ($this->courseOrder != NULL) {
      $this->populateData($this->courseOrder, $form, $form_state);
    }

    $form['#theme'] = 'vih_subscription_long_course_order_form';

    $form['#registration_text'] = ($cur_language_code === 'en') ? $config->get('vih_subscription_long_course_registration_page_text_en') : $config->get('vih_subscription_long_course_registration_page_text_da');

    if (!empty($terms_and_conditions_page_id = $config->get('vih_subscription_long_course_terms_and_conditions_page'))) {
      $terms_and_conditions_link = CommonFormUtils::getTermsAndConditionsLink($terms_and_conditions_page_id);
      $form['terms_and_conditions']['accepted'] = array(
        '#type' => 'checkboxes',
        '#options' => array('accepted' => $this->t('I agree to the @terms_and_conditions', array('@terms_and_conditions' => $terms_and_conditions_link))),
        '#title' => $this->t('Terms and conditions'),
        '#required' => TRUE,
      );
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    //going through the selected options
    foreach ($form_state->getValues() as $radioKey => $radioValue) {
      if (preg_match('/^course-period-(\d)-courseSlot-(\d)-availableClasses$/', $radioKey, $matches)) {
        $coursePeriodDelta = $matches[1];
        $coursePeriods = $this->course->field_vih_course_periods->referencedEntities();
        $coursePeriod = $coursePeriods[$coursePeriodDelta];

        $courseSlotDelta = $matches[2];
        $courseSlots = $coursePeriod->field_vih_cp_course_slots->referencedEntities();
        $courseSlot = $courseSlots[$courseSlotDelta];

        if (!is_numeric($radioValue)) {
          $form_state->setErrorByName($radioKey, $this->t('Please make a selection in %slotName.', array('%slotName' => $courseSlot->field_vih_cs_title->value)));
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $orderedCoursePeriods = array();

    // Going through the selected classes.
    foreach ($form_state->getValues() as $radioKey => $radioValue) {
      if (preg_match('/^course-period-(\d)-courseSlot-(\d)-availableClasses$/', $radioKey, $matches)) {
        $coursePeriodDelta = $matches[1];
        $coursePeriods = $this->course->field_vih_course_periods->referencedEntities();
        $coursePeriod = $coursePeriods[$coursePeriodDelta];

        $courseSlotDelta = $matches[2];
        $courseSlots = $coursePeriod->field_vih_cp_course_slots->referencedEntities();
        $courseSlot = $courseSlots[$courseSlotDelta];
        $courseSlot = \Drupal::service('entity.repository')->getTranslationFromContext($courseSlot);

        $orderedCourseSlot = Paragraph::create([
          'type' => 'vih_ordered_course_slot',
          'field_vih_ocs_title' => $courseSlot->field_vih_cs_title->value,
          'field_vih_ocs_class' => $radioValue,
        ]);
        $orderedCourseSlot->isNew();
        $orderedCourseSlot->save();

        $orderedCoursePeriod = NULL;
        if (isset($orderedCoursePeriods[$coursePeriod->id()]) && $orderedCoursePeriod = $orderedCoursePeriods[$coursePeriod->id()]) {
          $existingOrderedCourseSlots = $orderedCoursePeriod->get('field_vih_ocp_order_course_slots')->getValue();

          $existingOrderedCourseSlots[] = array(
            'target_id' => $orderedCourseSlot->id(),
            'target_revision_id' => $orderedCourseSlot->getRevisionId()
          );

          $orderedCoursePeriod->set('field_vih_ocp_order_course_slots', $existingOrderedCourseSlots);
          $orderedCoursePeriod->save();
          $orderedCoursePeriods[$coursePeriod->id()] = $orderedCoursePeriod;
        } else {
          $orderedCoursePeriod = Paragraph::create([
            'type' => 'vih_ordered_course_period',
            'field_vih_ocp_course_period' => $coursePeriod->id(),
            'field_vih_ocp_order_course_slots' => array(
              'target_id' => $orderedCourseSlot->id(),
              'target_revision_id' => $orderedCourseSlot->getRevisionId()
            ),
          ]);
          $orderedCoursePeriod->isNew();
          $orderedCoursePeriod->save();
          $orderedCoursePeriods[$coursePeriod->id()] = $orderedCoursePeriod;
        }
      }
    }

    // Adding classes from the mandatory slots START.
    foreach ($this->course->field_vih_course_periods->referencedEntities() as $periodDelta => $coursePeriod) {
      foreach ($coursePeriod->field_vih_cp_course_slots->referencedEntities() as $slotDelta => $courseSlot) {
        if ($courseSlot->field_vih_cs_mandatory->value) {
          // Adding all classes from the slot.
          $orderedCourseSlotClasses = array();
          foreach ($courseSlot->field_vih_cs_classes->referencedEntities() as $class) {
            $orderedCourseSlotClasses[] = $class->id();
          }

          // Creating an orderedCourseSlot containing all classes.
          $orderedCourseSlot = Paragraph::create([
            'type' => 'vih_ordered_course_slot',
            'field_vih_ocs_title' => $courseSlot->field_vih_cs_title->value . ' - mandatory',
            'field_vih_ocs_class' => $orderedCourseSlotClasses,
          ]);
          $orderedCourseSlot->isNew();
          $orderedCourseSlot->save();

          $orderedCoursePeriod = NULL;
          if (isset($orderedCoursePeriods[$coursePeriod->id()]) && $orderedCoursePeriod = $orderedCoursePeriods[$coursePeriod->id()]) {
            $existingOrderedCourseSlots = $orderedCoursePeriod->get('field_vih_ocp_order_course_slots')->getValue();

            $existingOrderedCourseSlots[] = array(
              'target_id' => $orderedCourseSlot->id(),
              'target_revision_id' => $orderedCourseSlot->getRevisionId()
            );

            $orderedCoursePeriod->set('field_vih_ocp_order_course_slots', $existingOrderedCourseSlots);
            $orderedCoursePeriod->save();
            $orderedCoursePeriods[$coursePeriod->id()] = $orderedCoursePeriod;
          } else {
            $orderedCoursePeriod = Paragraph::create([
              'type' => 'vih_ordered_course_period',
              'field_vih_ocp_course_period' => $coursePeriod->id(),
              'field_vih_ocp_order_course_slots' => array(
                'target_id' => $orderedCourseSlot->id(),
                'target_revision_id' => $orderedCourseSlot->getRevisionId()
              ),
            ]);
            $orderedCoursePeriod->isNew();
            $orderedCoursePeriod->save();
            $orderedCoursePeriods[$coursePeriod->id()] = $orderedCoursePeriod;
          }
        }
      }
    }
    // Adding classes from the mandatory slots END.

    //checking if we need to create a new order or edit the existing
    if ($this->courseOrder == NULL) {
      
      $address_array = array();
      array_push($address_array, $form_state->getValue('address'));
      array_push($address_array, $form_state->getValue('houseNumber'));
      array_push($address_array, $form_state->getValue('houseLetter'));
      array_push($address_array, $form_state->getValue('houseFloor'));
      // We do not need empty elements on the array.
      $address_array = array_diff($address_array, array(''));
      
      $address_adult_array = array();
      array_push($address_adult_array, $form_state->getValue('adultAddress'));
      array_push($address_adult_array, $form_state->getValue('adultHouseNumber'));
      array_push($address_adult_array, $form_state->getValue('adultHouseLetter'));
      array_push($address_adult_array, $form_state->getValue('adultHouseFloor'));
      // We do not need empty elements on the array.
      $address_adult_array = array_diff($address_adult_array, array(''));
      
      $this->courseOrder = Node::create(array(
        'type' => 'vih_long_course_order',
        'status' => 1, //We restrict direct access to the node in site_preprocess_node hook
        'title' => $this->course->getTitle() . ' - kursus tilmelding - ' . $form_state->getValue('firstName')
          . ' ' . $form_state->getValue('lastName') . ' - ' . \Drupal::service('date.formatter')->format(time(), 'short'),
        //student information
        'field_vih_lco_first_name' => $form_state->getValue('firstName'),
        'field_vih_lco_last_name' => $form_state->getValue('lastName'),
        'field_vih_lco_cpr' => (1 == $form_state->getValue('nocpr'))? NULL : $form_state->getValue('cpr'), //CPR will be deleted from database immediately, after order is confirmed
        'field_vih_lco_telefon' => $form_state->getValue('telefon'),
        'field_vih_lco_email' => $form_state->getValue('email'),
        'field_vih_lco_country' => CourseOrderOptionsList::getNationalityList($form_state->getValue('country')),
        'field_vih_lco_nationality' => CourseOrderOptionsList::getNationalityList($form_state->getValue('nationality')),
        'field_vih_lco_newsletter' => $form_state->getValue('newsletter'),
        'field_vih_no_cpr' => $form_state->getValue('nocpr'),
        'field_vih_lco_birthdate' => (1 == $form_state->getValue('nocpr'))? $form_state->getValue('birthdate') : NULL,
        'field_vih_lco_address' => implode('; ', $address_array),
        'field_vih_lco_city' => $form_state->getValue('city'),
        'field_vih_lco_municipality' => $form_state->getValue('municipality'),
        'field_vih_lco_zip' => $form_state->getValue('zip'),
        'field_vih_lco_education' => CourseOrderOptionsList::getEducationList($form_state->getValue('education')),
        'field_vih_lco_payment' => CourseOrderOptionsList::getPaymentList($form_state->getValue('payment')),
        'field_vih_lco_found_from' => $form_state->getValue('foundFrom'),
        'field_vih_lco_message' => $form_state->getValue('message'),
        'field_vih_lco_course' => $this->course->id(),
        'field_vih_lco_order_course_perio' => array_values($orderedCoursePeriods), //resetting the keys
        //adult information
        'field_vih_lco_adult_first_name' => $form_state->getValue('adultFirstName'),
        'field_vih_lco_adult_last_name' => $form_state->getValue('adultLastName'),
        'field_vih_lco_adult_telefon' => $form_state->getValue('adultTelefon'),
        'field_vih_lco_adult_email' => $form_state->getValue('adultEmail'),
        'field_vih_lco_adult_nationality' => CourseOrderOptionsList::getNationalityList($form_state->getValue('adultNationality')),
        'field_vih_lco_adult_address' => implode('; ', $address_adult_array),
        'field_vih_lco_adult_city' => $form_state->getValue('adultCity'),
        'field_vih_lco_adult_zip' => $form_state->getValue('adultZip'),
        'field_vih_lco_adult_newsletter' => $form_state->getValue('adultNewsletter'),
      ));
    } else {
      // Removing old ordered course periods START.
      $orderedCoursePeriodsIds = $this->courseOrder->get('field_vih_lco_order_course_perio')->getValue();
      foreach ($orderedCoursePeriodsIds as $orderedCoursePeriodId) {
        $orderedCoursePeriodToDelete = Paragraph::load($orderedCoursePeriodId['target_id']);
        if ($orderedCoursePeriodToDelete) {
          // Removing old ordered course slots START.
          $orderedCourseSlotsIds = $orderedCoursePeriodToDelete->get('field_vih_ocp_order_course_slots')->getValue();
          foreach ($orderedCourseSlotsIds as $orderedCourseSlotId) {
            $orderedCourseSlotToDelete = Paragraph::load($orderedCourseSlotId['target_id']);
            if ($orderedCourseSlotToDelete) {
              $orderedCourseSlotToDelete->delete();
            }
          }
          // Removing old ordered course slots END.

          $orderedCoursePeriodToDelete->delete();
        }
      }
      // Removing old ordered course periods START.

      //adding new ordered course periods
      $this->courseOrder->set('field_vih_lco_order_course_perio', array_values($orderedCoursePeriods));//resetting the keys

      //student information
      $this->courseOrder->set('field_vih_lco_first_name', $form_state->getValue('firstName'));
      $this->courseOrder->set('field_vih_lco_last_name', $form_state->getValue('lastName'));
      $this->courseOrder->set('field_vih_no_cpr', $form_state->getValue('nocpr'));
      $this->courseOrder->set('field_vih_lco_cpr', (1 == $form_state->getValue('nocpr'))? NULL : $form_state->getValue('cpr'));//CPR will be deleted from database immediately, after order is confirmed
      $this->courseOrder->set('field_vih_lco_birthdate', (1 == $form_state->getValue('nocpr'))? $form_state->getValue('birthdate') : NULL);
      $this->courseOrder->set('field_vih_lco_telefon', $form_state->getValue('telefon'));
      $this->courseOrder->set('field_vih_lco_email', $form_state->getValue('email'));
      $this->courseOrder->set('field_vih_lco_nationality', CourseOrderOptionsList::getNationalityList($form_state->getValue('nationality')));
      $this->courseOrder->set('field_vih_lco_newsletter', $form_state->getValue('newsletter'));
      $this->courseOrder->set('field_vih_lco_address', implode('; ', array(
        $form_state->getValue('address'),
        $form_state->getValue('houseNumber'),
        $form_state->getValue('houseLetter'),
        $form_state->getValue('houseFloor')
      )));
      $this->courseOrder->set('field_vih_lco_city', $form_state->getValue('city'));
      $this->courseOrder->set('field_vih_lco_municipality', $form_state->getValue('municipality'));
      $this->courseOrder->set('field_vih_lco_zip', $form_state->getValue('zip'));
      $this->courseOrder->set('field_vih_lco_education', CourseOrderOptionsList::getEducationList($form_state->getValue('education')));
      $this->courseOrder->set('field_vih_lco_payment', CourseOrderOptionsList::getPaymentList($form_state->getValue('payment')));
      $this->courseOrder->set('field_vih_lco_found_from', $form_state->getValue('foundFrom'));
      $this->courseOrder->set('field_vih_lco_message', $form_state->getValue('message'));

      //adult information
      $this->courseOrder->set('field_vih_lco_adult_first_name', $form_state->getValue('adultFirstName'));
      $this->courseOrder->set('field_vih_lco_adult_last_name', $form_state->getValue('adultLastName'));
      $this->courseOrder->set('field_vih_lco_adult_telefon', $form_state->getValue('adultTelefon'));
      $this->courseOrder->set('field_vih_lco_adult_email', $form_state->getValue('adultEmail'));
      $this->courseOrder->set('field_vih_lco_adult_nationality', CourseOrderOptionsList::getNationalityList($form_state->getValue('adultNationality')));
      $this->courseOrder->set('field_vih_lco_adult_address', implode('; ', array(
        $form_state->getValue('adultAddress'),
        $form_state->getValue('adultHouseNumber'),
        $form_state->getValue('adultHouseLetter'),
        $form_state->getValue('adultHouseFloor')
      )));
      $this->courseOrder->set('field_vih_lco_adult_city', $form_state->getValue('adultCity'));
      $this->courseOrder->set('field_vih_lco_adult_zip', $form_state->getValue('adultZip'));
    }

    //saving the order (works for both new/edited)
    $this->courseOrder->save();

    //redirecting to confirmation page
    $form_state->setRedirect('vih_subscription.subscription_confirmation_redirect', [
      'subject' => $this->course->id(),
      'order' => $this->courseOrder->id(),
      'checksum' => VihSubscriptionUtils::generateChecksum($this->course, $this->courseOrder)
    ]);
  }

  /**
   * Populate the data into the form the existing courseOrder
   *
   * @param NodeInterface $courseOrder
   * @param $form
   */
  private function populateData(NodeInterface $courseOrder, &$form, &$form_state) {
    //selected options
    $coursePeriods = $courseOrder->get('field_vih_lco_order_course_perio')->getValue();
    foreach ($coursePeriods as $periodDelta => $coursePeriodId) {
      $coursePeriod = Paragraph::load($coursePeriodId['target_id']);
      $coursePeriodSlots = $coursePeriod->get('field_vih_ocp_order_course_slots')->getValue();
      foreach ($coursePeriodSlots as $courseSlotDelta => $courseSlotId) {
        $courseSlot = Paragraph::load($courseSlotId['target_id']);

        $availableClassesCid = "course-period-$periodDelta-courseSlot-$courseSlotDelta-availableClasses";

        $classId = $courseSlot->get('field_vih_ocs_class')->getValue();

        if (is_array($classId)) {
          $classId = array_pop($classId);
          if ($classId && isset($form[$availableClassesCid])) {
            $form[$availableClassesCid]['#default_value'] = $classId['target_id'];
          }
        }
      }
    }

    //Personal data - left side
    $form['personalDataLeft']['firstName']['#default_value'] = $courseOrder->field_vih_lco_first_name->value;
    $form['personalDataLeft']['lastName']['#default_value'] = $courseOrder->field_vih_lco_last_name->value;
    $form['personalDataLeft']['nocpr']['#default_value'] = $courseOrder->field_vih_no_cpr->value;
    $form['personalDataLeft']['birthdate']['#default_value'] = $courseOrder->field_vih_lco_birthdate->value;
    $form['personalDataLeft']['cpr']['#default_value'] = $courseOrder->field_vih_lco_cpr->value;
    $form['personalDataLeft']['telefon']['#default_value'] = $courseOrder->field_vih_lco_telefon->value;
    $form['personalDataLeft']['email']['#default_value'] = $courseOrder->field_vih_lco_email->value;
    $form['personalDataLeft']['nationality']['#default_value'] = array_search($courseOrder->field_vih_lco_nationality->value, CourseOrderOptionsList::getNationalityList());
    $form['personalDataLeft']['payment']['#default_value'] = array_search($courseOrder->field_vih_lco_payment->value, CourseOrderOptionsList::getPaymentList());
    $form['personalDataLeft']['newsletter']['#default_value'] = $courseOrder->field_vih_lco_newsletter->value ;

    //Personal data - right side
    $address = $courseOrder->field_vih_lco_address->value;
    $address_parts = explode('; ', $address);

    $form['personalDataRight']['address']['#default_value'] = $address_parts[0];
    $form['personalDataRight']['house']['houseNumber']['#default_value'] = $address_parts[1];
    $form['personalDataRight']['house']['houseLetter']['#default_value'] = $address_parts[2];
    $form['personalDataRight']['house']['houseFloor']['#default_value'] = $address_parts[3];

    $form['personalDataRight']['city']['#default_value'] = $courseOrder->field_vih_lco_city->value;
    $form['personalDataRight']['municipality']['#default_value'] = $courseOrder->field_vih_lco_municipality->value;
    $form['personalDataRight']['zip']['#default_value'] = $courseOrder->field_vih_lco_zip->value;
    $form['personalDataRight']['education']['#default_value'] = array_search($courseOrder->field_vih_lco_education->value, CourseOrderOptionsList::getEducationList());
    $form['personalDataRight']['foundFrom']['#default_value'] = $courseOrder->field_vih_lco_found_from->value;

    //adult information left
    $form['adultDataLeft']['adultFirstName']['#default_value'] = $courseOrder->field_vih_lco_adult_first_name->value;
    $form['adultDataLeft']['adultLastName']['#default_value'] = $courseOrder->field_vih_lco_adult_last_name->value;
    $form['adultDataLeft']['adultTelefon']['#default_value'] = $courseOrder->field_vih_lco_adult_telefon->value;
    $form['adultDataLeft']['adultEmail']['#default_value'] = $courseOrder->field_vih_lco_adult_email->value;
    $form['adultDataLeft']['adultNationality']['#default_value'] = array_search($courseOrder->field_vih_lco_adult_nationality->value, CourseOrderOptionsList::getNationalityList());
    $form['adultDataLeft']['adultNewsletter']['#default_value'] = $courseOrder->field_vih_lco_adult_newsletter->value ;

    $adult_address = $courseOrder->field_vih_lco_adult_address->value;
    $adult_address_parts = explode('; ', $adult_address);

    //Adult data - right side
    $form['adultDataRight']['adultAddress']['#default_value'] = $adult_address_parts[0];
    $form['adultDataRight']['adultHouse']['adultHouseNumber']['#default_value'] = $adult_address_parts[1];
    $form['adultDataRight']['adultHouse']['adultHouseLetter']['#default_value'] = $adult_address_parts[2];
    $form['adultDataRight']['adultHouse']['adultHouseFloor']['#default_value'] = $adult_address_parts[3];
    $form['adultDataRight']['adultCity']['#default_value'] = $courseOrder->field_vih_lco_adult_city->value;
    $form['adultDataRight']['adultZip']['#default_value'] = $courseOrder->field_vih_lco_adult_zip->value;

    $form['message']['#default_value'] = $courseOrder->field_vih_lco_message->value;
  }
}

