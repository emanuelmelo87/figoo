import asyncio
from notebooklm import NotebookLMClient

NOTEBOOK_ID = "72755151-9d60-4d9e-9aa0-566ab542e5b8"

async def main():
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.get(NOTEBOOK_ID)
        print(f"Conectado ao notebook: {nb.title}")

        # Lista fontes disponíveis
        sources = await client.sources.list(NOTEBOOK_ID)
        print(f"\nFontes carregadas ({len(sources)}):")
        for s in sources:
            print(f"  - {s.title}")

        # Perguntas para análise dos dados
        perguntas = [
            "Faça um resumo geral dos dados disponíveis",
            "Quais são os principais padrões ou tendências encontrados?",
            "Quais são os pontos mais importantes ou críticos?",
        ]

        print("\n" + "="*60)
        for pergunta in perguntas:
            print(f"\nPergunta: {pergunta}")
            print("-" * 60)
            result = await client.chat.ask(NOTEBOOK_ID, pergunta)
            print(f"Resposta: {result.answer}")
            print("="*60)

asyncio.run(main())
