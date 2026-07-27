param(
  [string]$Root = (Resolve-Path "$PSScriptRoot\..").Path
)

$ErrorActionPreference = "Stop"

$cnamePath = Join-Path $Root "CNAME"
$domain = if (Test-Path $cnamePath) {
  (Get-Content $cnamePath -Raw).Trim()
} else {
  "www.witbacon.com"
}

$baseUrl = "https://$domain"
$htmlFiles = Get-ChildItem -Path $Root -Filter "*.html" -File |
  Sort-Object @{ Expression = { if ($_.Name -eq "index.html") { 0 } else { 1 } } }, Name

function Get-LastModifiedDate {
  param(
    [System.IO.FileInfo]$File
  )

  try {
    $relativePath = [System.IO.Path]::GetRelativePath($Root, $File.FullName).Replace("\", "/")
    $gitStatus = & git -C $Root status --porcelain -- $relativePath 2>$null
    if ($LASTEXITCODE -eq 0 -and -not $gitStatus) {
      $gitDateValue = & git -C $Root log -1 --format=%cs -- $relativePath 2>$null | Select-Object -First 1
      $gitDate = if ($gitDateValue) { $gitDateValue.Trim() } else { "" }
      if ($LASTEXITCODE -eq 0 -and $gitDate -match '^\d{4}-\d{2}-\d{2}$') {
        return $gitDate
      }
    }
  } catch {
    # A non-Git export remains supported through the filesystem timestamp fallback.
  }

  return $File.LastWriteTimeUtc.ToString("yyyy-MM-dd")
}

$settings = New-Object System.Xml.XmlWriterSettings
$settings.Indent = $true
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)

$sitemapPath = Join-Path $Root "sitemap.xml"
$writer = [System.Xml.XmlWriter]::Create($sitemapPath, $settings)

$writer.WriteStartDocument()
$writer.WriteStartElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9")

foreach ($file in $htmlFiles) {
  $path = if ($file.Name -eq "index.html") { "/" } else { "/$($file.Name)" }
  $isPrivacyPage = $file.Name.StartsWith("privacy", [System.StringComparison]::OrdinalIgnoreCase)
  $priority = if ($file.Name -eq "index.html") { "1.0" } elseif ($isPrivacyPage) { "0.3" } else { "0.8" }
  $changeFrequency = if ($isPrivacyPage) { "yearly" } else { "monthly" }
  $lastModified = Get-LastModifiedDate -File $file

  $writer.WriteStartElement("url")
  $writer.WriteElementString("loc", "$baseUrl$path")
  $writer.WriteElementString("lastmod", $lastModified)
  $writer.WriteElementString("changefreq", $changeFrequency)
  $writer.WriteElementString("priority", $priority)
  $writer.WriteEndElement()
}

$writer.WriteEndElement()
$writer.WriteEndDocument()
$writer.Close()

Write-Host "Generated $sitemapPath"
