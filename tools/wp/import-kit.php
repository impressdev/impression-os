<?php
/**
 * Impression OS → WordPress/Elementor SINGLE-PAGE import.
 *
 * Applies a generated kit's globals to Elementor's active kit, creates the
 * header/footer as Elementor Pro Theme Builder site parts (when Pro is
 * active), materializes placeholders for unresolved images, and creates (or
 * updates) one page from the remaining section templates.
 *
 * Usage:
 *   php tools/wp/import-kit.php <wp-root> <kit-dir> <page-title> [host]
 *
 *   <wp-root>    path to the WordPress installation (holds wp-load.php)
 *   <kit-dir>    output of `impression build` (kit.json + templates/*.json)
 *   <page-title> page to create/update (re-runs update, never duplicate)
 *   [host]       HTTP host WordPress expects, default "localhost:8888"
 *
 * For multi-page sites (`impression build-site`), use import-site.php.
 */

require __DIR__ . '/lib.php';

[$self, $wpRoot, $kitDir, $pageTitle, $host] = array_pad($argv, 5, null);
if (!$kitDir || !is_file("$kitDir/kit.json")) { fwrite(STDERR, "kit.json not found under: $kitDir\n"); exit(1); }
$pageTitle = $pageTitle ?: 'Impression OS import';

ios_bootstrap($wpRoot, $host);

$kit = json_decode(file_get_contents("$kitDir/kit.json"), true);
ios_apply_kit_globals($kit);

$sections = ios_load_sections("$kitDir/templates");
if (!$sections) { fwrite(STDERR, "no template content found\n"); exit(1); }

$placeholders = ios_materialize_placeholders($sections, $kit);
if ($placeholders) echo "placeholders: $placeholders unresolved images now point at generated SVGs\n";

// With Pro, header (announcement-bar included) and footer become site parts.
$CHROME = ['announcement-bar', 'header', 'footer'];
$hasPro = ios_has_pro();
if ($hasPro) {
    $headerEls = array_merge($sections['announcement-bar'] ?? [], $sections['header'] ?? []);
    if ($headerEls) echo 'theme part: header → template #' . ios_upsert_theme_part('header', 'Impression OS Header', $headerEls) . " (display: entire site)\n";
    if (!empty($sections['footer'])) echo 'theme part: footer → template #' . ios_upsert_theme_part('footer', 'Impression OS Footer', $sections['footer']) . " (display: entire site)\n";
    ios_refresh_conditions();
    $bodySections = array_diff_key($sections, array_flip($CHROME));
} else {
    echo "note: Elementor Pro theme builder not found — header/footer stay inline on the page\n";
    $bodySections = $sections;
}
$pageElements = $bodySections ? array_merge(...array_values($bodySections)) : [];

$pageId = ios_upsert_page($pageTitle, sanitize_title($pageTitle), $pageElements, $hasPro);

\Elementor\Plugin::$instance->files_manager->clear_cache();

echo 'page #' . $pageId . ' "' . $pageTitle . '": ' . count($bodySections) . " body sections, "
   . count($pageElements) . " root containers\n";
echo 'URL: ' . get_permalink($pageId) . "\n";
