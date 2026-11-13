import { ENGLISH_MESSAGES } from '../src/messages.js';
import type { MessageDictionary } from '../src/messages.js';
import type { A11yBarChartDatum } from '../src/index.js';

export type BarDemoLocale = 'en-US' | 'fr-FR' | 'es-ES';
type Catalog = Record<keyof typeof ENGLISH_MESSAGES, string> & MessageDictionary;

export const BAR_DEMO_MESSAGES = {
  'en-US': { ...ENGLISH_MESSAGES },
  'fr-FR': {
    explanationLabel: 'Explication', plainLanguageSummary: 'Résumé en langage clair',
    warningScaleClipped: 'La valeur ou la cible de {label} dépasse le maximum de l’échelle commune ; la barre ou le repère est limité à la piste.',
    scaleShared: 'Les barres utilisent une échelle commune jusqu’à {maximum}',
    detailsAction: 'Détails pour {label}', detailsHint: 'Détails',
    detailsHelp: 'Survolez une barre ou placez-y le focus pour prévisualiser les détails. Utilisez les flèches Haut et Bas pour parcourir les catégories ; Début et Fin vont à la première et à la dernière. Cliquez, touchez, appuyez sur Entrée ou Espace pour garder les détails ouverts. Échap les ferme ; Tab continue normalement.',
    detailsPreview: 'Aperçu. Sélectionnez la barre pour garder les détails ouverts.',
    detailsPinned: 'Détails maintenus ouverts. Sélectionnez à nouveau la barre pour les fermer.',
    targetHeader: 'Cible', csvTargetHeader: 'Cible', targetUnavailable: 'Non définie',
    targetRange: '{min} à {max}',
    outcomeMet: 'Cible atteinte', outcomeNotMet: 'Cible non atteinte',
    targetBelow: '{label} est en dessous de la cible ({target}).',
    targetWithin: '{label} se situe dans la plage cible ({target}).',
    targetAbove: '{label} est au-dessus de la cible ({target}).',
    targetEqual: '{label} correspond à la cible ({target}).',
    targetIncomplete: '{label} : cible {target} ; comparaison indisponible.',
    warningTargetClipped: 'La cible de {label} dépasse le total fourni ; son repère est limité à la piste. La cible complète est indiquée dans le texte.',
    warningTargetScaleUnavailable: 'La cible de {label} ne peut pas être positionnée sans total positif. La cible complète est indiquée dans le texte.',
    validationInvalidTarget: 'La catégorie {id} nécessite une cible finie et positive ou nulle, ou une plage avec min et max finis, positifs ou nuls, et min <= max.',
    title: 'Graphique', subtitle: '', filtered: 'Données filtrées', suppressed: 'Données masquées',
    empty: 'Aucune catégorie n’est disponible.', invalidData: 'Les données du graphique sont invalides. Vérifiez les catégories et les valeurs.',
    invalidMessages: 'Le paramètre de messages n’est pas un JSON valide. Corrigez sa valeur puis réessayez.',
    total: 'Total', totalUnavailable: 'Indisponible', totalSuppressed: 'Masqué', countHeader: 'Nombre',
    percentageHeader: 'Pourcentage du total', categoryHeader: 'Catégorie', contextLabel: 'Contexte', dataNoteLabel: 'Note sur les données',
    csvContextLabel: 'Contexte', csvDataNoteLabel: 'Note sur les données', csvCategoryHeader: 'Catégorie',
    csvCountHeader: 'Nombre', csvPercentageHeader: 'Pourcentage du total', csvTotalHeader: 'Total',
    percentageUnavailable: 'Indisponible', percentageSuppressed: 'Masqué',
    definitionToggle: 'Définition de {label}', explain: 'Expliquer', hideExplanation: 'Masquer l’explication',
    showData: 'Voir toutes les données', close: 'Fermer', dataDialogTitle: 'Données complètes du graphique',
    dialogUnsupported: 'Ce navigateur ne prend pas en charge les boîtes de dialogue modales pour les données du graphique.',
    dialogUnavailable: 'La boîte de dialogue des données du graphique n’a pas pu s’ouvrir en mode modal.',
    dataTableCaption: 'Données complètes : {title}', dataInlineSummary: 'Afficher les données complètes',
    exportCsv: 'Télécharger le fichier CSV', scaleLargest: 'Barres proportionnelles à la valeur la plus élevée',
    scalePopulationShare: 'Barres proportionnelles au total déclaré', missingValue: 'Non communiqué',
    suppressedValue: 'Masqué', suppressionNote: 'Certaines valeurs sont masquées pour protéger la vie privée.', noDefinitions: 'Aucune définition de catégorie n’est disponible.',
    glossary: 'Glossaire', hideGlossary: 'Masquer le glossaire', noContext: '',
    summaryNoData: 'Aucune donnée de catégorie n’a été déclarée.',
    'summaryAllZero.one': 'La seule catégorie déclarée a une valeur nulle.',
    'summaryAllZero.other': 'Les {count} catégories déclarées ont toutes une valeur nulle.',
    summaryTotal: 'Le total déclaré est de {total}.',
    summaryCategoryShare: 'Part du total déclaré pour {label} : {percentage}.',
    summaryCategoryValue: '{label} : {value}.',
    summaryLargestCategory: 'La valeur déclarée la plus élevée concerne {label} : {value}.',
    summaryLargestCategoryShare: 'La valeur déclarée la plus élevée concerne {label} : {value}, soit {percentage} du total déclaré.',
    summaryTiedLargestCategories: 'Les catégories à égalité pour la valeur déclarée la plus élevée sont {labels} : {value} par catégorie.',
    summaryTiedLargestCategoriesShare: 'Les catégories à égalité pour la valeur déclarée la plus élevée sont {labels} : {value} par catégorie, soit {percentage} du total déclaré.',
    summaryReportedCategory: 'Les valeurs déclarées comprennent {label} : {value}. Certaines valeurs peuvent être indisponibles.',
    summaryNoReportedValues: 'Aucune valeur numérique de catégorie n’est disponible pour le résumé.',
    explanationTotal: 'Le total déclaré est de {total}.', explanationTotalUnavailable: 'Le total est {total}.',
    explanationDifference: 'L’écart entre {label} et {otherLabel} est de {difference}.',
    validationInvalidData: 'Les données du graphique doivent être une liste de catégories.',
    validationDuplicateId: 'Les identifiants des catégories doivent être uniques. Identifiant en double : {id}.',
    validationEmptyId: 'Chaque catégorie doit avoir un identifiant non vide.',
    validationInvalidLabel: 'La catégorie {id} doit avoir un libellé textuel.',
    validationInvalidValue: 'La catégorie {id} doit avoir une valeur finie et positive ou nulle, ou null.',
    validationInvalidRecord: 'La catégorie à la position {position} doit être valide.',
    validationInvalidTotal: 'Le total doit être un nombre fini et positif ou nul.',
    warningTotalMismatch: 'La somme des valeurs déclarées, {sum}, dépasse le total fourni de {total}.',
    warningComputedTotalOverflow: 'La somme des valeurs dépasse la limite numérique. Le total et les pourcentages sont indisponibles tant qu’un total valide n’est pas fourni.',
    warningReportedSumOverflow: 'La somme des valeurs déclarées dépasse la limite numérique représentable.',
    warningPercentageOverflow: 'Le pourcentage de {label} est indisponible, car le rapport entre sa valeur et le total dépasse la limite numérique représentable.',
    'announcementDataUpdated.one': 'Données du graphique mises à jour. {count} catégorie est affichée.',
    'announcementDataUpdated.other': 'Données du graphique mises à jour. {count} catégories sont affichées.',
    announcementDataError: 'Les données du graphique n’ont pas pu être mises à jour. Consultez le message d’erreur.',
    narrativeValue: '{label} : {value}.', narrativeShare: '{label} : {value}, soit {percentage} du total.',
    narrativeMissing: '{label} : valeur non communiquée.', narrativeSuppressed: '{label} : valeur masquée.',
    narrativeContext: 'Des informations complémentaires sont disponibles.',
    scaleWarning: 'Certaines valeurs dépassent le total fourni ; la longueur des barres est limitée à la piste du graphique.'
  },
  'es-ES': {
    explanationLabel: 'Explicación', plainLanguageSummary: 'Resumen en lenguaje claro',
    warningScaleClipped: 'El valor o la meta de {label} supera el máximo de la escala compartida; la barra o el marcador se limita al área del gráfico.',
    scaleShared: 'Las barras usan una escala compartida hasta {maximum}',
    detailsAction: 'Detalles de {label}', detailsHint: 'Detalles',
    detailsHelp: 'Pase el cursor o enfoque una barra para ver los detalles. Use las flechas Arriba y Abajo para recorrer las categorías; Inicio y Fin van a la primera y la última. Haga clic, toque, pulse Intro o Espacio para mantener los detalles abiertos. Escape los cierra; Tab continúa normalmente.',
    detailsPreview: 'Vista previa. Seleccione la barra para mantener los detalles abiertos.',
    detailsPinned: 'Detalles abiertos. Seleccione la barra de nuevo para cerrarlos.',
    targetHeader: 'Meta', csvTargetHeader: 'Meta', targetUnavailable: 'Sin definir',
    targetRange: '{min} a {max}',
    outcomeMet: 'Meta alcanzada', outcomeNotMet: 'Meta no alcanzada',
    targetBelow: '{label} está por debajo de la meta ({target}).',
    targetWithin: '{label} está dentro del rango meta ({target}).',
    targetAbove: '{label} está por encima de la meta ({target}).',
    targetEqual: '{label} coincide con la meta ({target}).',
    targetIncomplete: '{label}: meta {target}; comparación no disponible.',
    warningTargetClipped: 'La meta de {label} supera el total proporcionado; su marcador se limita al espacio del gráfico. La meta completa se muestra en el texto.',
    warningTargetScaleUnavailable: 'La meta de {label} no se puede ubicar sin un total positivo. La meta completa se muestra en el texto.',
    validationInvalidTarget: 'La categoría {id} necesita una meta finita y no negativa, o un rango con min y max finitos y no negativos y min <= max.',
    title: 'Gráfico', subtitle: '', filtered: 'Datos filtrados', suppressed: 'Datos suprimidos',
    empty: 'No hay categorías disponibles.', invalidData: 'Los datos del gráfico no son válidos. Comprueba las categorías y los valores.',
    invalidMessages: 'El ajuste de mensajes no es un JSON válido. Corrige su valor e inténtalo de nuevo.',
    total: 'Total', totalUnavailable: 'No disponible', totalSuppressed: 'Suprimido', countHeader: 'Recuento',
    percentageHeader: 'Porcentaje del total', categoryHeader: 'Categoría', contextLabel: 'Contexto', dataNoteLabel: 'Nota de datos',
    csvContextLabel: 'Contexto', csvDataNoteLabel: 'Nota de datos', csvCategoryHeader: 'Categoría',
    csvCountHeader: 'Recuento', csvPercentageHeader: 'Porcentaje del total', csvTotalHeader: 'Total',
    percentageUnavailable: 'No disponible', percentageSuppressed: 'Suprimido',
    definitionToggle: 'Definición de {label}', explain: 'Explicar', hideExplanation: 'Ocultar explicación',
    showData: 'Ver todos los datos', close: 'Cerrar', dataDialogTitle: 'Datos completos del gráfico',
    dialogUnsupported: 'Este navegador no admite diálogos modales para los datos del gráfico.',
    dialogUnavailable: 'No se pudo abrir el diálogo de datos del gráfico como modal.',
    dataTableCaption: 'Datos completos de {title}', dataInlineSummary: 'Ver datos completos',
    exportCsv: 'Descargar CSV', scaleLargest: 'Barras según el valor más alto notificado',
    scalePopulationShare: 'Barras según el total notificado', missingValue: 'No informado',
    suppressedValue: 'Suprimido', suppressionNote: 'Algunos valores se suprimen para proteger la privacidad.', noDefinitions: 'No hay definiciones de categorías disponibles.',
    glossary: 'Glosario', hideGlossary: 'Ocultar glosario', noContext: '',
    summaryNoData: 'No se han notificado datos de categorías.',
    'summaryAllZero.one': 'La única categoría notificada tiene un valor de cero.',
    'summaryAllZero.other': 'Las {count} categorías notificadas tienen un valor de cero.',
    summaryTotal: 'El total notificado es {total}.',
    summaryCategoryShare: 'Proporción del total notificado para {label}: {percentage}.',
    summaryCategoryValue: '{label}: {value}.',
    summaryLargestCategory: 'El mayor valor notificado corresponde a {label}: {value}.',
    summaryLargestCategoryShare: 'El mayor valor notificado corresponde a {label}: {value}, es decir, el {percentage} del total.',
    summaryTiedLargestCategories: 'Las categorías con el mayor valor notificado son {labels}: {value} por categoría.',
    summaryTiedLargestCategoriesShare: 'Las categorías con el mayor valor notificado son {labels}: {value} por categoría, es decir, el {percentage} del total por categoría.',
    summaryReportedCategory: 'Los valores notificados incluyen {label} con {value}. Algunos valores pueden no estar disponibles.',
    summaryNoReportedValues: 'No hay valores numéricos de categorías disponibles para resumir.',
    explanationTotal: 'El total notificado es {total}.', explanationTotalUnavailable: 'El total es {total}.',
    explanationDifference: 'La diferencia entre {label} y {otherLabel} es {difference}.',
    validationInvalidData: 'Se esperaba una lista de registros de categorías.',
    validationDuplicateId: 'Los identificadores de categoría deben ser únicos. Identificador duplicado: {id}.',
    validationEmptyId: 'Cada categoría necesita un identificador no vacío.',
    validationInvalidLabel: 'La categoría {id} necesita una etiqueta de texto.',
    validationInvalidValue: 'La categoría {id} debe tener un valor finito no negativo o null.',
    validationInvalidRecord: 'El registro de la categoría en la posición {position} no es válido.',
    validationInvalidTotal: 'El total debe ser un número finito no negativo.',
    warningTotalMismatch: 'La suma de los valores notificados, {sum}, supera el total proporcionado de {total}.',
    warningComputedTotalOverflow: 'Los valores superan el rango numérico para calcular el total. El total y los porcentajes no están disponibles hasta que se proporcione un total válido.',
    warningReportedSumOverflow: 'La suma de los valores notificados supera el rango numérico representable.',
    warningPercentageOverflow: 'El porcentaje de {label} no está disponible porque su relación entre valor y total supera el rango numérico representable.',
    'announcementDataUpdated.one': 'Se actualizaron los datos del gráfico. Se muestra {count} categoría.',
    'announcementDataUpdated.other': 'Se actualizaron los datos del gráfico. Se muestran {count} categorías.',
    announcementDataError: 'No se pudieron actualizar los datos del gráfico. Revisa el mensaje de error.',
    narrativeValue: '{label}: {value}.', narrativeShare: '{label}: {value}, el {percentage} del total.',
    narrativeMissing: '{label}: valor no informado.', narrativeSuppressed: '{label}: valor suprimido.',
    narrativeContext: 'Hay información contextual adicional disponible.',
    scaleWarning: 'Algunos valores superan el total proporcionado; la longitud de las barras se limita al espacio disponible.'
  }
} satisfies Record<BarDemoLocale, Catalog>;

