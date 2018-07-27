<?php

namespace Drupal\vih_subscription\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\node\Entity\Node;

class SubscriptionsGeneralSettingsForm extends ConfigFormBase {

  public static $configName = 'vih_subscription.general.settings';

  /**
   * Gets the configuration names that will be editable.
   * @return array
   *   An array of configuration object names that are editable if called in
   *   conjunction with the trait's config() method.
   */
  protected function getEditableConfigNames() {
    return [
      SubscriptionsGeneralSettingsForm::$configName
    ];
  }

  /**
   * Returns a unique string identifying the form.
   * @return string
   *   The unique string identifying the form.
   */
  public function getFormId() {
    return 'vih_subscription_subscriptons_general_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(SubscriptionsGeneralSettingsForm::$configName);
    $notification_description = $this->t("You can use the following replacement tokens: <br>
      <b>@subject_name</b> => Name of the course <br>
      <b>@person_name</b> => Name of the person <br>
      <b>@date</b> => Date of the course <br>
      <b>@url</b> => Link to the course <br>
      <b>@order</b> => Order full information");

    /**
     * Long course start.
     */
    $form['vih_subscription_settings_long_course_fs'] = [
      '#type' => 'details',
      '#title' => $this->t('Long course settings'),
      '#open' => FALSE,
    ];

    // Long course terms and conditions page.
    $form['vih_subscription_settings_long_course_fs']['vih_subscription_long_course_terms_and_conditions_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Terms and conditions page'),
      '#default_value' => !empty($config->get('vih_subscription_long_course_terms_and_conditions_page')) ? Node::load($config->get('vih_subscription_long_course_terms_and_conditions_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node as terms and conditions page"),
    ];

    // Long course redirection settings.
    $form['vih_subscription_settings_long_course_fs']['vih_subscription_long_course_redirection_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Redirection page'),
      '#default_value' => !empty($config->get('vih_subscription_long_course_redirection_page')) ? Node::load($config->get('vih_subscription_long_course_redirection_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node to redirect after order submitted successfully"),
    ];

    // Long course page for price enquiry.
    $form['vih_subscription_settings_long_course_fs']['vih_subscription_long_course_subscription_enquire_price_page_international'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Page for price enquiry (international)'),
      '#default_value' => !empty($config->get('vih_subscription_long_course_subscription_enquire_price_page_international')) ? Node::load($config->get('vih_subscription_long_course_subscription_enquire_price_page_international')) : NULL,
      '#description' => $this->t('Provide a page, which allows international users to enquiry the price.'),
    ];

    // Long course language specific START.
    $form['vih_subscription_settings_long_course_fs']['vih_subscription_long_course_language_specific'] = array(
      '#type' => 'vertical_tabs',
      '#default_tab' => 'edit-vih-subscription-long-course-da',
    );

    $form['vih_subscription_long_course_da'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('Danish'),
      '#group' => 'vih_subscription_long_course_language_specific',
      '#weight' => -1
    );

    // Long course page registration text DA.
    $form['vih_subscription_long_course_da']['vih_subscription_long_course_registration_page_text_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (Danish)'),
      '#default_value' => $config->get('vih_subscription_long_course_registration_page_text_da'),
    ];

    // Long course notification DA.
    $form['vih_subscription_long_course_da']['vih_subscription_notifications_long_course_fs_da'] = [
      '#type' => 'details',
      '#title' => $this->t('Notifications (danish)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_long_course_da']['vih_subscription_notifications_long_course_fs_da']['vih_subscription_long_course_notifications_bcc_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_bcc_da'),
    ];
    $form['vih_subscription_long_course_da']['vih_subscription_notifications_long_course_fs_da']['vih_subscription_long_course_notifications_subject_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_subject_da'),
    ];
    $form['vih_subscription_long_course_da']['vih_subscription_notifications_long_course_fs_da']['vih_subscription_long_course_notifications_body_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_body_da'),
      '#description' => $notification_description,
    ];

    $form['vih_subscription_long_course_en'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('English'),
      '#group' => 'vih_subscription_long_course_language_specific',
    );

    // Long course page registration text EN.
    $form['vih_subscription_long_course_en']['vih_subscription_long_course_registration_page_text_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (English)'),
      '#default_value' => $config->get('vih_subscription_long_course_registration_page_text_en'),
    ];

