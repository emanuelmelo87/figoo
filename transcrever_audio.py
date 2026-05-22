import sys
import os

def instalar_whisper():
    print("Instalando dependencias (pode demorar alguns minutos na primeira vez)...")
    os.system("pip install openai-whisper ffmpeg-python")

def transcrever(caminho_audio):
    try:
        import whisper
    except ImportError:
        instalar_whisper()
        import whisper

    if not os.path.exists(caminho_audio):
        print(f"Arquivo nao encontrado: {caminho_audio}")
        return

    print(f"\nCarregando modelo Whisper...")
    modelo = whisper.load_model("medium")  # 'tiny', 'base', 'small', 'medium', 'large'

    print(f"Transcrevendo: {caminho_audio}")
    resultado = modelo.transcribe(caminho_audio, language="pt")

    texto = resultado["text"].strip()

    # Salva em arquivo .txt com o mesmo nome do audio
    nome_saida = os.path.splitext(caminho_audio)[0] + "_transcricao.txt"
    with open(nome_saida, "w", encoding="utf-8") as f:
        f.write(texto)

    print("\n--- TRANSCRICAO ---")
    print(texto)
    print(f"\nSalvo em: {nome_saida}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python transcrever_audio.py <caminho_do_audio>")
        print("Exemplo: python transcrever_audio.py audio.ogg")
    else:
        transcrever(sys.argv[1])