export interface BarDemoChartContent {
  title: string;
  subtitle: string;
  total: number;
  context: string;
  dataNote: string;
  data: A11yBarChartDatum[];
}

export interface BarDemoPageContent {
  documentTitle: string;
  kicker: string;
  heading: string;
  introduction: string;
  controlsHeading: string;
  scaleLabel: string;
  scaleLargest: string;
  scalePopulationShare: string;
  dataViewLabel: string;
  dialogMode: string;
  inlineMode: string;
  localeLabel: string;
  filteredLabel: string;
  suppressedLabel: string;
  alternateLabel: string;
  noneMode: string;
  showSummary: string;
  showDetails: string;
  showContext: string;
  showActions: string;
  showExplanation: string;
  showGlossary: string;
  showExport: string;
  showCounts: string;
  showPercentages: string;
  showTotal: string;
  explanationExpanded: string;
  glossaryExpanded: string;
  themeLabel: string;
  themeDefault: string;
  themeHighContrast: string;
  textureLabel: string;
  textureNone: string;
  textureDiagonal: string;
  textureDots: string;
  textureHorizontal: string;
  targetStyleLabel: string;
  targetStyleNone: string;
  targetStyleColor: string;
  targetStyleTexture: string;
  targetStyleBoth: string;
  positiveDirectionLabel: string;
  positiveAbove: string;
  positiveBelow: string;
  positiveColorLabel: string;
  negativeColorLabel: string;
  positiveTextureLabel: string;
  negativeTextureLabel: string;
  formatterLabel: string;
  formatterDefault: string;
  formatterCustom: string;
  referenceHeading: string;
  referenceIntroduction: string;
  reportingNotes: string;
  footer: string;
}

