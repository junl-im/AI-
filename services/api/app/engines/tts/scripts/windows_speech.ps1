param(
  [Parameter(Mandatory = $true)][string]$TextPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$Rate = 0,
  [string]$VoiceName = ""
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }

if ($VoiceName) {
  $selected = $voices | Where-Object { $_.VoiceInfo.Name -eq $VoiceName } | Select-Object -First 1
} else {
  $selected = $voices | Where-Object { $_.VoiceInfo.Culture.Name -like "ko-*" } | Select-Object -First 1
}

if (-not $selected) {
  throw "설치된 한국어 Windows 음성을 찾지 못했습니다. Windows 언어 설정에서 한국어 음성 패키지를 설치해 주세요."
}

$synth.SelectVoice($selected.VoiceInfo.Name)
$synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
$synth.SetOutputToWaveFile($OutputPath)
$text = [System.IO.File]::ReadAllText($TextPath, [System.Text.Encoding]::UTF8)
$synth.Speak($text)
$synth.Dispose()
