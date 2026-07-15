<?php
/**
 * Impression OS → WordPress/Elementor MULTI-PAGE site import.
 *
 * Imports the output of `impression build-site`: applies the shared kit's
 * globals, creates the header/footer once as Elementor Pro Theme Builder site
 * parts, creates one WordPress page per site page (the "/" page becomes the
 * front page), and rewrites internal links (e.g. "/about") to real permalinks
 * so navigation works.
 *
 * Usage:
 *   php tools/wp/import-site.php <wp-root> <site-dir> [host]
 *
 *   <wp-root>   path to the WordPress installation (holds wp-load.php)
 *   <site-dir>  output of `impression build-site` (kit.json, site.json,
 *               pages/<slug>/{templates/*, page.json})
 *   [host]      HTTP host WordPress expects, default "localhost:8888"
 */

require __DIR__ . '/lib.php';

[$self, $wpRoot, $siteDir, $host] = array_pad($argv, 4, null);
if (!$siteDir || !is_file("$siteDir/site.json")) { fwrite(STDERR, "site.json not found under: $siteDir\n"); exit(1); }

ios_bootstrap($wpRoot, $host);

$kit  = json_decode(file_get_contents("$siteDir/kit.json"), true);
$site = json_decode(file_get_contents("$siteDir/site.json"), true);
ios_apply_kit_globals($kit);

// ---------- load every page: sections + metadata ----------
$CHROME = ['announcement-bar', 'header', 'footer'];
$pages = [];      // slug => [path, sections, meta]
$chrome = null;   // first page's chrome, used for the site-wide theme parts
$placeholders = 0;

foreach ($site['pages'] as $p) {
    $dir = "$siteDir/pages/{$p['slug']}";
    $sections = ios_load_sections("$dir/templates");
    $placeholders += ios_materialize_placeholders($sections, $kit);
    if ($chrome === null && (isset($sections['header']) || isset($sections['footer']))) {
        $chrome = array_intersect_key($sections, array_flip($CHROME));
    }
    $pages[$p['slug']] = [
        'path' => $p['path'],
        'sections' => array_diff_key($sections, array_flip($CHROME)),
        'meta' => is_file("$dir/page.json") ? json_decode(file_get_contents("$dir/page.json"), true) : [],
    ];
}
if ($placeholders) echo "placeholders: $placeholders unresolved images now point at generated SVGs\n";

// ---------- create the pages first, so permalinks exist for link rewriting ----------
$hasPro = ios_has_pro();
if (!$hasPro) echo "note: Elementor Pro theme builder not found — header/footer stay inline per page\n";

$linkMap = [];   // "/about" => permalink
$pageIds = [];
foreach ($pages as $slug => $p) {
    $title = $slug === 'index' ? 'Home' : ucwords(str_replace('-', ' ', $slug));
    $elements = $hasPro ? array_merge(...array_values($p['sections'] ?: [[]]))
                        : array_merge(...array_values(($chrome ? ['header' => $chrome['header'] ?? []] : []) + $p['sections'] + ($chrome ? ['footer' => $chrome['footer'] ?? []] : [])));
    $pageIds[$slug] = ios_upsert_page($title, $slug === 'index' ? 'home' : $slug, $elements, $hasPro);
    $linkMap[$p['path']] = get_permalink($pageIds[$slug]);
}

// The "/" page becomes the site's front page; its canonical URL is the site root.
foreach ($pages as $slug => $p) {
    if ($p['path'] === '/') {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $pageIds[$slug]);
        $linkMap['/'] = home_url('/');
        echo "front page: \"{$slug}\" (#{$pageIds[$slug]})\n";
    }
}

// ---------- rewrite internal links everywhere, then (re)save ----------
foreach ($pages as $slug => $p) {
    $elements = $p['sections'] ? array_merge(...array_values($p['sections'])) : [];
    ios_rewrite_links($elements, $linkMap);
    update_post_meta($pageIds[$slug], '_elementor_data', wp_slash(wp_json_encode($elements)));
}

if ($hasPro && $chrome) {
    $headerEls = array_merge($chrome['announcement-bar'] ?? [], $chrome['header'] ?? []);
    $footerEls = $chrome['footer'] ?? [];
    ios_rewrite_links($headerEls, $linkMap);
    ios_rewrite_links($footerEls, $linkMap);
    if ($headerEls) echo 'theme part: header → template #' . ios_upsert_theme_part('header', 'Impression OS Header', $headerEls) . " (display: entire site)\n";
    if ($footerEls) echo 'theme part: footer → template #' . ios_upsert_theme_part('footer', 'Impression OS Footer', $footerEls) . " (display: entire site)\n";
    ios_refresh_conditions();
}

\Elementor\Plugin::$instance->files_manager->clear_cache();

echo count($pages) . " pages imported:\n";
foreach ($pages as $slug => $p) {
    echo '  ' . str_pad($p['path'], 10) . ' → ' . $linkMap[$p['path']] . "\n";
}
