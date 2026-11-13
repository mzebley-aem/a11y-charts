export { ENGLISH_MESSAGES } from '../../packages/segmented-bar-chart/src/core.js';
import { ENGLISH_MESSAGES } from '../../packages/segmented-bar-chart/src/core.js';
import { BAR_DEMO_MESSAGES } from '../../packages/bar-chart/demo/locales.js';

// Reuse the complete, reviewed bar-demo catalogs for shared messages and
// supply segmented-specific translations for the examples on this page.
export const catalogs = {
  'en-US': { ...ENGLISH_MESSAGES },
  'fr-FR': { ...ENGLISH_MESSAGES, ...BAR_DEMO_MESSAGES['fr-FR'],
    otherCategories: 'Autres catégories', incompleteValue: 'Incomplet', validationInvalidGrouping: 'La configuration du regroupement est invalide.', validationInvalidGroupingHighlight: 'La catégorie mise en évidence {label} ({id}) serait regroupée. Choisissez des catégories qui la gardent séparée.',
    title: 'Graphique', subtitle: '', filtered: 'Filtré', suppressed: 'Masqué', empty: 'Aucune catégorie disponible.', unavailable: 'Indisponible', totalUnavailable: 'Indisponible', total: 'Total',
    invalidData: 'Les données du graphique sont invalides. Vérifiez les catégories et les valeurs.', invalidMessages: 'Les messages ne sont pas un JSON valide.', mismatch: 'Les catégories ne correspondent pas au total. Fournissez une répartition complète ou utilisez le mode comparaison.', comparisonRequiresTotal: 'La comparaison exige une catégorie et un total explicite.', overflow: 'Les valeurs dépassent la plage numérique prise en charge.',
    validationInvalidData: 'Fournissez une liste de catégories.', validationInvalidRecord: 'La catégorie {position} est invalide. Fournissez un identifiant, un libellé et une valeur non négative ou null.', validationEmptyId: 'Chaque catégorie doit avoir un identifiant.', validationDuplicateId: 'L’identifiant {id} est répété.', validationInvalidLabel: 'La catégorie {id} doit avoir un libellé.', validationInvalidValue: 'La catégorie {id} doit avoir une valeur finie non négative ou null.', validationInvalidTotal: 'Le total doit être fini, non négatif ou null.', validationInvalidHighlight: 'La catégorie mise en évidence doit exister.',
    announcementDataUpdated: 'Données du graphique mises à jour.', dataDialogTitle: '{title} : données complètes', dataTableCaption: '{title} : données complètes', dataInlineSummary: 'Voir les données complètes',
    dialogUnsupported: 'Ce navigateur ne peut pas ouvrir la fenêtre de données. Utilisez la vue intégrée.', dialogUnavailable: 'La fenêtre de données ne peut pas s’ouvrir. Réessayez ou utilisez la vue intégrée.',
    incomplete: 'Une répartition proportionnelle complète est indisponible car certaines valeurs sont manquantes ou masquées.',
    zeroTotal: 'Le total est nul. Les pourcentages ne sont pas disponibles.',
    exceedsTotal: 'La valeur dépasse le total de référence. La barre est limitée à la piste.',
    summaryComparison: '{label} : {value}, soit {percentage} du total de référence.',
    summaryCategoryValue: '{label} : {value}.', summaryCategoryShare: '{label} : {value} ({percentage}).',
    metricOf: 'sur {total} {label}', missingValue: 'Non communiqué', suppressedValue: 'Masquée',
  },
  'es-MX': { ...ENGLISH_MESSAGES, ...BAR_DEMO_MESSAGES['es-ES'],
    otherCategories: 'Otras categorías', incompleteValue: 'Incompleto', validationInvalidGrouping: 'La configuración de agrupación no es válida.', validationInvalidGroupingHighlight: 'La categoría destacada {label} ({id}) se agruparía. Elija categorías que la mantengan separada.',
    title: 'Gráfica', subtitle: '', filtered: 'Filtrado', suppressed: 'Suprimido', empty: 'No hay categorías disponibles.', unavailable: 'No disponible', totalUnavailable: 'No disponible', total: 'Total',
    invalidData: 'Los datos de la gráfica no son válidos. Revise las categorías y los valores.', invalidMessages: 'Los mensajes no son JSON válido.', mismatch: 'Las categorías no suman el total. Proporcione un desglose completo o use el modo de comparación.', comparisonRequiresTotal: 'La comparación requiere una categoría y un total explícito.', overflow: 'Los valores superan el intervalo numérico admitido.',
    validationInvalidData: 'Proporcione una lista de categorías.', validationInvalidRecord: 'La categoría {position} no es válida. Proporcione un identificador, una etiqueta y un valor no negativo o null.', validationEmptyId: 'Cada categoría necesita un identificador.', validationDuplicateId: 'El identificador {id} está repetido.', validationInvalidLabel: 'La categoría {id} necesita una etiqueta.', validationInvalidValue: 'La categoría {id} necesita un valor finito no negativo o null.', validationInvalidTotal: 'El total debe ser finito, no negativo o null.', validationInvalidHighlight: 'La categoría destacada debe existir.',
    announcementDataUpdated: 'Datos de la gráfica actualizados.', dataDialogTitle: '{title}: datos completos', dataTableCaption: '{title}: datos completos', dataInlineSummary: 'Ver datos completos',
    dialogUnsupported: 'Este navegador no puede abrir el diálogo de datos. Use la vista integrada.', dialogUnavailable: 'No se pudo abrir el diálogo de datos. Inténtelo de nuevo o use la vista integrada.',
    incomplete: 'No se dispone de un desglose proporcional completo porque faltan valores o están suprimidos.',
    zeroTotal: 'El total es cero. Los porcentajes no están disponibles.',
    exceedsTotal: 'El valor supera el total de referencia. La barra se limita a la pista.',
    summaryComparison: '{label}: {value}, equivalente al {percentage} del total de referencia.',
    summaryCategoryValue: '{label}: {value}.', summaryCategoryShare: '{label}: {value} ({percentage}).',
    metricOf: 'de {total} {label}', missingValue: 'No informado', suppressedValue: 'Suprimido',
  },
};
export const labels = {
  'en-US': { title: 'Request status', total: 'requests', resolved: 'Resolved', pending: 'Pending', withdrawn: 'Withdrawn', definitions: ['Requests with a recorded resolution.', 'Requests still being reviewed.', 'Requests withdrawn before resolution.'] },
  'fr-FR': { title: 'État des demandes', total: 'demandes', resolved: 'Résolues', pending: 'En attente', withdrawn: 'Retirées', definitions: ['Demandes avec une résolution enregistrée.', 'Demandes encore à l’étude.', 'Demandes retirées avant résolution.'] },
  'es-MX': { title: 'Estado de las solicitudes', total: 'solicitudes', resolved: 'Resueltas', pending: 'Pendientes', withdrawn: 'Retiradas', definitions: ['Solicitudes con resolución registrada.', 'Solicitudes aún en revisión.', 'Solicitudes retiradas antes de resolverse.'] },
};
