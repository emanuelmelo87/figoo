#Requires AutoHotkey v2.0
; ═══════════════════════════════════════════════════════════════
;  Figoo — Captura Rápida Global
;
;  Atalho: Ctrl + Shift + Espaço
;
;  Como activar permanentemente (arrancar com o Windows):
;    1. Prima Win+R → escreva  shell:startup  → OK
;    2. Copie este ficheiro (figoo-captura.ahk) para essa pasta
;    3. Faça duplo-clique no ficheiro para activar já agora
;
;  Requisito: AutoHotkey v2 instalado → https://www.autohotkey.com/
; ═══════════════════════════════════════════════════════════════

URL := "https://emanuelmelo87.github.io/figoo/pendencias.html?q=1"

^+Space:: {
    ; Se a janela já estiver aberta, traz para frente
    if WinExist("captura rápida") {
        WinActivate "captura rápida"
        return
    }
    ; Abre no Edge em modo app (sem barra de endereço, sem abas)
    ; O Edge vem instalado de série no Windows 11
    Run 'msedge.exe --app="' URL '" --window-size=500,430'
}