export const BAR_DEMO_PAGE_MESSAGES: Record<BarDemoLocale, BarDemoPageContent> = {
  'en-US': {
    documentTitle: 'Accessible bar chart component',
    kicker: 'Accessible reporting component', heading: 'Horizontal bar chart',
    introduction: 'Each chart keeps its complete data, explanation and definitions available alongside the visual comparison.',
    controlsHeading: 'Try the component', scaleLabel: 'Bar scale', scaleLargest: 'Largest value',
    scalePopulationShare: 'Population share', dataViewLabel: 'Data view', dialogMode: 'Dialog', inlineMode: 'Inline disclosure', noneMode: 'None',
    localeLabel: 'Display language', filteredLabel: 'Filtered data', suppressedLabel: 'Suppressed data',
    alternateLabel: 'Use alternate dataset', referenceHeading: 'Reference cases',
    showDetails: 'Explore hover and focus cards',
    showSummary: 'Show summary', showContext: 'Show context', showActions: 'Show actions', showExplanation: 'Show explanation',
    showGlossary: 'Show definitions', showExport: 'Show CSV export', showCounts: 'Show counts', showPercentages: 'Show percentages',
    showTotal: 'Show total', explanationExpanded: 'Open explanation by default', glossaryExpanded: 'Open definitions by default',
    themeLabel: 'Chart theme', themeDefault: 'Reference theme', themeHighContrast: 'High contrast',
    textureLabel: 'Bar texture', textureNone: 'Solid', textureDiagonal: 'Diagonal stripes', textureDots: 'Dots', textureHorizontal: 'Horizontal lines',
    targetStyleLabel: 'Target-based bar appearance', targetStyleNone: 'Off', targetStyleColor: 'Color only', targetStyleTexture: 'Texture only', targetStyleBoth: 'Color and texture',
    positiveDirectionLabel: 'Numeric targets: positive direction', positiveAbove: 'At or above target', positiveBelow: 'At or below target',
    positiveColorLabel: 'Positive bar color', negativeColorLabel: 'Negative bar color', positiveTextureLabel: 'Positive bar texture', negativeTextureLabel: 'Negative bar texture',
    formatterLabel: 'Value formatting', formatterDefault: 'Locale defaults', formatterCustom: 'Custom value prefix',
    referenceIntroduction: 'These examples show the supplied reference cases and update with the selected language and display settings.',
    reportingNotes: 'Reporting notes: all values in this demonstration are illustrative; the example does not publish or retrieve report data.',
    footer: 'Controls update the examples. Each chart keeps its own explanation and glossary disclosure state.'
  },
  'fr-FR': {
    documentTitle: 'Composant accessible de graphique à barres',
    kicker: 'Composant de présentation accessible', heading: 'Graphique à barres horizontales',
    introduction: 'Chaque graphique présente la comparaison visuelle ainsi que toutes les données, explications et définitions.',
    controlsHeading: 'Essayer le composant', scaleLabel: 'Échelle des barres', scaleLargest: 'Valeur la plus élevée',
    scalePopulationShare: 'Part de la population', dataViewLabel: 'Affichage des données', dialogMode: 'Boîte de dialogue',
    inlineMode: 'Dévoilement intégré', noneMode: 'Aucune', localeLabel: 'Langue d’affichage', filteredLabel: 'Données filtrées',
    suppressedLabel: 'Données masquées', alternateLabel: 'Utiliser un autre jeu de données', referenceHeading: 'Exemples de référence',
    showDetails: 'Explorer les cartes au survol et au focus',
    showSummary: 'Afficher le résumé', showContext: 'Afficher le contexte', showActions: 'Afficher les actions', showExplanation: 'Afficher l’explication',
    showGlossary: 'Afficher les définitions', showExport: 'Afficher l’export CSV', showCounts: 'Afficher les nombres', showPercentages: 'Afficher les pourcentages',
    showTotal: 'Afficher le total', explanationExpanded: 'Ouvrir l’explication par défaut', glossaryExpanded: 'Ouvrir les définitions par défaut',
    themeLabel: 'Thème du graphique', themeDefault: 'Thème de référence', themeHighContrast: 'Contraste élevé',
    textureLabel: 'Texture des barres', textureNone: 'Aplat', textureDiagonal: 'Rayures diagonales', textureDots: 'Points', textureHorizontal: 'Lignes horizontales',
    targetStyleLabel: 'Apparence des barres selon la cible', targetStyleNone: 'Désactivée', targetStyleColor: 'Couleur uniquement', targetStyleTexture: 'Texture uniquement', targetStyleBoth: 'Couleur et texture',
    positiveDirectionLabel: 'Cibles numériques : sens positif', positiveAbove: 'À la cible ou au-dessus', positiveBelow: 'À la cible ou en dessous',
    positiveColorLabel: 'Couleur des barres positives', negativeColorLabel: 'Couleur des barres négatives', positiveTextureLabel: 'Texture des barres positives', negativeTextureLabel: 'Texture des barres négatives',
    formatterLabel: 'Format des valeurs', formatterDefault: 'Format selon la langue', formatterCustom: 'Préfixe personnalisé',
    referenceIntroduction: 'Ces exemples présentent les cas de référence fournis et suivent la langue et les options d’affichage sélectionnées.',
    reportingNotes: 'Notes de déclaration : toutes les valeurs de cette démonstration sont illustratives ; cet exemple ne publie ni ne récupère de données de rapport.',
    footer: 'Les commandes mettent à jour les exemples. Chaque graphique conserve l’état de ses explications et définitions.'
  },
  'es-ES': {
    documentTitle: 'Componente accesible de gráficos de barras',
    kicker: 'Componente accesible para informes', heading: 'Gráfico de barras horizontales',
    introduction: 'Cada gráfico muestra la comparación visual junto con todos sus datos, explicaciones y definiciones.',
    controlsHeading: 'Prueba el componente', scaleLabel: 'Escala de las barras', scaleLargest: 'Valor más alto',
    scalePopulationShare: 'Proporción de la población', dataViewLabel: 'Vista de datos', dialogMode: 'Diálogo',
    inlineMode: 'Despliegue integrado', noneMode: 'Ninguna', localeLabel: 'Idioma de visualización', filteredLabel: 'Datos filtrados',
    suppressedLabel: 'Datos suprimidos', alternateLabel: 'Usar otro conjunto de datos', referenceHeading: 'Casos de referencia',
    showDetails: 'Explorar tarjetas al pasar el cursor y enfocar',
    showSummary: 'Mostrar resumen', showContext: 'Mostrar contexto', showActions: 'Mostrar acciones', showExplanation: 'Mostrar explicación',
    showGlossary: 'Mostrar definiciones', showExport: 'Mostrar exportación CSV', showCounts: 'Mostrar recuentos', showPercentages: 'Mostrar porcentajes',
    showTotal: 'Mostrar total', explanationExpanded: 'Abrir explicación de forma predeterminada', glossaryExpanded: 'Abrir definiciones de forma predeterminada',
    themeLabel: 'Tema del gráfico', themeDefault: 'Tema de referencia', themeHighContrast: 'Alto contraste',
    textureLabel: 'Textura de las barras', textureNone: 'Sólido', textureDiagonal: 'Rayas diagonales', textureDots: 'Puntos', textureHorizontal: 'Líneas horizontales',
    targetStyleLabel: 'Apariencia de barras según la meta', targetStyleNone: 'Desactivada', targetStyleColor: 'Solo color', targetStyleTexture: 'Solo textura', targetStyleBoth: 'Color y textura',
    positiveDirectionLabel: 'Metas numéricas: dirección positiva', positiveAbove: 'En la meta o por encima', positiveBelow: 'En la meta o por debajo',
    positiveColorLabel: 'Color de barras positivas', negativeColorLabel: 'Color de barras negativas', positiveTextureLabel: 'Textura de barras positivas', negativeTextureLabel: 'Textura de barras negativas',
    formatterLabel: 'Formato de valores', formatterDefault: 'Formato según el idioma', formatterCustom: 'Prefijo personalizado',
    referenceIntroduction: 'Estos ejemplos muestran los casos de referencia y se actualizan según el idioma y las opciones de visualización.',
    reportingNotes: 'Notas del informe: todos los valores de esta demostración son ilustrativos; el ejemplo no publica ni recupera datos de informes.',
    footer: 'Los controles actualizan los ejemplos. Cada gráfico conserva el estado de sus explicaciones y definiciones.'
  }
};

