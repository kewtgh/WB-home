param(
  [string]$Root = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"
$errors = [System.Collections.Generic.List[string]]::new()
$versionPath = Join-Path $Root "VERSION"

if (-not (Test-Path -LiteralPath $versionPath)) {
  $errors.Add("Missing VERSION file.")
  $version = ""
} else {
  $version = (Get-Content -LiteralPath $versionPath -Raw).Trim()
  if ($version -notmatch '^\d+\.\d+\.\d+$') {
    $errors.Add("VERSION must use semantic x.y.z format.")
  }
}

$htmlFiles = Get-ChildItem -LiteralPath $Root -Filter "*.html" -File | Sort-Object Name
if ($htmlFiles.Count -lt 4) {
  $errors.Add("Expected bilingual home and privacy pages.")
}

$sectionSets = @{}

foreach ($file in $htmlFiles) {
  $html = Get-Content -LiteralPath $file.FullName -Raw
  $name = $file.Name

  $h1Count = [regex]::Matches($html, '<h1\b', 'IgnoreCase').Count
  if ($h1Count -ne 1) {
    $errors.Add("${name}: expected exactly one h1, found $h1Count.")
  }

  foreach ($required in @('<main\b', 'rel="canonical"', 'hreflang="en"', 'hreflang="zh-CN"', 'name="generator"')) {
    if ($html -notmatch $required) {
      $errors.Add("${name}: missing required markup $required.")
    }
  }

  if ($version -and $html -notmatch ('content="Witbacon ' + [regex]::Escape($version) + '"')) {
    $errors.Add("${name}: generator metadata does not match VERSION $version.")
  }

  if ($html -match 'fonts\.googleapis\.com|googletagmanager\.com/gtag/js') {
    $errors.Add("${name}: third-party font or eager analytics request found in HTML.")
  }

  $ids = [regex]::Matches($html, '\sid="([^"]+)"', 'IgnoreCase') |
    ForEach-Object { $_.Groups[1].Value }
  $duplicates = $ids | Group-Object | Where-Object Count -gt 1
  foreach ($duplicate in $duplicates) {
    $errors.Add("${name}: duplicate id '$($duplicate.Name)'.")
  }

  $hashTargets = [regex]::Matches($html, 'href="#([^"]+)"', 'IgnoreCase') |
    ForEach-Object { $_.Groups[1].Value } |
    Where-Object { $_ }
  foreach ($target in ($hashTargets | Sort-Object -Unique)) {
    if ($target -notin $ids) {
      $errors.Add("${name}: missing hash target '#$target'.")
    }
  }

  $references = [regex]::Matches($html, '(?:src|href|data-background)="([^"]+)"', 'IgnoreCase') |
    ForEach-Object { $_.Groups[1].Value }
  foreach ($reference in ($references | Sort-Object -Unique)) {
    $pathPart = ($reference -split '[?#]', 2)[0]
    if (
      -not $pathPart -or
      $pathPart.StartsWith("/") -or
      $pathPart.StartsWith("#") -or
      $pathPart -match '^[a-z][a-z0-9+.-]*:' -or
      $pathPart -in @("index.html", "zh.html", "privacy.html", "privacy-zh.html")
    ) {
      continue
    }

    $decoded = [System.Uri]::UnescapeDataString($pathPart)
    $resolved = Join-Path $Root $decoded
    if (-not (Test-Path -LiteralPath $resolved)) {
      $errors.Add("${name}: missing local resource '$decoded'.")
    }
  }

  $images = [regex]::Matches($html, '<img\b[^>]*>', 'IgnoreCase')
  foreach ($image in $images) {
    $tag = $image.Value
    if ($tag -notmatch '\salt="[^"]*"') {
      $errors.Add("${name}: image missing alt: $tag")
    }
    if ($tag -notmatch '\swidth="\d+"' -or $tag -notmatch '\sheight="\d+"') {
      $errors.Add("${name}: image missing intrinsic dimensions: $tag")
    }
    if ($tag -notmatch '\sloading="(?:lazy|eager)"') {
      $errors.Add("${name}: image missing loading strategy: $tag")
    }
    if ($tag -notmatch '\sdecoding="(?:async|sync|auto)"') {
      $errors.Add("${name}: image missing decoding strategy: $tag")
    }
  }

  if ($html -match 'assets/vendor/(?:jquery|icofont)|assets/vendor/bootstrap/js') {
    $errors.Add("${name}: removed runtime vendor is still referenced.")
  }

  if ($name -in @("index.html", "zh.html")) {
    $sections = [regex]::Matches($html, '<section\b[^>]*\sid="([^"]+)"', 'IgnoreCase') |
      ForEach-Object { $_.Groups[1].Value } |
      Sort-Object
    $sectionSets[$name] = @($sections)

    foreach ($requiredSection in @("hero", "about", "services", "clients", "cases", "contact")) {
      if ($requiredSection -notin $sections) {
        $errors.Add("${name}: missing required section '$requiredSection'.")
      }
    }

    if ($html -notmatch 'data-inquiry-form') {
      $errors.Add("${name}: missing inquiry brief form.")
    }
    if ($html -notmatch 'data-consent-banner') {
      $errors.Add("${name}: missing consent controls.")
    }
  }
}

if ($sectionSets.ContainsKey("index.html") -and $sectionSets.ContainsKey("zh.html")) {
  $enSections = $sectionSets["index.html"] -join ","
  $zhSections = $sectionSets["zh.html"] -join ","
  if ($enSections -ne $zhSections) {
    $errors.Add("Homepage section IDs differ between English and Chinese versions.")
  }
}

$cname = (Get-Content -LiteralPath (Join-Path $Root "CNAME") -Raw).Trim()
$sitemapPath = Join-Path $Root "sitemap.xml"
if (-not (Test-Path -LiteralPath $sitemapPath)) {
  $errors.Add("Missing sitemap.xml.")
} else {
  [xml]$sitemap = Get-Content -LiteralPath $sitemapPath -Raw
  $actualUrls = @($sitemap.urlset.url | ForEach-Object { $_.loc })
  foreach ($file in $htmlFiles) {
    $route = if ($file.Name -eq "index.html") { "/" } else { "/$($file.Name)" }
    $expectedUrl = "https://$cname$route"
    if ($expectedUrl -notin $actualUrls) {
      $errors.Add("sitemap.xml is missing '$expectedUrl'.")
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host "Site validation failed with $($errors.Count) issue(s):" -ForegroundColor Red
  foreach ($issue in $errors) {
    Write-Host " - $issue" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Site validation passed for $($htmlFiles.Count) HTML files (version $version)." -ForegroundColor Green
