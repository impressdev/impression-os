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

$sections = []; // [name => root elements]
foreach ($files as $f) {
    $tpl = json_decode(file_get_contents($f), true);
    $sections[basename($f, '.json')] = $tpl['content'];
}
if (!$sections) { fwrite(STDERR, "no template content found\n"); exit(1); }
$elements = array_merge(...array_values($sections));

// ---------- 2b. materialize placeholders for unresolved image URLs ----------
// Briefs reference assets that don't exist yet (/assets/hero.png). Write
// brand-colored SVG placeholders into wp-content/uploads and point the image
// widgets at them, so the imported page never shows broken images. Shape
// follows the compiler's _impression_asset hint (logo | avatar | media).
$palette = kit_palette($kit);
$uploads = wp_upload_dir();
$phDir = $uploads['basedir'] . '/impression-placeholders';
$phUrl = $uploads['baseurl'] . '/impression-placeholders';
if (!is_dir($phDir)) wp_mkdir_p($phDir);
$placeholders = 0;
$rewrite = function (&$els) use (&$rewrite, $palette, $phDir, $phUrl, &$placeholders) {
    foreach ($els as &$el) {
        if (($el['widgetType'] ?? '') === 'image') {
            $url = $el['settings']['image']['url'] ?? '';
            if ($url !== '' && !preg_match('~^(https?:|data:)~i', $url)) {
                $kind = $el['settings']['_impression_asset'] ?? 'media';
                $alt = $el['settings']['image']['alt'] ?? '';
                $svg = placeholder_svg($kind, $alt !== '' ? $alt : 'Image', $palette);
                $file = md5($kind . '|' . $alt . '|' . implode(',', $palette)) . '.svg';
                if (!file_exists("$phDir/$file")) file_put_contents("$phDir/$file", $svg);
                $el['settings']['image']['url'] = "$phUrl/$file";
                $placeholders++;
            }
        }
        if (!empty($el['elements'])) $rewrite($el['elements']);
    }
};
foreach ($sections as &$roots) $rewrite($roots);
unset($roots);
if ($placeholders) echo "placeholders: $placeholders unresolved images now point at generated SVGs\n";

// ---------- 3. Elementor Pro Theme Builder: header & footer as site parts ----------
// With Pro, the header (announcement-bar included) and footer become real
// theme-builder templates with an "entire site" display condition, so every
// page gets them automatically and they are editable in one place. Without
// Pro, they stay inline on the page (canvas template) as before.
$CHROME = ['announcement-bar', 'header', 'footer'];
$hasPro = class_exists('\ElementorPro\Modules\ThemeBuilder\Classes\Conditions_Cache');
if ($hasPro) {
    $themeParts = [];
    $headerEls = array_merge($sections['announcement-bar'] ?? [], $sections['header'] ?? []);
    if ($headerEls) $themeParts['header'] = upsert_theme_part('header', 'Impression OS Header', $headerEls);
    if (!empty($sections['footer'])) $themeParts['footer'] = upsert_theme_part('footer', 'Impression OS Footer', $sections['footer']);
    if ($themeParts) {
        (new \ElementorPro\Modules\ThemeBuilder\Classes\Conditions_Cache())->regenerate();
        foreach ($themeParts as $type => $id) echo "theme part: $type → template #$id (display: entire site)\n";
    }
    $bodySections = array_diff_key($sections, array_flip($CHROME));
} else {
    echo "note: Elementor Pro theme builder not found — header/footer stay inline on the page\n";
    $bodySections = $sections;
}
$pageElements = $bodySections ? array_merge(...array_values($bodySections)) : [];

// Reuse an existing page with the same slug so re-runs update, not duplicate.
$existing = get_page_by_path(sanitize_title($pageTitle), OBJECT, 'page');
$postarr = ['post_title' => $pageTitle, 'post_type' => 'page', 'post_status' => 'publish'];
if ($existing) $postarr['ID'] = $existing->ID;
$pageId = wp_insert_post($postarr);

update_post_meta($pageId, '_elementor_edit_mode', 'builder');
update_post_meta($pageId, '_elementor_template_type', 'wp-page');
update_post_meta($pageId, '_elementor_version', ELEMENTOR_VERSION);
// With Pro theme parts the page uses the theme's header/footer locations;
// without Pro it stays a blank canvas carrying its own chrome sections.
update_post_meta($pageId, '_wp_page_template', $hasPro ? 'elementor_header_footer' : 'elementor_canvas');
update_post_meta($pageId, '_elementor_data', wp_slash(wp_json_encode($pageElements)));

// Regenerate Elementor's CSS so the page renders with fresh globals.
\Elementor\Plugin::$instance->files_manager->clear_cache();

echo 'page #' . $pageId . ' "' . $pageTitle . '": ' . count($bodySections) . " body sections, "
   . count($pageElements) . " root containers\n";
echo 'URL: ' . get_permalink($pageId) . "\n";

