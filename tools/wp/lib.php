<?php
/**
 * Shared helpers for the Impression OS → WordPress/Elementor import harness.
 * Used by import-kit.php (single page) and import-site.php (multi-page site).
 */

/** Boot WordPress from the CLI with a minimal server context. */
function ios_bootstrap($wpRoot, $host) {
    if (!$wpRoot || !is_file("$wpRoot/wp-load.php")) { fwrite(STDERR, "wp-load.php not found under: $wpRoot\n"); exit(1); }
    $_SERVER['HTTP_HOST']   = $host ?: 'localhost:8888';
    $_SERVER['REQUEST_URI'] = '/';
    require "$wpRoot/wp-load.php";
    if (!did_action('elementor/loaded')) { fwrite(STDERR, "Elementor is not active\n"); exit(1); }
}

/** Apply the generated kit's globals to Elementor's active kit. */
function ios_apply_kit_globals($kit) {
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
}

/** Load a templates/ dir into [section-name => root elements], canonical order. */
function ios_load_sections($templatesDir) {
    $order = ['announcement-bar','header','hero','logo-cloud','feature-grid','gallery','stats','testimonial','team','pricing','faq','cta','contact','footer'];
    $files = glob("$templatesDir/*.json");
    usort($files, function ($a, $b) use ($order) {
        $pos = function ($f) use ($order) { $i = array_search(basename($f, '.json'), $order); return $i === false ? 99 : $i; };
        return $pos($a) <=> $pos($b);
    });
    $sections = [];
    foreach ($files as $f) {
        $tpl = json_decode(file_get_contents($f), true);
        $sections[basename($f, '.json')] = $tpl['content'];
    }
    return $sections;
}

/**
 * Replace unresolved image URLs with generated brand-colored SVG placeholders
 * written into wp-content/uploads. Returns how many were rewritten.
 */
function ios_materialize_placeholders(&$sections, $kit) {
    $palette = ios_kit_palette($kit);
    $uploads = wp_upload_dir();
    $phDir = $uploads['basedir'] . '/impression-placeholders';
    $phUrl = $uploads['baseurl'] . '/impression-placeholders';
    if (!is_dir($phDir)) wp_mkdir_p($phDir);
    $count = 0;
    $walk = function (&$els) use (&$walk, $palette, $phDir, $phUrl, &$count) {
        foreach ($els as &$el) {
            if (($el['widgetType'] ?? '') === 'image') {
                $url = $el['settings']['image']['url'] ?? '';
                if ($url !== '' && !preg_match('~^(https?:|data:)~i', $url)) {
                    $kind = $el['settings']['_impression_asset'] ?? 'media';
                    $alt = $el['settings']['image']['alt'] ?? '';
                    $svg = ios_placeholder_svg($kind, $alt !== '' ? $alt : 'Image', $palette);
                    $file = md5($kind . '|' . $alt . '|' . implode(',', $palette)) . '.svg';
                    if (!file_exists("$phDir/$file")) file_put_contents("$phDir/$file", $svg);
                    $el['settings']['image']['url'] = "$phUrl/$file";
                    $count++;
                }
            }
            if (!empty($el['elements'])) $walk($el['elements']);
        }
    };
    foreach ($sections as &$roots) $walk($roots);
    return $count;
}

/** Rewrite internal link URLs (e.g. "/about") to their WordPress permalinks. */
function ios_rewrite_links(&$els, $map) {
    foreach ($els as &$el) {
        foreach (['settings'] as $k) {
            if (!isset($el[$k]) || !is_array($el[$k])) continue;
            ios_rewrite_links_in_settings($el[$k], $map);
        }
        if (!empty($el['elements'])) ios_rewrite_links($el['elements'], $map);
    }
}
function ios_rewrite_links_in_settings(&$value, $map) {
    foreach ($value as $key => &$v) {
        if ($key === 'url' && is_string($v) && isset($map[$v])) $v = $map[$v];
        elseif (is_array($v)) ios_rewrite_links_in_settings($v, $map);
    }
}

/** True when Elementor Pro's theme builder is available. */
function ios_has_pro() {
    return class_exists('\ElementorPro\Modules\ThemeBuilder\Classes\Conditions_Cache');
}

/** Create or update a theme-builder template (header/footer) shown site-wide. */
function ios_upsert_theme_part($type, $title, $elements) {
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

/** Refresh Elementor Pro's display-conditions cache. */
function ios_refresh_conditions() {
    (new \ElementorPro\Modules\ThemeBuilder\Classes\Conditions_Cache())->regenerate();
}

/** Create or update an Elementor page; returns the post id. */
function ios_upsert_page($title, $slug, $elements, $hasPro) {
    $existing = get_page_by_path($slug, OBJECT, 'page');
    $postarr = ['post_title' => $title, 'post_name' => $slug, 'post_type' => 'page', 'post_status' => 'publish'];
    if ($existing) $postarr['ID'] = $existing->ID;
    $pageId = wp_insert_post($postarr);
    update_post_meta($pageId, '_elementor_edit_mode', 'builder');
    update_post_meta($pageId, '_elementor_template_type', 'wp-page');
    update_post_meta($pageId, '_elementor_version', ELEMENTOR_VERSION);
    update_post_meta($pageId, '_wp_page_template', $hasPro ? 'elementor_header_footer' : 'elementor_canvas');
    update_post_meta($pageId, '_elementor_data', wp_slash(wp_json_encode($elements)));
    return $pageId;
}

/** Brand colors for placeholders, read from the kit globals by title. */
function ios_kit_palette($kit) {
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
function ios_placeholder_svg($kind, $label, $p) {
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
