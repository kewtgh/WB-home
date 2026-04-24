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

$settings = New-Object System.Xml.XmlWriterSettings
$settings.Indent = $true
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)

$sitemapPath = Join-Path $Root "sitemap.xml"
$writer = [System.Xml.XmlWriter]::Create($sitemapPath, $settings)

$writer.WriteStartDocument()
$writer.WriteStartElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9")

foreach ($file in $htmlFiles) {
  $path = if ($file.Name -eq "index.html") { "/" } else { "/$($file.Name)" }
  $priority = if ($file.Name -eq "index.html") { "1.0" } else { "0.8" }

  $writer.WriteStartElement("url")
  $writer.WriteElementString("loc", "$baseUrl$path")
  $writer.WriteElementString("lastmod", $file.LastWriteTimeUtc.ToString("yyyy-MM-dd"))
  $writer.WriteElementString("changefreq", "monthly")
  $writer.WriteElementString("priority", $priority)
  $writer.WriteEndElement()
}

$writer.WriteEndElement()
$writer.WriteEndDocument()
$writer.Close()

Write-Host "Generated $sitemapPath"
