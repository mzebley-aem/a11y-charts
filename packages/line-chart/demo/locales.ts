import { ENGLISH_LINE_CHART_MESSAGES } from '../src/messages.js';

export type DemoLocale = 'en-US' | 'fr-FR' | 'es-ES';
type EnglishMessageKey = keyof typeof ENGLISH_LINE_CHART_MESSAGES;
type CompleteDemoMessages = Record<EnglishMessageKey, string>;

/** Complete demo dictionaries. The component still falls back to English for partial consumer overrides. */
export const LINE_DEMO_MESSAGES: Record<DemoLocale, CompleteDemoMessages> = {
  'en-US': ENGLISH_LINE_CHART_MESSAGES,
  'fr-FR': {
    title: 'Résultats réels et objectifs', summaryLabel: 'Résumé du graphique', controlsLabel: 'Options d’affichage', valuesLegend: 'Valeurs',
    actualLine: 'Courbe « {series} »', targetLine: 'Courbe « {series} »', actualValue: 'Libellé de {series}', targetValueLabel: 'Libellé de {series}', actualFill: 'Zone « {series} »', targetFill: 'Zone « {series} »',
    tooltipVisible: 'Info-bulle visible', xAxisTitle: 'Titre de l’axe horizontal', yAxisTitle: 'Titre de l’axe vertical', zoomYAxis: 'Ajuster l’échelle verticale', restoreYAxis: 'Rétablir l’échelle verticale complète',
    patternType: 'Motif de « {series} » :', patternSet: 'Motif de « {series} » : {value}', patternNone: 'Aucun', patternDiagonal: 'Diagonales', patternDots: 'Points', patternHorizontal: 'Lignes horizontales',
    enabled: '{label} activé', disabled: '{label} désactivé', seriesShown: '{series} affiché', seriesHidden: '{series} masqué', stepperStatus: '{period} · {position} sur {total}',
    keyboardHelp: 'Navigation au clavier : placez le focus sur le graphique, puis utilisez les flèches gauche et droite pour parcourir les périodes. Début va à la première période et Fin à la dernière. Le contenu de l’info-bulle est annoncé pendant la navigation.',
    overflowHelp: 'Le graphique dépasse l’espace disponible. La valeur sélectionnée défile dans la vue pendant la navigation.',
    navigatorLabel: 'Utilisez les flèches gauche et droite pour parcourir les périodes. Début va à la première période et Fin à la dernière. Période actuelle : {period}, {position} sur {total}.',
    noData: 'Aucune donnée de graphique disponible. Fournissez au moins un point de données.', invalidData: '{message} Vérifiez les données fournies au graphique.',
    invalidBaseline: '{message} Le graphique reste disponible sans contexte de référence ; vérifiez la référence fournie au graphique.',
    previous: 'Précédent', next: 'Suivant', navigationLabel: 'Navigation entre les périodes du graphique', previousPeriod: 'Période précédente', previousPeriodAt: 'Période précédente : {period}', nextPeriod: 'Période suivante', nextPeriodAt: 'Période suivante : {period}',
    dataAction: 'Voir les données complètes', dataHeading: 'Données du graphique', closeData: 'Fermer les données', inlineData: 'Voir les données complètes',
    exportCsv: 'Télécharger le CSV', exportUnavailable: 'L’export CSV n’est pas disponible dans ce navigateur.', explain: 'Explications', hideExplanation: 'Masquer les explications', glossary: 'Glossaire', hideGlossary: 'Masquer le glossaire', explanationHeading: 'Explication du graphique', glossaryHeading: 'Glossaire du graphique', filteredIndicator: 'Données filtrées', suppressionIndicator: 'Certaines valeurs sont masquées.', suppressionNote: 'Certaines valeurs sont masquées pour protéger la confidentialité.', suppressed: 'Valeur masquée', contextLabel: 'Contexte', dataNoteLabel: 'Note sur les données', periodExplanations: 'Explications par période',
    actualSuppressed: 'La valeur de {series} est masquée.', summaryAllSuppressed: 'Les valeurs publiées pour {period} sont protégées ; le résultat par rapport à l’objectif ne peut pas être déterminé.', summaryLatestSuppressed: 'La dernière valeur de {series} pour {period} est masquée ; aucune comparaison n’est disponible.',
    chartRole: 'série chronologique interactive', invalidMessages: 'L’attribut messages doit contenir un JSON valide avec des clés de message prises en charge et des valeurs textuelles.',
    dataCaption: '{actual} et {target} sous forme de {unit} par période.', dataCaptionBaseline: '{actual} et {target} sous forme de {unit} par période. {baseline} : {period}, {value}.',
    targetOutcome: 'Résultat par rapport à l’objectif', changeFrom: 'Écart par rapport à {series}', baselineContext: 'Contexte de {series} : {message}', baselineDescription: '{series} : {period}, {value}. {message}',
    unitPercentages: 'pourcentages', unitValues: 'valeurs', percentSuffix: ' %', rangeWithin: 'dans la plage cible ({series})', rangeLowerBound: 'limite inférieure de la plage ({series})', rangeUpperBound: 'limite supérieure de la plage ({series})',
    differenceEqual: 'Écart nul par rapport à « {comparison} »', differenceRelative: 'Écart de {formatted} par rapport à « {comparison} » : {relation}', outcomeMet: 'Objectif atteint', outcomeMetEqual: 'Objectif atteint — valeur égale à l’objectif', outcomeNotMet: 'Objectif non atteint', outcomeUnavailable: 'Résultat par rapport à l’objectif indisponible', outcomeUnavailableSentence: 'Résultat par rapport à l’objectif indisponible.',
    narrativePeriod: '{period}, {position} sur {total}.', noActual: 'Aucune valeur de {series} n’a été publiée.', noTarget: 'Aucune valeur de {series} n’a été publiée.', noTargetOutcome: 'Résultat par rapport à l’objectif indisponible.',
    targetValue: '{series} : {value}.', narrativeOutcome: '{outcome}.', periodTargetOutcome: '{outcome} en {period}.', actualValueSentence: '{series} : {value}.', withinNarrative: '{series} est {description}.', differenceSentence: '{description}.',
    summaryNone: 'Aucun résultat publié pour le moment.', summaryCannotDetermine: 'Le résultat par rapport à l’objectif ne peut pas être déterminé pour {period}.', summaryMissingTarget: '{actual} était de {value}, mais aucune valeur de {target} n’a été publiée.',
    summaryMetEqual: 'Objectif atteint en {period} — valeur égale à l’objectif.', summaryWithin: 'Objectif atteint en {period} — valeur dans la plage.', summaryOutcome: '{outcome} en {period}.',
    summaryEqual: '{actual} a égalé « {target} » à {value}.', summaryComparison: '{actual} : {actualValue}. {target} : {targetValue}. {description}.',
    summaryBaseline: '{actual} : {description} (référence : {value}).', summaryBaselineOnly: '{series} est de {value} en {period}.', summaryNoLater: 'Aucune donnée de {series} n’a été publiée après {period}.',
    'summaryPeriods.one': 'Période comparable publiée : {total} ; périodes avec objectif atteint : {met}.', 'summaryPeriods.other': 'Périodes comparables publiées : {total} ; périodes avec objectif atteint : {met}.',
    tableActualHeader: '{series}{suffix}', tableTargetHeader: '{series}{suffix}', missing: 'Non communiqué', baselineLabel: 'Référence', targetLabel: 'Objectif', actualLabel: 'Résultat',
    defaultXAxisTitle: 'Année', defaultYAxisTitle: 'Pourcentage', pointAnnouncement: '{narrative}', 'dataUpdated.one': 'Données du graphique mises à jour. {count} période est disponible.', 'dataUpdated.other': 'Données du graphique mises à jour. {count} périodes sont disponibles.',
    validationInvalidRange: 'Les limites de la plage d’objectifs doivent être des nombres finis, et la limite minimale ne peut pas dépasser la maximale.',
    validationInvalidBaseline: 'La référence doit comporter une valeur finie et une période présente dans les données du graphique.',
    validationBaselineObject: 'La référence du graphique doit être un objet avec des propriétés x et value.', validationBaselineX: 'La référence du graphique doit comporter une valeur x valide.', validationBaselineValue: 'La référence du graphique doit comporter une valeur numérique finie.',
    validationBaselineExplanation: 'L’explication de la référence doit être du texte.', validationBaselinePeriod: 'La période x de référence doit correspondre à la première période affichée.',
    validationDataArray: 'Les données du graphique doivent être un tableau.', validationDataItemObject: 'L’élément de données {index} doit être un objet.', validationDataX: 'L’élément de données {index} doit comporter une valeur x ou une année valide.',
    validationDataActual: 'L’élément de données {index} doit comporter une valeur réelle numérique finie ou nulle.', validationDataTarget: 'L’élément de données {index} doit comporter une valeur d’objectif numérique finie, nulle ou une plage dont les limites min et max sont finies et où min ≤ max.',
    differenceNumber: '{value}', 'differencePercent.one': '{value} point de pourcentage', 'differencePercent.other': '{value} points de pourcentage',
    tooltipHeader: '{period}', tooltipActual: '{series} : {value}', tooltipTarget: '{series} : {value}', tooltipDifferenceEqual: '{actual} est égal à {target}', tooltipDifference: '{actual} est {description}', tooltipDifferenceText: '{description}.', rangeSeparator: 'à',
    tooltipRange: 'Plage de {series} : de {minimum} à {maximum}', tooltipAria: '{period}, {actual}, {target}. {description}', relationAbove: 'au-dessus', relationBelow: 'en dessous', relationEqual: 'à égalité', relationWithin: 'dans', relationIncomplete: 'incomplet',
    baselineDifference: 'la valeur de référence pour {period}', lower: 'inférieure', upper: 'supérieure'
  },
  'es-ES': {
    title: 'Resultados reales y metas', summaryLabel: 'Resumen del gráfico', controlsLabel: 'Opciones de visualización', valuesLegend: 'Valores',
    actualLine: 'Línea de {series}', targetLine: 'Línea de {series}', actualValue: 'Etiqueta de {series}', targetValueLabel: 'Etiqueta de {series}', actualFill: 'Relleno de {series}', targetFill: 'Relleno de {series}',
    tooltipVisible: 'Información emergente visible', xAxisTitle: 'Título del eje horizontal', yAxisTitle: 'Título del eje vertical', zoomYAxis: 'Ajustar escala vertical', restoreYAxis: 'Restaurar la escala vertical completa',
    patternType: 'Patrón de {series}:', patternSet: 'Patrón de {series}: {value}', patternNone: 'Ninguno', patternDiagonal: 'Diagonal', patternDots: 'Puntos', patternHorizontal: 'Líneas horizontales',
    enabled: '{label} activado', disabled: '{label} desactivado', seriesShown: '{series} visible', seriesHidden: '{series} oculto', stepperStatus: '{period} · {position} de {total}',
    keyboardHelp: 'Navegación con teclado: enfoque el gráfico y use las flechas izquierda y derecha para recorrer los periodos. Inicio va al primer periodo y Fin al último. El contenido de la información emergente se anuncia durante la navegación.',
    overflowHelp: 'El gráfico es más ancho que el espacio disponible. El valor seleccionado se desplaza a la vista durante la navegación.',
    navigatorLabel: 'Use las flechas izquierda y derecha para recorrer los periodos. Inicio va al primer periodo y Fin al último. Periodo actual: {period}, {position} de {total}.',
    noData: 'No hay datos disponibles para el gráfico. Proporcione al menos un punto de datos.', invalidData: '{message} Revise los datos proporcionados al gráfico.',
    invalidBaseline: '{message} El gráfico sigue disponible sin el contexto de referencia; revise la referencia proporcionada.',
    previous: 'Anterior', next: 'Siguiente', navigationLabel: 'Navegación por periodos del gráfico', previousPeriod: 'Periodo anterior', previousPeriodAt: 'Periodo anterior: {period}', nextPeriod: 'Periodo siguiente', nextPeriodAt: 'Periodo siguiente: {period}',
    dataAction: 'Ver datos completos', dataHeading: 'Datos del gráfico', closeData: 'Cerrar los datos', inlineData: 'Ver datos completos',
    exportCsv: 'Descargar CSV', exportUnavailable: 'La exportación CSV no está disponible en este navegador.', explain: 'Explicación', hideExplanation: 'Ocultar explicación', glossary: 'Glosario', hideGlossary: 'Ocultar glosario', explanationHeading: 'Explicación del gráfico', glossaryHeading: 'Glosario del gráfico', filteredIndicator: 'Datos filtrados', suppressionIndicator: 'Algunos valores están protegidos.', suppressionNote: 'Algunos valores están protegidos para preservar la privacidad.', suppressed: 'Valor protegido', contextLabel: 'Contexto', dataNoteLabel: 'Nota sobre los datos', periodExplanations: 'Explicaciones por periodo',
    actualSuppressed: 'El valor de {series} está protegido.', summaryAllSuppressed: 'Los valores informados para {period} están protegidos; no se puede determinar el resultado respecto a la meta.', summaryLatestSuppressed: 'El último valor de {series} para {period} está protegido; no hay comparación disponible.',
    chartRole: 'serie temporal interactiva', invalidMessages: 'El atributo messages debe contener JSON válido con claves de mensaje admitidas y valores de texto.',
    dataCaption: '{actual} y {target} expresados como {unit} por periodo.', dataCaptionBaseline: '{actual} y {target} expresados como {unit} por periodo. {baseline}: {period}, {value}.',
    targetOutcome: 'Resultado respecto a la meta', changeFrom: 'Cambio respecto a {series}', baselineContext: 'Contexto de {series}: {message}', baselineDescription: '{series}: {period}, {value}. {message}',
    unitPercentages: 'porcentajes', unitValues: 'valores', percentSuffix: ' %', rangeWithin: 'dentro del rango ({series})', rangeLowerBound: 'límite inferior del rango ({series})', rangeUpperBound: 'límite superior del rango ({series})',
    differenceEqual: 'Diferencia nula respecto a «{comparison}»', differenceRelative: 'Diferencia de {formatted} respecto a «{comparison}»: {relation}', outcomeMet: 'Meta alcanzada', outcomeMetEqual: 'Meta alcanzada — en la meta', outcomeNotMet: 'Meta no alcanzada', outcomeUnavailable: 'Resultado respecto a la meta no disponible', outcomeUnavailableSentence: 'Resultado respecto a la meta no disponible.',
    narrativePeriod: '{period}, {position} de {total}.', noActual: 'No se ha informado ningún valor de {series}.', noTarget: 'No se ha informado ningún valor de {series}.', noTargetOutcome: 'Resultado respecto a la meta no disponible.',
    targetValue: '{series}: {value}.', narrativeOutcome: '{outcome}.', periodTargetOutcome: '{outcome} en {period}.', actualValueSentence: '{series}: {value}.', withinNarrative: '{series} está {description}.', differenceSentence: '{description}.',
    summaryNone: 'Todavía no hay resultados informados.', summaryCannotDetermine: 'No se puede determinar el resultado respecto a la meta para {period}.', summaryMissingTarget: 'No se informó ningún valor de {target}, aunque {actual} registró {value}.',
    summaryMetEqual: 'Meta alcanzada en {period} — el valor coincide con la meta.', summaryWithin: 'Meta alcanzada en {period} — dentro del rango.', summaryOutcome: '{outcome} en {period}.',
    summaryEqual: '{actual} igualó «{target}» en {value}.', summaryComparison: '{actual}: {actualValue}. {target}: {targetValue}. {description}.',
    summaryBaseline: '{actual}: {description} (referencia: {value}).', summaryBaselineOnly: '{series} es {value} en {period}.', summaryNoLater: 'No se informaron datos de {series} después de {period}.',
    'summaryPeriods.one': 'Periodo comparable informado: {total}; periodos con la meta alcanzada: {met}.', 'summaryPeriods.other': 'Periodos comparables informados: {total}; periodos con la meta alcanzada: {met}.',
    tableActualHeader: '{series}{suffix}', tableTargetHeader: '{series}{suffix}', missing: 'No informado', baselineLabel: 'Referencia', targetLabel: 'Meta', actualLabel: 'Resultado',
    defaultXAxisTitle: 'Año', defaultYAxisTitle: 'Porcentaje', pointAnnouncement: '{narrative}', 'dataUpdated.one': 'Datos del gráfico actualizados. Hay {count} periodo disponible.', 'dataUpdated.other': 'Datos del gráfico actualizados. Hay {count} periodos disponibles.',
    validationInvalidRange: 'Los límites del rango de metas deben ser números finitos y el mínimo no puede superar el máximo.',
    validationInvalidBaseline: 'La referencia debe incluir un valor finito y un periodo presente en los datos del gráfico.',
    validationBaselineObject: 'La referencia del gráfico debe ser un objeto con propiedades x y value.', validationBaselineX: 'La referencia del gráfico necesita un valor x válido.', validationBaselineValue: 'La referencia del gráfico necesita un valor numérico finito.',
    validationBaselineExplanation: 'La explicación de la referencia debe ser texto.', validationBaselinePeriod: 'El periodo x de referencia debe coincidir con el primer periodo mostrado.',
    validationDataArray: 'Los datos del gráfico deben ser una matriz.', validationDataItemObject: 'El elemento de datos {index} debe ser un objeto.', validationDataX: 'El elemento de datos {index} necesita un valor x o año válido.',
    validationDataActual: 'El elemento de datos {index} necesita un valor real numérico finito o nulo.', validationDataTarget: 'El elemento de datos {index} necesita una meta numérica finita, nula o un rango con límites min y max finitos donde min ≤ max.',
    differenceNumber: '{value}', 'differencePercent.one': '{value} punto porcentual', 'differencePercent.other': '{value} puntos porcentuales',
    tooltipHeader: '{period}', tooltipActual: '{series}: {value}', tooltipTarget: '{series}: {value}', tooltipDifferenceEqual: '{actual} es igual a {target}', tooltipDifference: '{actual} está {description}', tooltipDifferenceText: '{description}.', rangeSeparator: 'a',
    tooltipRange: 'Rango de {series}: de {minimum} a {maximum}', tooltipAria: '{period}, {actual}, {target}. {description}', relationAbove: 'por encima', relationBelow: 'por debajo', relationEqual: 'igual', relationWithin: 'dentro de', relationIncomplete: 'incompleto',
    baselineDifference: 'la referencia para {period}', lower: 'inferior', upper: 'superior'
  }
} satisfies Record<DemoLocale, CompleteDemoMessages>;