/** Create or update a theme-builder template (header/footer) shown site-wide. */
function upsert_theme_part($type, $title, $elements) {
    $existing = get_posts(['post_type' => 'elementor_library', 'title' => $title, 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids']);
    $postarr = ['post_title' => $title, 'post_type' => 'elementor_library', 'post_status' => 'publish'];
    if ($existing) $postarr['ID'] = $existing[0];
    $id = wp_insert_post($postarr);
    wp_set_object_terms($id, $type, 'elementor_library_type');
    update_post_meta($id, '_elementor_edit_mode', 'builder');
    update_post_meta($id, '_elementor_template_type', $type);
    update_post_meta($id, '_elementor_location', $type);
    update_post_meta($id, '_elementor_version', ELEMENTOR_VERSION);
    update_post_meta($id, '_elementor_data', wp_slash(wp_json_encode($elements)));
    update_post_meta($id, '_elementor_conditions', ['include/general']);
    return $id;
}

/** Brand colors for placeholders, read from the kit globals by title. */
function kit_palette($kit) {
    $colors = array_merge($kit['settings']['system_colors'] ?? [], $kit['settings']['custom_colors'] ?? []);
    $by = function ($title, $fallback) use ($colors) {
        foreach ($colors as $c) if (($c['title'] ?? '') === $title) return $c['color'];
        return $fallback;
    };
    return [
        'surface' => $by('Surface Raised', '#f1f5f9'),
        'border'  => $by('Border', '#e2e8f0'),
        'muted'   => $by('Text Muted', '#64748b'),
        'accent'  => $by('Accent', '#4f46e5'),
    ];
}

/** PHP port of builder/src/placeholder.js — keep the two visually in sync. */
function placeholder_svg($kind, $label, $p) {
    $esc = fn($s) => htmlspecialchars($s, ENT_QUOTES);
    $label = mb_strlen($label) > 48 ? mb_substr($label, 0, 47) . '…' : $label;

    if ($kind === 'logo') {
        [$w, $h] = [180, 44];
        $r = $h * 0.22; $fs = round($h * 0.42); $tx = $h * 0.95; $ty = $h / 2 + 6;
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"$w\" height=\"$h\" viewBox=\"0 0 $w $h\" role=\"img\" aria-label=\"{$esc($label)}\">\n"
            . "<rect width=\"$w\" height=\"$h\" rx=\"8\" fill=\"{$p['surface']}\"/>\n"
            . "<circle cx=\"" . ($h / 2) . "\" cy=\"" . ($h / 2) . "\" r=\"$r\" fill=\"{$p['accent']}\"/>\n"
            . "<text x=\"$tx\" y=\"$ty\" font-family=\"system-ui, sans-serif\" font-size=\"$fs\" font-weight=\"700\" fill=\"{$p['muted']}\">{$esc($label)}</text>\n</svg>";
    }

    [$w, $h] = $kind === 'avatar' ? [96, 96] : [800, 450];
    $cx = $w / 2; $cy = $h / 2 - ($kind === 'media' ? 14 : 0);
    $g = min($w, $h) * 0.16;
    $text = $kind === 'media'
        ? "<text x=\"$cx\" y=\"" . ($cy + $g + 30) . "\" text-anchor=\"middle\" font-family=\"system-ui, sans-serif\" font-size=\"14\" fill=\"{$p['muted']}\">{$esc($label)}</text>\n"
        : '';
    $gx = $cx - $g; $gy = $cy - $g; $g2 = $g * 2;
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"$w\" height=\"$h\" viewBox=\"0 0 $w $h\" role=\"img\" aria-label=\"{$esc($label)}\">\n"
        . "<rect width=\"$w\" height=\"$h\" fill=\"{$p['surface']}\"/>\n"
        . "<rect x=\"1\" y=\"1\" width=\"" . ($w - 2) . "\" height=\"" . ($h - 2) . "\" fill=\"none\" stroke=\"{$p['border']}\" stroke-width=\"2\" rx=\"12\"/>\n"
        . "<g transform=\"translate($gx, $gy)\">\n"
        . "<rect width=\"$g2\" height=\"$g2\" rx=\"8\" fill=\"none\" stroke=\"{$p['muted']}\" stroke-width=\"3\"/>\n"
        . "<circle cx=\"" . ($g * 0.62) . "\" cy=\"" . ($g * 0.62) . "\" r=\"" . ($g * 0.16) . "\" fill=\"{$p['accent']}\"/>\n"
        . "<path d=\"M " . ($g * 0.2) . " " . ($g * 1.7) . " L " . ($g * 0.85) . " " . ($g * 0.95) . " L " . ($g * 1.3) . " " . ($g * 1.4) . " L " . ($g * 1.55) . " " . ($g * 1.15) . " L " . ($g * 1.8) . " " . ($g * 1.7) . " Z\" fill=\"{$p['muted']}\"/>\n"
        . "</g>\n$text</svg>";
}
