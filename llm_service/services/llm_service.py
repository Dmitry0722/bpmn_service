import os
import json
from llama_cpp import Llama

class LLMService:
    def __init__(self):
        print(" Loading Local LLM (Qwen3-4B)...")
        try:
            self.llm = Llama.from_pretrained(
                repo_id="unsloth/Qwen3-4B-Instruct-2507-GGUF",
                filename="Qwen3-4B-Instruct-2507-UD-Q5_K_XL.gguf",
                n_ctx=8000, #Если текст очень большой и падает с ошибкой можно увеличить, но сейчас и так довольно много (8000 токенов)
                n_gpu_layers=-1,
                verbose=False
            )
            print(" Local LLM Loaded")
        except Exception as e:
            print(f" Failed to load local LLM: {e}")
            raise e

    def _clean_text(self, text: str) -> str:
        """Removes all special characters except alphanumeric, spaces, commas, dots, and dashes."""
        import re
        return re.sub(r'[^a-zA-Z0-9а-яА-ЯёЁ\s\.,\-]', '', text)

    async def analyze_requirements(self, doc_text: str, rag_context: str, user_context: str):
        clean_doc = self._clean_text(doc_text)
        clean_user = self._clean_text(user_context)
        clean_rag = self._clean_text(rag_context)

        system_instruction = """
        You are an expert Systems Analyst and BPMN Architect. Пиши на русском языке.
        Your goal is to convert technical requirements into a structured JSON process model and a Mermaid.js flowchart.
        
        FEW-SHOT EXAMPLE:
        Input: "Менеджер создает заявку. Система проверяет данные. Если данные верны, заявка сохраняется."
        Output:
        {
            "title": "Создание заявки",
            "description": "Процесс регистрации новой заявки в системе",
            "steps": [
                {"id": "start", "actor": "Менеджер", "action": "Создает заявку", "type": "start", "next": "check"},
                {"id": "check", "actor": "Система", "action": "Проверяет данные", "type": "decision", "next": "save", "condition": "Данные верны"},
                {"id": "save", "actor": "Система", "action": "Сохраняет заявку", "type": "end", "next": null}
            ],
            "mermaidCode": "flowchart LR\\n  subgraph Менеджер\\n    start['Создает заявку']\\n  end\\n  subgraph Система\\n    check{'Проверяет данные'}\\n    save['Сохраняет заявку']\\n  end\\n  start --> check\\n  check -- Данные верны --> save"
        }

        RULES FOR MERMAID:
        - Use `flowchart LR`.
        - Use subgraphs for Actors.
        - Use single quotes for labels: node_id['Label'].
        - NO parentheses () or braces {} inside subgraph titles or labels.
        - Use 'finish' or 'end_node' for end states.
        - Return ONLY valid JSON.
        """

        prompt = f"""
        INPUT DOCUMENT:
        {clean_doc}

        CONTEXT:
        {clean_user}
        {clean_rag}

        Generate the JSON process model based on the rules and example provided.
        """

        try:
            response = self.llm.create_chat_completion(
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4096,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            content = response["choices"][0]["message"]["content"]
            return self._parse_json(content)

        except Exception as e:
            print(f" LLM Analysis Error: {e}")
            raise e

    def _parse_json(self, content: str):
        """Helper to parse JSON with fallbacks."""
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        try:
            data = json.loads(content)
            if isinstance(data, dict) and "mermaidCode" in data:
                data["mermaidCode"] = data["mermaidCode"].replace('(', '').replace(')', '')
            return data
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    if isinstance(data, dict) and "mermaidCode" in data:
                        data["mermaidCode"] = data["mermaidCode"].replace('(', '').replace(')', '')
                    return data
                except json.JSONDecodeError:
                    pass
            raise ValueError("Could not parse JSON from LLM response")
