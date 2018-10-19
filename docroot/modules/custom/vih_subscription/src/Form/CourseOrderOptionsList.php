<?php
/**
 * Created by PhpStorm.
 * User: stan
 * Date: 27/04/17
 * Time: 16:10
 */

namespace Drupal\vih_subscription\Form;

use Drupal\Core\Locale\CountryManager;

class CourseOrderOptionsList {

  /**
   * Returns list of countries mapped by country code
   * if key is used then the values for that key is returned.
   *
   * @param $key
   * @return array
   */
  public static function getNationalityList($key = null) {
    $list = CountryManager::getStandardList();
    if ($key) {
      return $list[$key];
    }
    return $list;
  }
  
  /**
   * Returns list of kommune
   *
   * @param $key
   * @return array
   */
  public static function getMunicipalityList() {
    $list = array(
      'Københavns' => 'Københavns Kommune',
      'Frederiksberg' => 'Frederiksberg Kommune',
      'Ballerup' => 'Ballerup Kommune',
      'Brøndby' => 'Brøndby Kommune',
      'Dragør' => 'Dragør Kommune',
      'Gentofte' => 'Gentofte Kommune',
      'Gladsaxe' => 'Gladsaxe Kommune',
      'Glostrup' => 'Glostrup Kommune',
      'Herlev' => 'Herlev Kommune',
      'Albertslund' => 'Albertslund Kommune',
      'Hvidovre' => 'Hvidovre Kommune',
      'Høje-Taastrup' => 'Høje-Taastrup Kommune',
      'Lyngby-Taarbæk' => 'Lyngby-Taarbæk Kommune',
      'Rødovre' => 'Rødovre Kommune',
      'Ishøj' => 'Ishøj Kommune',
      'Tårnby' => 'Tårnby Kommune',
      'Vallensbæk' => 'Vallensbæk Kommune',
      'Furesø' => 'Furesø Kommune',
      'Allerød' => 'Allerød Kommune',
      'Fredensborg' => 'Fredensborg Kommune',
      'Helsingør' => 'Helsingør Kommune',
      'Hillerød' => 'Hillerød Kommune',
      'Hørsholm' => 'Hørsholm Kommune',
      'Rudersdal' => 'Rudersdal Kommune',
      'Egedal' => 'Egedal Kommune',
      'Frederikssund' => 'Frederikssund Kommune',
      'Greve' => 'Greve Kommune',
      'Køge' => 'Køge Kommune',
      'Halsnæs' => 'Halsnæs Kommune',
      'Roskilde' => 'Roskilde Kommune',
      'Solrød' => 'Solrød Kommune',
      'Gribskov' => 'Gribskov Kommune',
      'Odsherred' => 'Odsherred Kommune',
      'Holbæk' => 'Holbæk Kommune',
      'Faxe' => 'Faxe Kommune',
      'Kalundborg' => 'Kalundborg Kommune',
      'Ringsted' => 'Ringsted Kommune',
      'Slagelse' => 'Slagelse Kommune',
      'Stevns' => 'Stevns Kommune',
      'Sorø' => 'Sorø Kommune',
      'Lejre' => 'Lejre Kommune',
      'Lolland' => 'Lolland Kommune',
      'Næstved' => 'Næstved Kommune',
      'Guldborgsund' => 'Guldborgsund Kommune',
      'Vordingborg' => 'Vordingborg Kommune',
      'Bornholms' => 'Bornholms Regionskommune ',
      'Middelfart' => 'Middelfart Kommune',
      'Assens' => 'Assens Kommune',
      'Faaborg-Midtfyn' => 'Faaborg-Midtfyn Kommune',
      'Kerteminde' => 'Kerteminde Kommune',
      'Nyborg' => 'Nyborg Kommune',
      'Odense' => 'Odense Kommune',
      'Svendborg' => 'Svendborg Kommune',
      'Nordfyns' => 'Nordfyns Kommune',
      'Langeland' => 'Langeland Kommune',
      'Ærø' => 'Ærø Kommune',
      'Haderslev' => 'Haderslev Kommune',
      'Billund' => 'Billund Kommune',
      'Sønderborg' => 'Sønderborg Kommune',
      'Tønder' => 'Tønder Kommune',
      'Esbjerg' => 'Esbjerg Kommune',
      'Fanø' => 'Fanø Kommune',
      'Varde' => 'Varde Kommune',
      'Vejen' => 'Vejen Kommune',
      'Aabenraa' => 'Aabenraa Kommune',
      'Fredericia' => 'Fredericia Kommune',
      'Horsens' => 'Horsens Kommune',
      'Kolding' => 'Kolding Kommune',
      'Vejle' => 'Vejle Kommune',
      'Herning' => 'Herning Kommune',
      'Holstebro1' => 'Holstebro Kommune',
      'Lemvig' => 'Lemvig Kommune',
      'Struer' => 'Struer Kommune',
      'Syddjurs' => 'Syddjurs Kommune',
      'Norddjurs' => 'Norddjurs Kommune',
      'Favrskov' => 'Favrskov Kommune',
      'Odder' => 'Odder Kommune',
      'Randers' => 'Randers Kommune',
      'Silkeborg' => 'Silkeborg Kommune',
      'Samsø' => 'Samsø Kommune',
      'Skanderborg' => 'Skanderborg Kommune',
      'Århus' => 'Århus Kommune',
      'Ikast-Brande' => 'Ikast-Brande Kommune',
      'Ringkøbing-Skjern' => 'Ringkøbing-Skjern Kommune',
      'Hedensted' => 'Hedensted Kommune',
      'Morsø' => 'Morsø Kommune',
      'Skive' => 'Skive Kommune',
      'Thisted' => 'Thisted Kommune',
      'Viborg' => 'Viborg Kommune',
      'Brønderslev-Dronninglund' => 'Brønderslev-Dronninglund Kommune',
      'Frederikshavn' => 'Frederikshavn Kommune',
      'Vesthimmerlands' => 'Vesthimmerlands Kommune',
      'Læsø' => 'Læsø Kommune',
      'Rebild' => 'Rebild Kommune',
      'Mariagerfjord' => 'Mariagerfjord Kommune',
      'Jammerbugt' => 'Jammerbugt Kommune',
      'Aalborg' => 'Aalborg Kommune',
      'Hjørring' => 'Hjørring Kommune',
    );

    return $list;
  }

  /**
   * Returns list of educations
   * if key is used then the values for that key is returned.
   *
   * @param $key
   * @return array
   */
  public static function getEducationList($key = null) {
    $list = array(
      'folkeskole' => \Drupal::translation()->translate('Folkeskole'),
      'gymnasium' => \Drupal::translation()->translate('Gymnasium'),
      'hf' => \Drupal::translation()->translate('HF'),
      'handelsskole' => \Drupal::translation()->translate('Handelsskole'),
      'andet' => \Drupal::translation()->translate('Andet')
    );
    if ($key) {
      return $list[$key];
    }
    return $list;
  }

  /**
   * Returns list of available payment methods
   * if key is used then the values for that key is returned.
   *
   * @param $key
   * @return array
   */
  public static function getPaymentList($key = null) {
    $list = array(
      'egne' => \Drupal::translation()->translate('Egne midler / forældres'),
      'arbejdsloskasse' => \Drupal::translation()->translate('Arbejdsløshedskasse'),
      'kontanthjaelp' => \Drupal::translation()->translate('Kontanthjælp'),
      'integrationsydelse' => \Drupal::translation()->translate('Integrationsydelse'),
      'andet' => \Drupal::translation()->translate('Andet')
    );
    if ($key) {
      return $list[$key];
    }
    return $list;
  }

}