    // Long course notification EN.
    $form['vih_subscription_long_course_en']['vih_subscription_notifications_long_course_fs_en'] = [
      '#type' => 'details',
      '#title' => $this->t('Notifications (english)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_long_course_en']['vih_subscription_notifications_long_course_fs_en']['vih_subscription_long_course_notifications_bcc_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_bcc_en'),
    ];
    $form['vih_subscription_long_course_en']['vih_subscription_notifications_long_course_fs_en']['vih_subscription_long_course_notifications_subject_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_subject_en'),
    ];
    $form['vih_subscription_long_course_en']['vih_subscription_notifications_long_course_fs_en']['vih_subscription_long_course_notifications_body_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_long_course_notifications_body_en'),
      '#description' => $notification_description,
    ];
    // Long course language specific END.
    /**
     * Long course end.
     */

    /**
     * Short course start.
     */
    $form['vih_subscription_settings_short_course_fs'] = [
      '#type' => 'details',
      '#title' => $this->t('Short course settings'),
      '#open' => FALSE,
    ];

    // Short course terms and conditions page.
    $form['vih_subscription_settings_short_course_fs']['vih_subscription_short_course_terms_and_conditions_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Terms and conditions page'),
      '#default_value' => !empty($config->get('vih_subscription_short_course_terms_and_conditions_page')) ? Node::load($config->get('vih_subscription_short_course_terms_and_conditions_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node as terms and conditions page"),
    ];

    // Short course redirection page.
    $form['vih_subscription_settings_short_course_fs']['vih_subscription_short_course_redirection_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Redirection page'),
      '#default_value' => !empty($config->get('vih_subscription_short_course_redirection_page')) ? Node::load($config->get('vih_subscription_short_course_redirection_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node to redirect after order submitted successfully"),
    ];

    // Short course language specific START.
    $form['vih_subscription_settings_short_course_fs']['vih_subscription_short_course_language_specific'] = array(
      '#type' => 'vertical_tabs',
      '#default_tab' => 'edit-vih-subscription-short-course-da',
    );

    $form['vih_subscription_short_course_da'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('Danish'),
      '#group' => 'vih_subscription_short_course_language_specific',
      '#weight' => -1
    );

    // Short course page registration text DA.
    $form['vih_subscription_short_course_da']['vih_subscription_short_course_registration_page_text_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (Danish)'),
      '#default_value' => $config->get('vih_subscription_short_course_registration_page_text_da'),
    ];

    // Short course notification DA.
    $form['vih_subscription_short_course_da']['vih_subscription_notifications_short_course_fs_da'] = [
      '#type' => 'details',
      '#title' => $this->t('Short course notifications (danish)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_short_course_da']['vih_subscription_notifications_short_course_fs_da']['vih_subscription_short_course_notifications_bcc_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_bcc_da'),
    ];
    $form['vih_subscription_short_course_da']['vih_subscription_notifications_short_course_fs_da']['vih_subscription_short_course_notifications_subject_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_subject_da'),
    ];
    $form['vih_subscription_short_course_da']['vih_subscription_notifications_short_course_fs_da']['vih_subscription_short_course_notifications_body_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_body_da'),
      '#description' => $notification_description
    ];

    $form['vih_subscription_short_course_en'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('English'),
      '#group' => 'vih_subscription_short_course_language_specific',
    );

    // Short course page registration text EN.
    $form['vih_subscription_short_course_en']['vih_subscription_short_course_registration_page_text_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (English)'),
      '#default_value' => $config->get('vih_subscription_short_course_registration_page_text_en'),
    ];

    // Short course notification EN.
    $form['vih_subscription_short_course_en']['vih_subscription_notifications_short_course_fs_en'] = [
      '#type' => 'details',
      '#title' => $this->t('Short course notifications (english)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_short_course_en']['vih_subscription_notifications_short_course_fs_en']['vih_subscription_short_course_notifications_bcc_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_bcc_en'),
    ];
    $form['vih_subscription_short_course_en']['vih_subscription_notifications_short_course_fs_en']['vih_subscription_short_course_notifications_subject_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_subject_en'),
    ];
    $form['vih_subscription_short_course_en']['vih_subscription_notifications_short_course_fs_en']['vih_subscription_short_course_notifications_body_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_short_course_notifications_body_en'),
      '#description' => $notification_description
    ];
    // Short course language specific END.
    /**
     * Short course end.
     */

    /**
     * Event start.
     */
    $form['vih_subscription_settings_event_fs'] = [
      '#type' => 'details',
      '#title' => $this->t('Event settings'),
      '#open' => FALSE,
    ];

    // Event terms and conditions page.
    $form['vih_subscription_settings_event_fs']['vih_subscription_event_terms_and_conditions_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Terms and conditions page'),
      '#default_value' => !empty($config->get('vih_subscription_event_terms_and_conditions_page')) ? Node::load($config->get('vih_subscription_event_terms_and_conditions_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node as terms and conditions page"),
    ];

    // Event redirection page.
    $form['vih_subscription_settings_event_fs']['vih_subscription_event_redirection_page'] = [
      '#type' => 'entity_autocomplete',
      '#target_type' => 'node',
      '#selection_settings' => ['target_bundles' => ['page']],
      '#title' => $this->t('Redirection page'),
      '#default_value' => !empty($config->get('vih_subscription_event_redirection_page')) ? Node::load($config->get('vih_subscription_event_redirection_page')) : NULL,
      '#description' => $this->t("You can use any 'page' node to redirect after order submitted successfully"),
    ];

    // Event language specific START.
    $form['vih_subscription_settings_event_fs']['vih_subscription_event_language_specific'] = array(
      '#type' => 'vertical_tabs',
      '#default_tab' => 'edit-vih-subscription-event-da',
    );

    $form['vih_subscription_event_da'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('Danish'),
      '#group' => 'vih_subscription_event_language_specific',
      '#weight' => -1
    );

    // Event page registration text DA.
    $form['vih_subscription_event_da']['vih_subscription_event_registration_page_text_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (Danish)'),
      '#default_value' => $config->get('vih_subscription_event_registration_page_text_da'),
    ];

    // Event notification settings DA.
    $form['vih_subscription_event_da']['vih_subscription_notifications_event_fs_da'] = [
      '#type' => 'details',
      '#title' => $this->t('Event notifications (danish)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_event_da']['vih_subscription_notifications_event_fs_da']['vih_subscription_event_notifications_bcc_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_event_notifications_bcc_da'),
    ];
    $form['vih_subscription_event_da']['vih_subscription_notifications_event_fs_da']['vih_subscription_event_notifications_subject_da'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_event_notifications_subject_da'),
    ];
    $form['vih_subscription_event_da']['vih_subscription_notifications_event_fs_da']['vih_subscription_event_notifications_body_da'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_event_notifications_body_da'),
      '#description' => $notification_description
    ];

    $form['vih_subscription_event_en'] = array(
      '#type' => 'details',
      '#title' => $this
          ->t('English'),
      '#group' => 'vih_subscription_event_language_specific',
    );

    // Event page registration text EN.
    $form['vih_subscription_event_en']['vih_subscription_event_registration_page_text_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Registration page text (English)'),
      '#default_value' => $config->get('vih_subscription_event_registration_page_text_en'),
    ];

    // Event notification settings EN.
    $form['vih_subscription_event_en']['vih_subscription_notifications_event_fs_en'] = [
      '#type' => 'details',
      '#title' => $this->t('Event notifications (english)'),
      '#open' => FALSE,
    ];
    $form['vih_subscription_event_en']['vih_subscription_notifications_event_fs_en']['vih_subscription_event_notifications_bcc_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Bcc'),
      '#default_value' => $config->get('vih_subscription_event_notifications_bcc_en'),
    ];
    $form['vih_subscription_event_en']['vih_subscription_notifications_event_fs_en']['vih_subscription_event_notifications_subject_en'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#default_value' => $config->get('vih_subscription_event_notifications_subject_en'),
    ];
    $form['vih_subscription_event_en']['vih_subscription_notifications_event_fs_en']['vih_subscription_event_notifications_body_en'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#default_value' => $config->get('vih_subscription_event_notifications_body_en'),
      '#description' => $notification_description
    ];
    // Event language specific END.
    /**
     * Event end.
     */

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $confObject = $this->config(SubscriptionsGeneralSettingsForm::$configName);
    foreach ($form_state->getValues() as $key => $value) {
      $confObject->set($key, $value);
    }
    $confObject->save();

    parent::submitForm($form, $form_state);
  }

}
