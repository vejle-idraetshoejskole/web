<?php

namespace Drupal\bellcom_quickpay_integration\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class QuickpaySettingsForm extends ConfigFormBase {
  public static $configName = 'bellcom_quickpay_integration.settings';

  /**
   * Gets the configuration names that will be editable.
   *
   * @return array
   *   An array of configuration object names that are editable if called in
   *   conjunction with the trait's config() method.
   */
  protected function getEditableConfigNames() {
    return [
      QuickpaySettingsForm::$configName
    ];
  }

  /**
   * Returns a unique string identifying the form.
   *
   * @return string
   *   The unique string identifying the form.
   */
  public function getFormId() {
    return 'bellcom_quickpay_integration_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function  buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(QuickpaySettingsForm::$configName);

    $form['bellcom_quickpay_integration_fieldset'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Bellcom QuickPay integration settings'),
    ];

    $form['bellcom_quickpay_integration_fieldset']['test_mode'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Run in TEST mode?'),
      '#default_value' => $config->get('test_mode'),
      '#ajax' => [
        'callback' => '::ajaxAddTestModePrefixCallback',
        'progress' => array(
          'type' => 'none'
        ),
      ],
    ];

    $form['bellcom_quickpay_integration_fieldset']['prefix_container'] = [
      '#type' => 'container',
      '#attributes' => ['id' => 'js-prefix-container'],
    ];

    $form['bellcom_quickpay_integration_fieldset']['prefix_container']['prefix'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Quickpay order id prefix'),
      '#size' => 15,
      '#maxlength' => 8,
      '#default_value' => $config->get('prefix'),
      '#description' => $this->t('Max length 8 characters'),
    ];
    if ($config->get('test_mode')) {
      $form['bellcom_quickpay_integration_fieldset']['prefix_container']['prefix']['#field_prefix'] = 'T-';
    }

    $form['bellcom_quickpay_integration_fieldset']['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config->get('api_key'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * Showing/hiding information about mode prefix.
   *
   * @param array $form
   * @param FormStateInterface $form_state
   *
   * @return AjaxResponse
   */
  function ajaxAddTestModePrefixCallback(array &$form, FormStateInterface $form_state) {
    if ($form_state->getValue('test_mode')) {
      $form['bellcom_quickpay_integration_fieldset']['prefix_container']['prefix']['#field_prefix'] = 'T-';
    }
    else {
      $form['bellcom_quickpay_integration_fieldset']['prefix_container']['prefix']['#field_prefix'] = '';
    }

    $response = new AjaxResponse();
    $response->addCommand(new ReplaceCommand('#js-prefix-container', $form['bellcom_quickpay_integration_fieldset']['prefix_container']));
    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $confObject = $this->config(QuickpaySettingsForm::$configName);
    foreach ($form_state->getValues() as $key => $value) {
      $confObject->set($key, $value);
    }

    $confObject->save();

    parent::submitForm($form, $form_state);
  }
}