const definitions = {
  'en-US': ['Illustrative category label for this component example.', 'Children served in a community-based setting.', 'Children whose setting is classified in another way.'],
  'fr-FR': ['Libellé de catégorie illustratif pour cet exemple de composant.', 'Enfants accompagnés dans un milieu communautaire.', 'Enfants dont le milieu est classé dans une autre catégorie.'],
  'es-ES': ['Etiqueta de categoría ilustrativa para este ejemplo del componente.', 'Niños atendidos en un entorno comunitario.', 'Niños cuyo entorno se clasifica de otra manera.']
} as const;

export function getBarDemoContent(locale: BarDemoLocale): BarDemoChartContent[] {
  const authored = ({
    'en-US': {
      primary: ['Reported population by group', 'Example report · 2025', 'Reporting group for <strong>children served in 2025</strong>. See the <a href="#reporting-notes">reporting notes</a>.'],
      alternate: ['Population by service area', 'Illustrative report · 2025', 'Illustrative counts across three service areas.'],
      secondary: ['Reporting status', 'Separate data and preferences', 'Submission status across the reporting network.'],
      sex: ['Reported population by sex', 'Illustrative values · 27 total', 'Illustrative values for this component example.'],
      settings: ['Reported setting counts', 'Illustrative values · 510 total', 'Illustrative setting counts; one value is suppressed for privacy.'],
      alternateDefinitions: ['Programs in the northern service area.', 'Programs in the central service area.', 'Programs in the southern service area.'],
      dataNotes: ['Counts are illustrative and preserve the supplied reference values.', 'Some reporting statuses are not numeric values.', 'The two illustrative categories total 27.', 'The zero value stands for a protected count and is suppressed for privacy in this example.', 'The alternative dataset totals 100.'],
      labels: ['Home', 'Community-based', 'Other', 'Northern service area', 'Central service area', 'Southern service area', 'Complete reports', 'Pending reports', 'Not reported', 'Male', 'Female', 'Home setting', 'Community setting', 'Other setting']
    },
    'fr-FR': {
      primary: ['Population déclarée par groupe', 'Exemple de rapport · 2025', 'Groupe déclarant les <strong>enfants accompagnés en 2025</strong>. Consultez les <a href="#reporting-notes">notes de déclaration</a>.'],
      alternate: ['Population par zone de service', 'Rapport illustratif · 2025', 'Nombres illustratifs pour trois zones de service.'],
      secondary: ['État des déclarations', 'Données et préférences distinctes', 'État des déclarations dans le réseau.'],
      sex: ['Population déclarée par sexe', 'Valeurs illustratives · total de 27', 'Valeurs illustratives pour cet exemple de composant.'],
      settings: ['Nombres déclarés par milieu', 'Valeurs illustratives · total de 510', 'Nombres illustratifs par milieu ; une valeur est masquée pour protéger la confidentialité.'],
      alternateDefinitions: ['Programmes de la zone de service nord.', 'Programmes de la zone de service centrale.', 'Programmes de la zone de service sud.'],
      dataNotes: ['Les nombres sont illustratifs et conservent les valeurs de référence fournies.', 'Certains états de déclaration ne sont pas des valeurs numériques.', 'Les deux catégories illustratives totalisent 27.', 'La valeur zéro représente un effectif protégé et est masquée pour protéger la vie privée dans cet exemple.', 'Le jeu de données alternatif totalise 100.'],
      labels: ['Domicile', 'Milieu communautaire', 'Autre', 'Zone de service nord', 'Zone de service centrale', 'Zone de service sud', 'Rapports complets', 'Rapports en attente', 'Non déclaré', 'Hommes', 'Femmes', 'Milieu familial', 'Milieu communautaire', 'Autre milieu']
    },
    'es-ES': {
      primary: ['Población notificada por grupo', 'Informe de ejemplo · 2025', 'Grupo que notifica a los <strong>niños atendidos en 2025</strong>. Consulta las <a href="#reporting-notes">notas del informe</a>.'],
      alternate: ['Población por zona de servicio', 'Informe ilustrativo · 2025', 'Recuentos ilustrativos en tres zonas de servicio.'],
      secondary: ['Estado de los informes', 'Datos y preferencias independientes', 'Estado de los envíos en la red de informes.'],
      sex: ['Población notificada por sexo', 'Valores ilustrativos · total de 27', 'Valores ilustrativos para este ejemplo del componente.'],
      settings: ['Recuentos notificados por entorno', 'Valores ilustrativos · total de 510', 'Recuentos ilustrativos por entorno; se suprime un valor para proteger la privacidad.'],
      alternateDefinitions: ['Programas de la zona de servicio norte.', 'Programas de la zona de servicio central.', 'Programas de la zona de servicio sur.'],
      dataNotes: ['Los recuentos son ilustrativos y conservan los valores de referencia proporcionados.', 'Algunos estados de informe no son valores numéricos.', 'Las dos categorías ilustrativas suman 27.', 'El valor cero representa un recuento protegido y se suprime para proteger la privacidad en este ejemplo.', 'El conjunto de datos alternativo suma 100.'],
      labels: ['Hogar', 'Entorno comunitario', 'Otro', 'Zona de servicio norte', 'Zona de servicio central', 'Zona de servicio sur', 'Informes completos', 'Informes pendientes', 'No informado', 'Hombres', 'Mujeres', 'Entorno del hogar', 'Entorno comunitario', 'Otro entorno']
    }
  } as const)[locale];
  const [home, community, other] = definitions[locale] as readonly [string, string, string];
  const [homeLabel, communityLabel, otherLabel, north, central, south, complete, pending, notReported, male, female, homeSetting, communitySetting, otherSetting] = authored.labels as readonly [string, string, string, string, string, string, string, string, string, string, string, string, string, string];
  const chart = (copy: readonly [string, string, string], dataNote: string, total: number, data: A11yBarChartDatum[]): BarDemoChartContent => ({ title: copy[0], subtitle: copy[1], context: `<p>${copy[2]}</p>`, dataNote: `<p>${dataNote}</p>`, total, data });
  return [
    chart(authored.primary, authored.dataNotes[0], 125, [
      { id: 'home', label: homeLabel, value: 89, definition: `<p>${home}</p>` },
      { id: 'community', label: communityLabel, value: 25, definition: `<p>${community}</p>` },
      { id: 'other', label: otherLabel, value: 11, definition: `<p>${other}</p>` }
    ]),
    chart(authored.secondary, authored.dataNotes[1], 90, [
      { id: 'complete', label: complete, value: 72, target: { min: 70, max: 80 } }, { id: 'pending', label: pending, value: 18, target: { min: 0, max: 15 } }, { id: 'not-reported', label: notReported, value: null, target: { min: 0, max: 5 } }
    ]),
    chart(authored.sex, authored.dataNotes[2], 27, [{ id: 'male', label: male, value: 14 }, { id: 'female', label: female, value: 13 }]),
    chart(authored.settings, authored.dataNotes[3], 510, [
      { id: 'home-setting', label: homeSetting, value: 290 }, { id: 'community-setting', label: communitySetting, value: 220 }, { id: 'other-setting', label: otherSetting, value: 0 }
    ]),
    chart(authored.alternate, authored.dataNotes[4], 100, [
      { id: 'north', label: north, value: 46, definition: `<p>${authored.alternateDefinitions[0]}</p>` },
      { id: 'central', label: central, value: 35, definition: `<p>${authored.alternateDefinitions[1]}</p>` },
      { id: 'south', label: south, value: 19, definition: `<p>${authored.alternateDefinitions[2]}</p>` }
    ])
  ];
}