export interface LineDemoContent {
  documentTitle: string;
  pageTitle: string;
  introduction: string;
  controlsHeading: string;
  languageLabel: string;
  languageOptions: readonly [string, string, string];
  dialogButton: string;
  inlineButton: string;
  updateButton: string;
  updateHelp: string;
  sharedOptionsLegend: string;
  sharedOptions: readonly [string, string, string, string, string, string, string, string];
  dataNote: string;
  definitionLabel: string;
  definitionText: string;
  chartTitles: readonly [string, string, string];
  subtitles: readonly [string, string, string];
  contextNotes: readonly [string, string, string];
  baselineExplanations: readonly [string, string];
  actualSeriesLabel: string;
  targetSeriesLabel: string;
  baselineSeriesLabel: string;
  yearLabel: string;
  quarterLabel: string;
  percentLabel: string;
  quarterPeriods: readonly string[];
}

/** Authored demo copy kept separate from generated chart messages. */
export const LINE_DEMO_CONTENT: Record<DemoLocale, LineDemoContent> = {
  'en-US': {
    documentTitle: 'Accessible line chart Web Component parity fixture', pageTitle: 'Accessible line chart examples',
    introduction: 'Compare reported results with goals, inspect a target range, and try the data views and language controls.',
    controlsHeading: 'Demo controls', languageLabel: 'Language', languageOptions: ['English (United States)', 'French', 'Spanish'], dialogButton: 'Use data dialog', inlineButton: 'Use inline data', updateButton: 'Update chart data',
    updateHelp: 'Keep the data dialog open while updating the chart to hear one concise update and confirm focus stays on Close data.',
    sharedOptionsLegend: 'Shared chart options', sharedOptions: ['Show summary', 'Show context', 'Show action strip', 'Show explanations', 'Show glossary', 'Show CSV export', 'Mark data as filtered', 'Suppress a sample value'],
    dataNote: 'Values are <strong>shown as reported</strong>; suppressed values remain in the period list.', definitionLabel: 'Reported result', definitionText: 'The observed value for each reporting period.',
    chartTitles: ['Actual vs Target Performance', 'Assessment Data (Historical + Targets)', 'Performance within a target range'],
    subtitles: ['Prototype accessible chart component', 'Second instance proof of concept', 'Dashed boundaries and shading show the inclusive target range'],
    contextNotes: [
      'Targets after 2020 are planned values; actual results have not yet been reported.',
      'Compare this second measure with its own reporting history and baseline.',
      'The goal is a range. Values on either boundary count as within the target range.'
    ],
    baselineExplanations: [
      'A policy and reporting-strategy change took effect in 2015, so earlier results are not comparable.',
      'The 2015 reporting methodology defines the comparison boundary for this measure.'
    ],
    actualSeriesLabel: 'Actual', targetSeriesLabel: 'Target', baselineSeriesLabel: 'Baseline', yearLabel: 'Year', quarterLabel: 'Quarter', percentLabel: 'Percent',
    quarterPeriods: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter', '5th quarter', '6th quarter']
  },
  'fr-FR': {
    documentTitle: 'Exemples du composant de graphique linéaire accessible', pageTitle: 'Exemples de graphiques linéaires accessibles',
    introduction: 'Comparez les résultats publiés aux objectifs, examinez une plage cible et testez les vues de données et les langues.',
    controlsHeading: 'Commandes de démonstration', languageLabel: 'Langue', languageOptions: ['anglais (États-Unis)', 'français', 'espagnol'], dialogButton: 'Utiliser la boîte de dialogue', inlineButton: 'Afficher les données dans la page', updateButton: 'Mettre à jour les données',
    updateHelp: 'Laissez la boîte de dialogue ouverte pendant la mise à jour pour entendre une annonce concise et vérifier que le focus reste sur Fermer les données.',
    sharedOptionsLegend: 'Options communes des graphiques', sharedOptions: ['Afficher le résumé', 'Afficher le contexte', 'Afficher les actions', 'Afficher les explications', 'Afficher le glossaire', 'Afficher l’export CSV', 'Signaler des données filtrées', 'Masquer une valeur exemple'],
    dataNote: 'Les valeurs sont <strong>présentées telles que publiées</strong> ; les valeurs masquées restent dans la liste des périodes.', definitionLabel: 'Résultat publié', definitionText: 'Valeur observée pour chaque période de publication.',
    chartTitles: ['Résultats réels et objectifs', 'Données d’évaluation (historique et objectifs)', 'Résultats dans une plage cible'],
    subtitles: ['Prototype de composant de graphique accessible', 'Deuxième instance de démonstration', 'Les limites en pointillés et la zone ombrée indiquent la plage cible inclusive'],
    contextNotes: [
      'Les objectifs après 2020 sont des valeurs prévues ; les résultats réels ne sont pas encore publiés.',
      'Comparez cette deuxième mesure à son historique et à sa propre référence.',
      'L’objectif est une plage. Les valeurs sur l’une ou l’autre limite sont considérées comme dans la plage.'
    ],
    baselineExplanations: [
      'Un changement de politique et de stratégie de publication a pris effet en 2015 ; les résultats antérieurs ne sont donc pas comparables.',
      'La méthode de publication de 2015 définit la limite de comparaison de cette mesure.'
    ],
    actualSeriesLabel: 'Résultat', targetSeriesLabel: 'Objectif', baselineSeriesLabel: 'Référence', yearLabel: 'Année', quarterLabel: 'Trimestre', percentLabel: 'Pourcentage',
    quarterPeriods: ['1er trimestre', '2e trimestre', '3e trimestre', '4e trimestre', '5e trimestre', '6e trimestre']
  },
  'es-ES': {
    documentTitle: 'Ejemplos del componente accesible de gráficos de líneas', pageTitle: 'Ejemplos de gráficos de líneas accesibles',
    introduction: 'Compare los resultados informados con las metas, examine un rango y pruebe las vistas de datos y los idiomas.',
    controlsHeading: 'Controles de la demostración', languageLabel: 'Idioma', languageOptions: ['inglés (Estados Unidos)', 'francés', 'español'], dialogButton: 'Usar cuadro de datos', inlineButton: 'Mostrar datos en la página', updateButton: 'Actualizar datos del gráfico',
    updateHelp: 'Deje abierto el cuadro de datos mientras actualiza el gráfico para escuchar un aviso breve y confirmar que el foco permanece en Cerrar los datos.',
    sharedOptionsLegend: 'Opciones comunes de los gráficos', sharedOptions: ['Mostrar resumen', 'Mostrar contexto', 'Mostrar acciones', 'Mostrar explicaciones', 'Mostrar glosario', 'Mostrar exportación CSV', 'Marcar datos como filtrados', 'Proteger un valor de ejemplo'],
    dataNote: 'Los valores se <strong>muestran tal como se informaron</strong>; los valores protegidos permanecen en la lista de periodos.', definitionLabel: 'Resultado informado', definitionText: 'Valor observado para cada periodo de informe.',
    chartTitles: ['Resultados reales y metas', 'Datos de evaluación (históricos y metas)', 'Resultados dentro de un rango meta'],
    subtitles: ['Prototipo de componente accesible de gráficos', 'Segunda instancia de demostración', 'Los límites discontinuos y el sombreado muestran el rango meta inclusivo'],
    contextNotes: [
      'Las metas posteriores a 2020 son valores planificados; todavía no se han informado resultados reales.',
      'Compare esta segunda medida con su propio historial y referencia.',
      'La meta es un rango. Los valores en cualquiera de los límites cuentan como dentro del rango.'
    ],
    baselineExplanations: [
      'En 2015 entró en vigor un cambio de política y estrategia de informes, por lo que los resultados anteriores no son comparables.',
      'La metodología de informes de 2015 define el límite de comparación para esta medida.'
    ],
    actualSeriesLabel: 'Resultado', targetSeriesLabel: 'Meta', baselineSeriesLabel: 'Referencia', yearLabel: 'Año', quarterLabel: 'Trimestre', percentLabel: 'Porcentaje',
    quarterPeriods: ['1.er trimestre', '2.º trimestre', '3.er trimestre', '4.º trimestre', '5.º trimestre', '6.º trimestre']
  }
};
