# Detail pane positioning

The segmented chart's absolute detail cards were positioned at the start of the entire legend. The shared floating-card controller only selected above/below placement, so every trigger produced the same horizontal origin.

The segmented chart now supplies a placement callback to the shared controller. It anchors to the hovered segment or hovered/focused legend button, clamps horizontally to the chart and viewport, and selects an available vertical side. Segment previews prefer above to avoid covering their legend trigger. Pointer movement into the pane preserves the original anchor. Narrow screens and oversized breakdowns retain in-flow details.

Validation: all 9 segmented browser tests pass, including automated accessibility, keyboard dismissal, narrow-screen reflow, forced colors, long member lists, right-edge placement, and segment/legend anchoring. All package typechecks pass. Segmented package build and fresh packed-consumer smoke pass. Segmented unit suite (50) and existing bar suite (136) pass. No manual screen-reader testing was performed.

Screenshot: `tmp/segmented/anchored-details.png`.
