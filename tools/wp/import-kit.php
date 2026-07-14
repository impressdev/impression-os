<?php
/**
 * Impression OS → WordPress/Elementor import harness.
 *
 * Applies a generated kit's globals to Elementor's active kit and creates (or
 * updates) one page whose _elementor_data is the concatenation of the kit's
 * section templates, in canonical order.
 *
 * Usage:
 *   php tools/wp/import-kit.php <wp-root> <kit-dir> <page-title> [host]
 *
 *   <wp-root>    path to the WordPress installation (holds wp-load.php)
 *   <kit-dir>    output of `impression build` (kit.json + templates/*.json)
 *   <page-title> page to create/update (re-runs update, never duplicate)
 *   [host]       HTTP host WordPress expects, default "localhost:8888"
 *
 * Requires Elementor (and Elementor Pro for the form widget) to be active.
 */

[$self, $wpRoot, $kitDir, $pageTitle, $host] = array_pad($argv, 5, null);
if (!$wpRoot || !is_file("$wpRoot/wp-load.php")) { fwrite(STDERR, "wp-load.php not found under: $wpRoot\n"); exit(1); }
if (!$kitDir || !is_file("$kitDir/kit.json")) { fwrite(STDERR, "kit.json not found under: $kitDir\n"); exit(1); }
$pageTitle = $pageTitle ?: 'Impression OS import';

// Minimal server context so wp-load works from the CLI.
$_SERVER['HTTP_HOST']   = $host ?: 'localhost:8888';
$_SERVER['REQUEST_URI'] = '/';
require "$wpRoot/wp-load.php";

if (!did_action('elementor/loaded')) { fwrite(STDERR, "Elementor is not active\n"); exit(1); }

// ---------- 1. apply globals to the active Elementor kit ----------
$kit = json_decode(file_get_contents("$kitDir/kit.json"), true);
$kitId = (int) get_option('elementor_active_kit');
if (!$kitId) { fwrite(STDERR, "no active Elementor kit\n"); exit(1); }

$settings = get_post_meta($kitId, '_elementor_page_settings', true);
if (!is_array($settings)) $settings = [];

foreach (['system_colors', 'custom_colors', 'system_typography', 'custom_typography'] as $key) {
    if (!empty($kit['settings'][$key])) $settings[$key] = $kit['settings'][$key];
}
if (!empty($kit['settings']['container_width'])) {
    $cw = $kit['settings']['container_width'];
    $settings['container_width'] = ['unit' => $cw['unit'], 'size' => $cw['size'], 'sizes' => []];
}
update_post_meta($kitId, '_elementor_page_settings', wp_slash($settings));
echo "kit #$kitId: globals applied (" . count($kit['settings']['system_colors']) . " system + "
   . count($kit['settings']['custom_colors']) . " custom colors, "
   . (count($kit['settings']['system_typography']) + count($kit['settings']['custom_typography'])) . " fonts)\n";

// ---------- 2. build one page from the section templates, in order ----------
$order = ['announcement-bar','header','hero','logo-cloud','feature-grid','gallery','stats','testimonial','team','pricing','faq','cta','contact','footer'];
$files = glob("$kitDir/templates/*.json");
usort($files, function ($a, $b) use ($order) {
    $pos = function ($f) use ($order) { $i = array_search(basename($f, '.json'), $order); return $i === false ? 99 : $i; };
    return $pos($a) <=> $pos($b);
});

$elements = [];
foreach ($files as $f) {
    $tpl = json_decode(file_get_contents($f), true);
    foreach ($tpl['content'] as $el) $elements[] = $el;
}
if (!$elements) { fwrite(STDERR, "no template content found\n"); exit(1); }

// Reuse an existing page with the same slug so re-runs update, not duplicate.
$existing = get_page_by_path(sanitize_title($pageTitle), OBJECT, 'page');
$postarr = ['post_title' => $pageTitle, 'post_type' => 'page', 'post_status' => 'publish'];
if ($existing) $postarr['ID'] = $existing->ID;
$pageId = wp_insert_post($postarr);

update_post_meta($pageId, '_elementor_edit_mode', 'builder');
update_post_meta($pageId, '_elementor_template_type', 'wp-page');
update_post_meta($pageId, '_elementor_version', ELEMENTOR_VERSION);
update_post_meta($pageId, '_wp_page_template', 'elementor_canvas'); // sections bring their own header/footer
update_post_meta($pageId, '_elementor_data', wp_slash(wp_json_encode($elements)));

// Regenerate Elementor's CSS so the page renders with fresh globals.
\Elementor\Plugin::$instance->files_manager->clear_cache();

echo 'page #' . $pageId . ' "' . $pageTitle . '": ' . count($files) . " sections, "
   . count($elements) . " root containers\n";
echo 'URL: ' . get_permalink($pageId) . "\n";
