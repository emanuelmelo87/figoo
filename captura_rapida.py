#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
figoo · Captura Rápida
Adicione pendências ao Figoo a partir de qualquer janela do Windows.

Hotkey global: Ctrl+Shift+P
Ícone na bandeja do sistema (perto do relógio)
"""

import json
import os
import sys
import re
import base64
import threading
import time
import random
import tkinter as tk
from tkinter import messagebox
import requests

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.backends import default_backend
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

try:
    import keyboard
    HAS_KEYBOARD = True
except ImportError:
    HAS_KEYBOARD = False

# ── Configuração ──────────────────────────────────────
FIREBASE_DB_URL = "https://figoo-app-default-rtdb.europe-west1.firebasedatabase.io"
CONFIG_FILE     = os.path.join(os.path.expanduser("~"), ".figoo_captura.json")
HOTKEY          = "ctrl+shift+p"

# Cores figoo
COR_PRIMARY   = "#2D5016"
COR_SECONDARY = "#5EAD24"
COR_BG        = "#F5F2EB"
COR_WHITE     = "#FFFFFF"
COR_TEXT      = "#1A2E0A"
COR_TEXT2     = "#5A6B4A"
COR_BORDER    = "#E0DDD5"
COR_RET_BG    = "#EBF5FB"
COR_RET_FG    = "#1A5276"
COR_EXE_BG    = "#F5EEF8"
COR_EXE_FG    = "#6C3483"


# ── Crypto (mesmo algoritmo do web app) ──────────────
def _email_to_key(email: str) -> str:
    return re.sub(r'[^a-z0-9]', '_', email.lower())

def _verify_password(verifier: dict, pw: str) -> bool:
    """Verifica senha contra o verifier do Firebase (AES-GCM + PBKDF2 — idêntico ao JS)."""
    if not HAS_CRYPTO:
        return True  # sem lib de crypto, aceita sem verificar (fallback)
    try:
        salt  = base64.b64decode(verifier['salt'])
        iv    = base64.b64decode(verifier['iv'])
        ciph  = base64.b64decode(verifier['cipher'])
        kdf   = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                            iterations=250000, backend=default_backend())
        key   = kdf.derive(pw.encode('utf-8'))
        plain = AESGCM(key).decrypt(iv, ciph, None)
        return plain.decode('utf-8') == 'figoo-auth-ok'
    except Exception:
        return False


# ── Firebase REST ─────────────────────────────────────
def firebase_get(path: str):
    r = requests.get(f"{FIREBASE_DB_URL}/{path}.json", timeout=10)
    r.raise_for_status()
    return r.json()

def firebase_put(path: str, data):
    r = requests.put(f"{FIREBASE_DB_URL}/{path}.json", json=data, timeout=10)
    r.raise_for_status()
    return r.json()


# ── Utilidades ────────────────────────────────────────
def uid() -> str:
    ts   = int(time.time() * 1000)
    rand = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=5))
    return format(ts, 'x') + rand

def load_config() -> dict:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_config(cfg: dict):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(cfg, f, indent=2)


# ══ Aplicação principal ═══════════════════════════════
class FigooCaptura:
    def __init__(self):
        cfg = load_config()
        self.email      = cfg.get('email', '')
        self.email_key  = cfg.get('email_key', _email_to_key(self.email))
        self.authed     = cfg.get('authenticated', False)
        self.root       = None   # Tk root (hidden)
        self.cap_win    = None   # janela de captura
        self.tray_icon  = None

    # ── Entry point ────────────────────────────────────
    def run(self):
        self.root = tk.Tk()
        self.root.withdraw()  # janela raiz invisible
        self.root.title("figoo")

        if not self.email or not self.authed:
            self.root.after(100, self._show_login)
        else:
            self.root.after(100, self._start_services)

        self.root.mainloop()

    # ── Login ──────────────────────────────────────────
    def _show_login(self):
        win = tk.Toplevel(self.root)
        win.title("figoo · Configurar acesso")
        win.resizable(False, False)
        win.configure(bg=COR_BG)
        win.attributes('-topmost', True)
        self._center(win, 380, 330)
        win.protocol("WM_DELETE_WINDOW", lambda: os._exit(0))

        f = tk.Frame(win, bg=COR_BG, padx=28, pady=24)
        f.pack(fill='both', expand=True)

        tk.Label(f, text="figoo · Pendências", font=('Segoe UI', 12, 'bold'),
                 fg=COR_PRIMARY, bg=COR_BG).pack(anchor='w', pady=(0, 4))
        tk.Label(f, text="Introduza o seu e-mail e senha para ligar\nà conta Figoo.",
                 font=('Segoe UI', 9), fg=COR_TEXT2, bg=COR_BG, justify='left').pack(anchor='w', pady=(0, 16))

        tk.Label(f, text="E-MAIL", font=('Segoe UI', 8, 'bold'), fg=COR_TEXT2, bg=COR_BG).pack(anchor='w')
        email_var = tk.StringVar(value=self.email)
        email_ent = tk.Entry(f, textvariable=email_var, font=('Segoe UI', 11),
                             relief='solid', bd=1, fg=COR_TEXT, bg='#FFFFFF')
        email_ent.pack(fill='x', pady=(3, 10), ipady=6)

        tk.Label(f, text="SENHA", font=('Segoe UI', 8, 'bold'), fg=COR_TEXT2, bg=COR_BG).pack(anchor='w')
        pw_var = tk.StringVar()
        pw_ent = tk.Entry(f, textvariable=pw_var, font=('Segoe UI', 11),
                          show='•', relief='solid', bd=1, fg=COR_TEXT, bg='#FFFFFF')
        pw_ent.pack(fill='x', pady=(3, 10), ipady=6)

        err_var = tk.StringVar()
        tk.Label(f, textvariable=err_var, font=('Segoe UI', 8),
                 fg='#C05050', bg=COR_BG).pack(anchor='w', pady=(0, 8))

        btn = tk.Button(f, text="Entrar", bg=COR_PRIMARY, fg='white',
                        font=('Segoe UI', 10, 'bold'), relief='flat', cursor='hand2',
                        pady=9, command=lambda: self._do_login(email_var.get(), pw_var.get(), btn, err_var, win))
        btn.pack(fill='x')

        if not HAS_CRYPTO:
            tk.Label(f, text="⚠ Instale 'cryptography' para verificar a senha.",
                     font=('Segoe UI', 7), fg='#E67E22', bg=COR_BG).pack(pady=(8,0))

        pw_ent.bind('<Return>', lambda e: btn.invoke())
        email_ent.focus_set()

    def _do_login(self, email, pw, btn, err_var, win):
        if not email or '@' not in email:
            err_var.set("E-mail inválido."); return
        if not pw:
            err_var.set("Introduza a senha."); return
        btn.config(state='disabled', text='Verificando…')
        err_var.set('')

        def verify():
            try:
                ek  = _email_to_key(email)
                ver = firebase_get(f"pendencias/{ek}/__auth")
                if ver is None:
                    self.root.after(0, lambda: err_var.set(
                        "Sem senha configurada. Aceda ao site primeiro."))
                elif not _verify_password(ver, pw):
                    self.root.after(0, lambda: err_var.set("Senha incorreta."))
                else:
                    self.email     = email
                    self.email_key = ek
                    self.authed    = True
                    save_config({'email': email, 'email_key': ek, 'authenticated': True})
                    self.root.after(0, win.destroy)
                    self.root.after(100, self._start_services)
                    return
            except requests.RequestException as e:
                self.root.after(0, lambda: err_var.set(f"Erro de rede: {e}"))
            except Exception as e:
                self.root.after(0, lambda: err_var.set(f"Erro: {e}"))
            self.root.after(0, lambda: btn.config(state='normal', text='Entrar'))

        threading.Thread(target=verify, daemon=True).start()

    # ── Iniciar tray + hotkey ──────────────────────────
    def _start_services(self):
        if HAS_KEYBOARD:
            try:
                keyboard.add_hotkey(HOTKEY, lambda: self.root.after(0, self._open_capture))
                print(f"Hotkey global registada: {HOTKEY}")
            except Exception as e:
                print(f"Hotkey não disponível: {e}")

        if HAS_TRAY:
            def tray_thread():
                img  = self._make_tray_icon()
                menu = pystray.Menu(
                    pystray.MenuItem(
                        "⚡  Captura rápida",
                        lambda icon, item: self.root.after(0, self._open_capture),
                        default=True
                    ),
                    pystray.Menu.SEPARATOR,
                    pystray.MenuItem(f"● {self.email}", None, enabled=False),
                    pystray.MenuItem(f"  Hotkey: {HOTKEY}", None, enabled=False),
                    pystray.Menu.SEPARATOR,
                    pystray.MenuItem("Sair", lambda icon, item: self._quit()),
                )
                self.tray_icon = pystray.Icon("figoo", img, "figoo · Pendências", menu)
                self.tray_icon.run()

            threading.Thread(target=tray_thread, daemon=True).start()
            print(f"Ícone na bandeja iniciado. Hotkey: {HOTKEY}")
        else:
            # Sem pystray: abre a janela direto
            print("pystray não encontrado — abrindo janela direto.")
            self._open_capture()

    def _make_tray_icon(self):
        img  = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.ellipse([0, 0, 63, 63], fill='#2D5016')
        # folha
        draw.polygon([(32, 10), (14, 38), (32, 54), (50, 38)], fill='#C0DD97')
        draw.polygon([(32, 10), (32, 54), (50, 38)], fill='#5EAD24')
        draw.ellipse([27, 56, 37, 63], fill='#8B6914')
        return img

    # ── Janela de captura ──────────────────────────────
    def _open_capture(self):
        # Se já existe e está visível, traz para frente
        if self.cap_win and self.cap_win.winfo_exists():
            self.cap_win.deiconify()
            self.cap_win.lift()
            self.cap_win.focus_force()
            return
        self._build_capture()

    def _build_capture(self):
        win = tk.Toplevel(self.root)
        self.cap_win = win
        win.title("figoo · Captura Rápida")
        win.resizable(False, False)
        win.configure(bg=COR_WHITE)
        win.attributes('-topmost', True)
        self._center(win, 460, 370)

        # Fechar = esconder (para reaproveitar)
        win.protocol("WM_DELETE_WINDOW", win.withdraw)

        f = tk.Frame(win, bg=COR_WHITE, padx=20, pady=18)
        f.pack(fill='both', expand=True)

        # — Cabeçalho —
        hdr = tk.Frame(f, bg=COR_WHITE)
        hdr.pack(fill='x', pady=(0, 12))
        tk.Label(hdr, text="figoo", font=('Segoe UI', 10, 'bold'),
                 fg=COR_PRIMARY, bg=COR_WHITE).pack(side='left')
        tk.Label(hdr, text=" · captura rápida", font=('Segoe UI', 10),
                 fg=COR_TEXT2, bg=COR_WHITE).pack(side='left')
        hotkey_txt = f"  [{HOTKEY}]" if HAS_KEYBOARD else ""
        tk.Label(hdr, text=hotkey_txt, font=('Segoe UI', 8),
                 fg='#B0AEA6', bg=COR_WHITE).pack(side='left')
        tk.Label(hdr, text=f"  {self.email}", font=('Segoe UI', 8),
                 fg='#B0AEA6', bg=COR_WHITE).pack(side='right')

        # — Textarea —
        tk.Label(f, text="O que precisa fazer ou responder?",
                 font=('Segoe UI', 9), fg=COR_TEXT2, bg=COR_WHITE, anchor='w').pack(fill='x', pady=(0, 4))

        desc_text = tk.Text(f, height=4, font=('Segoe UI', 11), relief='solid', bd=1,
                            wrap='word', fg=COR_TEXT, bg='#F9F8F5',
                            insertbackground=COR_PRIMARY, padx=8, pady=6)
        desc_text.pack(fill='x', pady=(0, 10))

        # — Linha meta 1: quem + entidade + município —
        meta = tk.Frame(f, bg=COR_WHITE)
        meta.pack(fill='x', pady=(0, 6))

        for label, width in [("Quem pediu?", 14), ("Entidade", 16), ("Município", 14)]:
            tk.Label(meta, text=label, font=('Segoe UI', 8),
                     fg=COR_TEXT2, bg=COR_WHITE).pack(side='left', padx=(0,2))
            var = tk.StringVar()
            if label == "Quem pediu?":
                quem_var = var
            elif label == "Entidade":
                entidade_var = var
            else:
                municipio_var = var
            tk.Entry(meta, textvariable=var, font=('Segoe UI', 9),
                     relief='solid', bd=1, width=width, fg=COR_TEXT, bg='#F9F8F5'
                     ).pack(side='left', padx=(0, 10), ipady=3)

        # — Linha meta 2: urgência —
        meta2 = tk.Frame(f, bg=COR_WHITE)
        meta2.pack(fill='x', pady=(0, 8))

        tk.Label(meta2, text="Urgência:", font=('Segoe UI', 8),
                 fg=COR_TEXT2, bg=COR_WHITE).pack(side='left')
        urg_var = tk.StringVar(value='normal')
        for emoji, val in [('🔴', 'alta'), ('🟡', 'normal'), ('⚪', 'baixa')]:
            tk.Radiobutton(meta2, text=emoji, variable=urg_var, value=val,
                           bg=COR_WHITE, font=('Segoe UI', 12),
                           cursor='hand2', activebackground=COR_WHITE
                           ).pack(side='left', padx=1)

        # — Status —
        status_var = tk.StringVar()
        tk.Label(f, textvariable=status_var, font=('Segoe UI', 8),
                 fg=COR_SECONDARY, bg=COR_WHITE).pack(anchor='w', pady=(0, 4))

        # — Botões —
        bf = tk.Frame(f, bg=COR_WHITE)
        bf.pack(fill='x')

        def save(tipo):
            desc = desc_text.get('1.0', 'end').strip()
            if not desc:
                desc_text.focus_set()
                return
            btn_ret.config(state='disabled')
            btn_exe.config(state='disabled')
            status_var.set('Guardando…')
            win.config(cursor='wait')

            def do_save():
                try:
                    item = {
                        'id':        uid(),
                        'desc':      desc,
                        'quem':      quem_var.get().strip(),
                        'entidade':  entidade_var.get().strip(),
                        'municipio': municipio_var.get().strip(),
                        'tipo':      tipo,
                        'urgencia':  urg_var.get(),
                        'status':    'pendente',
                        'createdAt': int(time.time() * 1000),
                        'updatedAt': int(time.time() * 1000),
                        'doneAt':    None,
                    }
                    existing = firebase_get(f"pendencias/{self.email_key}/items")
                    if isinstance(existing, list):
                        items = existing
                    elif isinstance(existing, dict):
                        items = list(existing.values())
                    else:
                        items = []
                    items.insert(0, item)
                    firebase_put(f"pendencias/{self.email_key}/items", items)

                    def on_success():
                        status_var.set('✅  Guardado!')
                        desc_text.delete('1.0', 'end')
                        quem_var.set('')
                        entidade_var.set('')
                        municipio_var.set('')
                        btn_ret.config(state='normal')
                        btn_exe.config(state='normal')
                        win.config(cursor='')
                        desc_text.focus_set()
                        win.after(2500, lambda: status_var.set(''))
                    win.after(0, on_success)

                except Exception as e:
                    def on_error(err=e):
                        status_var.set(f'Erro: {err}')
                        btn_ret.config(state='normal')
                        btn_exe.config(state='normal')
                        win.config(cursor='')
                    win.after(0, on_error)

            threading.Thread(target=do_save, daemon=True).start()

        btn_ret = tk.Button(bf, text="↩  Preciso retornar",
                            command=lambda: save('retorno'),
                            bg=COR_RET_BG, fg=COR_RET_FG,
                            font=('Segoe UI', 10, 'bold'),
                            relief='flat', cursor='hand2', pady=10)
        btn_ret.pack(side='left', fill='x', expand=True, padx=(0, 6))

        btn_exe = tk.Button(bf, text="▶  Preciso executar",
                            command=lambda: save('executar'),
                            bg=COR_EXE_BG, fg=COR_EXE_FG,
                            font=('Segoe UI', 10, 'bold'),
                            relief='flat', cursor='hand2', pady=10)
        btn_exe.pack(side='left', fill='x', expand=True)

        # Atalhos de teclado
        desc_text.bind('<Control-Return>', lambda e: save('retorno'))
        desc_text.bind('<Escape>', lambda e: win.withdraw())
        desc_text.focus_set()

    # ── Helpers ────────────────────────────────────────
    @staticmethod
    def _center(win, w, h):
        win.update_idletasks()
        sw = win.winfo_screenwidth()
        sh = win.winfo_screenheight()
        win.geometry(f"{w}x{h}+{(sw-w)//2}+{(sh-h)//3}")

    def _quit(self):
        if HAS_KEYBOARD:
            try: keyboard.unhook_all()
            except Exception: pass
        if self.tray_icon:
            try: self.tray_icon.stop()
            except Exception: pass
        os._exit(0)


# ── Main ──────────────────────────────────────────────
if __name__ == '__main__':
    print("figoo · Captura Rápida  —  a iniciar…")
    if not HAS_CRYPTO:
        print("AVISO: instale 'cryptography' para verificação de senha (pip install cryptography)")
    if not HAS_TRAY:
        print("AVISO: instale 'pystray Pillow' para ícone na bandeja (pip install pystray Pillow)")
    if not HAS_KEYBOARD:
        print("AVISO: instale 'keyboard' para hotkey global (pip install keyboard)")
    FigooCaptura().run()
